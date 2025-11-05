import * as crud from "@shared/services/crud";
import { supabase } from "@shared/services/supabaseClient";
import type {
  CertificationRow,
  Certification,
} from "@profile/types/certification";

const mapRowToCertification = (r: CertificationRow): Certification => ({
  id: r.id,
  name: r.name ?? "",
  organization: r.issuing_org ?? "",
  category: r.category ?? "",
  dateEarned: r.date_earned ?? "",
  expirationDate: r.expiration_date ?? undefined,
  doesNotExpire: Boolean(r.does_not_expire ?? false),
  certId: r.cert_id ?? undefined,
  media_path: typeof r.media_path === "string" ? r.media_path : null,
  mediaUrl: null,
  verification_status: r.verification_status ?? null,
});

const resolveMediaUrl = async (
  mediaPath: string | null
): Promise<string | null> => {
  if (!mediaPath) return null;
  try {
    const { data: signedData, error: signedErr } = await supabase.storage
      .from("certifications")
      .createSignedUrl(mediaPath, 60 * 60);
    if (!signedErr && signedData) {
      // supabase clients may return signedUrl or signedURL depending on version
      const signedAny = signedData as unknown as Record<string, unknown> | null;
      const candidate = (signedAny &&
        (signedAny["signedUrl"] ??
          signedAny["signedURL"] ??
          signedAny["signed_url"])) as string | undefined;
      if (candidate) return String(candidate);
    }

    const { data: pub } = await supabase.storage
      .from("certifications")
      .getPublicUrl(mediaPath);
    if (pub) {
      const pAny = pub as unknown as Record<string, unknown> | null;
      const publicCandidate = (pAny &&
        (pAny["publicUrl"] ?? pAny["publicURL"] ?? pAny["public_url"])) as
        | string
        | undefined;
      if (publicCandidate) return String(publicCandidate);
    }
  } catch (err) {
    console.warn("resolveMediaUrl error", err);
  }
  return null;
};

const listCertifications = async (userId: string) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.listRows<CertificationRow>("certifications", "*", {
    order: { column: "date_earned", ascending: false },
  });
};

const getCertification = async (userId: string, id: string) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.getRow<CertificationRow>("certifications", "*", {
    eq: { id },
    single: true,
  });
};

// Insert certification and optionally upload file + create documents row
const insertCertification = async (
  userId: string,
  payload: Partial<CertificationRow>,
  file?: File | null
) => {
  const userCrud = crud.withUser(userId);
  let mediaPath: string | null = null;

  try {
    if (file) {
      const key = `${userId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("certifications")
        .upload(key, file);
      if (uploadError) throw uploadError;
      mediaPath = uploadData.path;
      payload.media_path = mediaPath;
    }

    const res = await userCrud.insertRow("certifications", payload, "*");
    if (res.error) {
      // cleanup uploaded file on failure
      if (mediaPath) {
        try {
          await supabase.storage.from("certifications").remove([mediaPath]);
        } catch (cleanupErr) {
          console.warn(
            "Failed to cleanup uploaded certification file:",
            cleanupErr
          );
        }
      }
      return res;
    }

    const created = res.data as CertificationRow;

    // create documents record pointing to the uploaded file (if any)
    let createdDoc: Record<string, unknown> | null = null;
    if (mediaPath && file) {
      try {
        const docPayload: Record<string, unknown> = {
          kind: "other",
          file_name: file.name,
          file_path: mediaPath,
          mime_type: file.type || null,
          bytes: file.size || null,
          meta: { source: "certification", certification_id: created.id },
        };
        const docRes = await userCrud.insertRow("documents", docPayload, "*");
        if (!docRes.error) {
          createdDoc = docRes.data as Record<string, unknown>;
          window.dispatchEvent(new Event("documents:changed"));
        } else {
          console.warn(
            "Failed to create documents row for certification:",
            docRes.error
          );
        }
      } catch (err) {
        console.warn("Failed to insert documents row for certification", err);
      }
    }

    return { data: created, error: null, document: createdDoc } as {
      data: CertificationRow | null;
      error: null;
      document?: Record<string, unknown> | null;
    };
  } catch (err) {
    return { data: null, error: err } as { data: null; error: unknown };
  }
};

const updateCertification = async (
  userId: string,
  id: string,
  payload: Partial<CertificationRow>
) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.updateRow("certifications", payload, { eq: { id } });
};

const deleteCertification = async (userId: string, id: string) => {
  const userCrud = crud.withUser(userId);
  try {
    // try to find documents linked and remove files
    const docsRes = await userCrud.listRows<{ id: string; file_path?: string }>(
      "documents",
      "id,file_path",
      {
        eq: { meta: { certification_id: id } as unknown as string },
      }
    );
    // remove any files referenced by documents rows
    if (!docsRes.error && Array.isArray(docsRes.data)) {
      for (const d of docsRes.data) {
        if (d && d.file_path) {
          try {
            await supabase.storage.from("certifications").remove([d.file_path]);
          } catch (err) {
            console.warn("Failed to remove certification document file:", err);
          }
        }
      }

      // delete the documents rows themselves
      try {
        await userCrud.deleteRow("documents", {
          eq: { meta: { certification_id: id } as unknown as string },
        });
        window.dispatchEvent(new Event("documents:changed"));
      } catch (err) {
        console.warn("Failed to delete documents rows for certification:", err);
      }
    }

    // fallback: look by file_path via certification row
    const certRes = await userCrud.getRow<CertificationRow>(
      "certifications",
      "*",
      { eq: { id }, single: true }
    );
    if (
      !certRes.error &&
      certRes.data &&
      (certRes.data.media_path as string | undefined)
    ) {
      try {
        await supabase.storage
          .from("certifications")
          .remove([certRes.data.media_path as string]);
      } catch (err) {
        console.warn("Failed to remove certification media file", err);
      }
    }

    return await userCrud.deleteRow("certifications", { eq: { id } });
  } catch (err) {
    console.error("deleteCertification error", err);
    return { error: err } as { error: unknown };
  }
};

export default {
  mapRowToCertification,
  resolveMediaUrl,
  listCertifications,
  getCertification,
  insertCertification,
  updateCertification,
  deleteCertification,
};
