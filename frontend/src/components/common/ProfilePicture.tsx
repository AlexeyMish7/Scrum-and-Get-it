import React, { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Typography,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import crud from "../../services/crud";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];
const TARGET_SIZE = 512; // square 512x512
const BUCKET = "projects"; // using existing bucket (first path segment must be user id per policies)

async function resizeImageToSquare(file: File, size = TARGET_SIZE) {
  return new Promise<Blob | null>((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = (e) => reject(e);
    reader.onload = () => {
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);

          // compute crop to center and maintain aspect ratio
          const { width: w, height: h } = img;
          const minSide = Math.min(w, h);
          const sx = (w - minSide) / 2;
          const sy = (h - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

          canvas.toBlob((blob) => {
            resolve(blob ?? null);
          }, "image/png");
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(e);
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const ProfilePicture: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [metaPath, setMetaPath] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    preview: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user || authLoading) return;

      // read profile meta to find avatar path
      const res = await crud.getUserProfile(user.id);
      if (res.error) return;
      const p = res.data as Record<string, unknown> | null;
      type ProfileMeta = {
        avatar_path?: string | null;
        avatar_bucket?: string | null;
      } & Record<string, unknown>;
      const meta = (p?.meta as ProfileMeta | undefined) ?? null;
      const avatar_path = meta?.avatar_path ?? null;
      const avatar_bucket = meta?.avatar_bucket ?? BUCKET;
      if (!mounted) return;
      setMetaPath(avatar_path);

      if (!avatar_path) {
        setAvatarUrl(null);
        return;
      }

      try {
        const cacheKey = `avatar:${avatar_bucket}:${avatar_path}`;
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as {
              url: string;
              expiresAt: number;
            };
            if (Date.now() < parsed.expiresAt - 10_000) {
              if (mounted) setAvatarUrl(parsed.url);
              return;
            }
            localStorage.removeItem(cacheKey);
          } catch {
            localStorage.removeItem(cacheKey);
          }
        }

        const { data, error } = await supabase.storage
          .from(avatar_bucket)
          .createSignedUrl(avatar_path, 60 * 60);
        if (error) throw error;
        const signed = data.signedUrl ?? null;
        if (mounted) {
          setAvatarUrl(signed);
          if (signed) {
            try {
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  url: signed,
                  expiresAt: Date.now() + 60 * 60 * 1000,
                })
              );
            } catch {
              /* ignore */
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load avatar", err);
        if (mounted) setAvatarUrl(null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  // Revoke object URLs for pending previews when pendingFile changes or on unmount
  useEffect(() => {
    return () => {
      try {
        if (
          pendingFile &&
          pendingFile.preview &&
          pendingFile.preview.startsWith("blob:")
        ) {
          URL.revokeObjectURL(pendingFile.preview);
        }
      } catch {
        /* ignore */
      }
    };
  }, [pendingFile]);

  if (!user) return null;

  const onChooseClick = () => fileRef.current?.click();

  const handleFile = async (file?: File) => {
    setError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Use JPG, PNG or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large. Max size is 5MB.");
      return;
    }

    setProcessing(true);
    setProgress(5);

    let createdPreview: string | null = null;
    try {
      // preview stage (fast) - reuse pending preview if available
      const previewUrl =
        pendingFile && pendingFile.file === file
          ? pendingFile.preview
          : URL.createObjectURL(file);
      if (previewUrl && (!pendingFile || pendingFile.file !== file))
        createdPreview = previewUrl;
      setAvatarUrl(previewUrl);
      setProgress(20);

      // resize to square PNG
      const blob = await resizeImageToSquare(file, TARGET_SIZE);
      if (!blob) throw new Error("Failed to process image");
      setProgress(50);

      // prepare path: must start with user id as first segment to satisfy storage policies
      const path = `${user.id}/avatar.png`;

      // try to remove existing avatar first (silent)
      try {
        if (metaPath) {
          await supabase.storage
            .from(BUCKET)
            .remove([metaPath])
            .catch((e) => console.warn("remove existing avatar failed", e));
        }
      } catch (e) {
        console.warn("remove existing avatar failed", e);
      }

      // upload blob
      const fileName = path; // we use fixed name so replace is simple
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, blob, { contentType: "image/png", upsert: true });

      if (upErr) throw upErr;
      setProgress(85);

      // persist meta in profiles.meta
      await crud.updateUserProfile(user.id, {
        meta: {
          ...((await crud.getUserProfile(user.id)).data?.meta ?? {}),
          avatar_path: fileName,
          avatar_bucket: BUCKET,
        },
      });

      // create signed URL for display
      const { data: signedData, error: signedErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(fileName, 60 * 60);
      if (signedErr) {
        console.warn("createSignedUrl error", signedErr);
      }
      const signed = signedData?.signedUrl ?? null;
      setAvatarUrl(signed);
      setMetaPath(fileName);
      // cache signed url to reduce reloads during navigation
      if (signed) {
        try {
          localStorage.setItem(
            `avatar:${BUCKET}:${fileName}`,
            JSON.stringify({
              url: signed,
              expiresAt: Date.now() + 60 * 60 * 1000,
            })
          );
        } catch {
          /* ignore */
        }
      }
      // clear pending preview and revoke any created blob URL
      try {
        if (
          pendingFile &&
          pendingFile.preview &&
          pendingFile.preview.startsWith("blob:")
        ) {
          URL.revokeObjectURL(pendingFile.preview);
        }
      } catch {
        /* ignore */
      }
      setPendingFile(null);
      if (createdPreview && createdPreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(createdPreview);
        } catch {
          /* ignore */
        }
      }
      setProgress(100);
    } catch (err: unknown) {
      console.error("Avatar upload failed", err);
      let msg = "Upload failed";
      if (err instanceof Error) msg = err.message;
      else msg = String(err);
      setError(msg ?? "Upload failed");
    } finally {
      // brief delay so progress reaches 100 for UX
      setTimeout(() => {
        setProcessing(false);
        setProgress(0);
      }, 500);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      // validate quickly and show preview; upload only after confirm
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError("Invalid file type. Use JPG, PNG or GIF.");
        e.currentTarget.value = "";
        return;
      }
      if (f.size > MAX_BYTES) {
        setError("File is too large. Max size is 5MB.");
        e.currentTarget.value = "";
        return;
      }
      const previewUrl = URL.createObjectURL(f);
      setPendingFile({ file: f, preview: previewUrl });
      setAvatarUrl(previewUrl);
    }
    e.currentTarget.value = ""; // reset so same file can be picked again
  };

  const handleRemove = async () => {
    if (!metaPath) return;
    setProcessing(true);
    try {
      await supabase.storage.from(BUCKET).remove([metaPath]);
    } catch (err) {
      console.warn("Failed to remove avatar from storage", err);
    }
    try {
      // remove meta
      await crud.updateUserProfile(user.id, {
        meta: {
          ...((await crud.getUserProfile(user.id)).data?.meta ?? {}),
          avatar_path: null,
        },
      });
    } catch (err) {
      console.warn("Failed to remove avatar meta", err);
    }
    setAvatarUrl(null);
    setMetaPath(null);
    setProcessing(false);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <Avatar
        src={avatarUrl ?? undefined}
        alt="Profile avatar"
        sx={{ width: 96, height: 96 }}
      >
        {!avatarUrl && (user?.email?.charAt(0)?.toUpperCase() ?? "U")}
      </Avatar>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box>
          {!pendingFile ? (
            <>
              <Button
                startIcon={<PhotoCamera />}
                onClick={onChooseClick}
                disabled={processing}
              >
                {metaPath ? "Replace" : "Upload"}
              </Button>
              {metaPath && (
                <Tooltip title="Remove avatar">
                  <IconButton onClick={handleRemove} disabled={processing}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Button
                color="primary"
                onClick={() => handleFile(pendingFile.file)}
                disabled={processing}
              >
                Confirm
              </Button>
              <Button
                color="inherit"
                onClick={() => {
                  // cancel pending
                  setPendingFile(null);
                  setError(null);
                  // reload current avatar preview if available
                  if (metaPath) {
                    // try to use cached signed url first
                    try {
                      const raw = localStorage.getItem(
                        `avatar:${BUCKET}:${metaPath}`
                      );
                      if (raw) {
                        const parsed = JSON.parse(raw) as {
                          url: string;
                          expiresAt: number;
                        };
                        if (Date.now() < parsed.expiresAt - 10_000) {
                          setAvatarUrl(parsed.url);
                          return;
                        }
                        localStorage.removeItem(`avatar:${BUCKET}:${metaPath}`);
                      }
                    } catch {
                      localStorage.removeItem(`avatar:${BUCKET}:${metaPath}`);
                    }
                    supabase.storage
                      .from(BUCKET)
                      .createSignedUrl(metaPath, 60 * 60)
                      .then(({ data }) => {
                        const signed = data?.signedUrl ?? null;
                        setAvatarUrl(signed);
                        if (signed) {
                          try {
                            localStorage.setItem(
                              `avatar:${BUCKET}:${metaPath}`,
                              JSON.stringify({
                                url: signed,
                                expiresAt: Date.now() + 60 * 60 * 1000,
                              })
                            );
                          } catch {
                            /* ignore */
                          }
                        }
                      })
                      .catch(() => setAvatarUrl(null));
                  }
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>

        {processing && (
          <Box sx={{ width: 240 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption">
              Processing... {Math.round(progress)}%
            </Typography>
          </Box>
        )}

        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ProfilePicture;
