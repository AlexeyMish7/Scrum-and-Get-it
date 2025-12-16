import * as http from "http";
import type { IncomingHttpHeaders } from "http";
import type { AddressInfo } from "net";
import * as zlib from "zlib";

import { createServer } from "@server/server";

export type TestServer = {
  baseUrl: string;
  close: () => Promise<void>;
};

export async function startTestServer(): Promise<TestServer> {
  const server = createServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected server to be listening on a TCP port");
  }

  const { port } = address as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}

function normalizeHeaderValue(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? value.join(",") : value;
}

export async function httpRequest(options: {
  baseUrl: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}): Promise<{
  status: number;
  headers: IncomingHttpHeaders;
  rawBody: Buffer;
  text: string;
  json: unknown | null;
}> {
  const url = new URL(options.path, options.baseUrl);

  const requestBody =
    options.body === undefined
      ? undefined
      : Buffer.from(JSON.stringify(options.body));

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(requestBody ? { "Content-Type": "application/json" } : {}),
    ...(requestBody
      ? { "Content-Length": String(requestBody.byteLength) }
      : {}),
    ...(options.headers || {}),
  };

  return await new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method,
        headers,
      },
      (res: http.IncomingMessage) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer | string) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        );
        res.on("end", () => {
          const buf = Buffer.concat(chunks);

          const encoding = normalizeHeaderValue(
            res.headers["content-encoding"]
          );
          const decoded = encoding.includes("gzip")
            ? zlib.gunzipSync(buf)
            : buf;

          const text = decoded.toString("utf8");
          const ct = normalizeHeaderValue(res.headers["content-type"]);
          const json = ct.includes("application/json")
            ? (() => {
                try {
                  return JSON.parse(text);
                } catch {
                  return null;
                }
              })()
            : null;

          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            rawBody: decoded,
            text,
            json,
          });
        });
        res.on("error", reject);
      }
    );

    req.on("error", reject);

    if (requestBody) {
      req.write(requestBody);
    }

    req.end();
  });
}
