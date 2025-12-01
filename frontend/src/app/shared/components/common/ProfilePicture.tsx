import React, { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import crud from "../../services/crud";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";

// ProfilePicture
// Handles user avatar display, interactive cropping, upload to Supabase Storage,
// and bookkeeping in the `documents` table + `profiles.meta` for cleanup.
// Important notes:
// - Uses a short-lived signed URL to display private storage objects.
// - Uses centralized error handling via `useErrorHandler()`.
// - Keeps the UI responsive by showing a preview and a progress indicator.

// Limits and configuration for avatar uploads
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif"];
// We standardize avatar images to a square PNG of TARGET_SIZE to keep
// presentation consistent across the app and avoid runtime resizing.
const TARGET_SIZE = 512; // square 512x512
// Storage bucket used for avatars. Supabase RLS policies expect the
// first path segment to be the user id for per-user isolation.
const BUCKET = "avatars";

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

// Create cropped image blob from an <img> element and a crop rect
// Notes: ReactCrop provides crop dimensions relative to the displayed
// image; we must scale those to the image's natural size before
// drawing to the canvas to preserve resolution.
async function getCroppedImg(image: HTMLImageElement, crop: Crop) {
  return new Promise<{ blob: Blob; dataUrl: string }>((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Failed to get canvas context"));

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const px = crop.x ?? 0;
      const py = crop.y ?? 0;
      const pwidth = crop.width ?? image.width;
      const pheight = crop.height ?? image.height;

      // Use pixel sizes for canvas
      canvas.width = Math.round(pwidth);
      canvas.height = Math.round(pheight);

      ctx.drawImage(
        image,
        px * scaleX,
        py * scaleY,
        pwidth * scaleX,
        pheight * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Failed to produce blob"));
          const dataUrl = canvas.toDataURL("image/png");
          resolve({ blob, dataUrl });
        },
        "image/png",
        0.9
      );
    } catch (err) {
      reject(err);
    }
  });
}

const ProfilePicture: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { handleError, notification, closeNotification, showSuccess } =
    useErrorHandler();
  const { confirm } = useConfirmDialog();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [metaPath, setMetaPath] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  // local error state removed in favor of centralized ErrorSnackbar via useErrorHandler
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    preview: string;
  } | null>(null);
  // Crop dialog state (for interactive cropping before upload)
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completedCrop, setCompletedCrop] = useState<Crop | undefined>();
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [displayInitial, setDisplayInitial] = useState<string>(
    (user?.email?.charAt(0)?.toUpperCase() as string) ?? "U"
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user || authLoading) return;

      // Read the user's profile row to find avatar metadata. The profile's
      // `meta` JSON column may contain avatar_path/avatar_bucket which we use
      // to construct a signed URL for display.
      const res = await crud.getUserProfile(user.id);
      if (res.error) return;
      const p = res.data as Record<string, unknown> | null;
      // determine display initial from profile first_name/full_name or fallback to email
      try {
        const firstName = (p && (p.first_name as string)) ?? null;
        const fullName = (p && (p.full_name as string)) ?? null;
        const source = firstName || fullName || user.email || "";
        const initial = String(source).trim().charAt(0)?.toUpperCase() || "U";
        setDisplayInitial(initial);
      } catch {
        setDisplayInitial(user?.email?.charAt(0)?.toUpperCase() ?? "U");
      }
      type ProfileMeta = {
        avatar_path?: string | null;
        avatar_bucket?: string | null;
      } & Record<string, unknown>;
      const metadata = (p?.metadata as ProfileMeta | undefined) ?? null;
      const avatar_path = metadata?.avatar_path ?? null;
      const avatar_bucket = metadata?.avatar_bucket ?? BUCKET;
      if (!mounted) return;
      setMetaPath(avatar_path);

      if (!avatar_path) {
        setAvatarUrl(null);
        return;
      }

      try {
        // If the stored avatar_path is an external URL (e.g. LinkedIn CDN),
        // use it directly instead of trying to sign a storage object.
        if (
          typeof avatar_path === "string" &&
          /^https?:\/\//.test(avatar_path)
        ) {
          setAvatarUrl(avatar_path);
          return;
        }

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
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      handleError(new Error("Invalid file type. Use JPG, PNG or GIF."));
      return;
    }
    if (file.size > MAX_BYTES) {
      handleError(new Error("File is too large. Max size is 5MB."));
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
        if (metaPath && !/^https?:\/\//.test(String(metaPath))) {
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

      // Ensure a profiles row exists BEFORE updating metadata
      try {
        const existingProfile = await crud.getUserProfile(user.id);
        if (!existingProfile.data) {
          // Create a minimal profile with required fields
          const emailPrefix = user.email?.split("@")[0] ?? "User";
          await crud.upsertRow(
            "profiles",
            {
              id: user.id,
              first_name: emailPrefix,
              last_name: "",
              email: user.email?.toLowerCase() ?? null,
            },
            "id"
          );
        }
      } catch (e) {
        console.warn("Failed to ensure profile exists", e);
        throw new Error("Could not create profile. Please try again.");
      }

      // persist metadata in profiles.metadata
      try {
        const profileRes = await crud.getUserProfile(user.id);
        const existingMetadata =
          (profileRes.data as Record<string, unknown> | null)?.metadata ?? {};
        await crud.updateUserProfile(user.id, {
          metadata: {
            ...(existingMetadata as Record<string, unknown>),
            avatar_path: fileName,
            avatar_bucket: BUCKET,
          },
        });
      } catch (e) {
        console.warn("Failed to persist avatar metadata", e);
        throw new Error("Could not save avatar metadata. Please try again.");
      }

      // create signed URL for display (only for storage-stored avatars)
      let signed: string | null = null;
      try {
        const { data: signedData, error: signedErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(fileName, 60 * 60);
        if (signedErr) {
          console.warn("createSignedUrl error", signedErr);
        }
        signed = signedData?.signedUrl ?? null;
      } catch (err) {
        console.warn("createSignedUrl error", err);
      }
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

      // Notify other components (like GlobalTopBar) that avatar has been updated
      window.dispatchEvent(new Event("avatar:updated"));
    } catch (err: unknown) {
      console.error("Avatar upload failed", err);
      handleError(err);
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
        handleError(new Error("Invalid file type. Use JPG, PNG or GIF."));
        e.currentTarget.value = "";
        return;
      }
      if (f.size > MAX_BYTES) {
        handleError(new Error("File is too large. Max size is 5MB."));
        e.currentTarget.value = "";
        return;
      }
      // open interactive crop dialog (reuse crop pattern used elsewhere)
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result);
        setImgSrc(src);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(f);
      // remember original file until user applies crop
      setPendingFile({ file: f, preview: "" });
    }
    e.currentTarget.value = ""; // reset so same file can be picked again
  };

  const handleRemove = async () => {
    if (!metaPath) return;
    setProcessing(true);
    try {
      // remove storage object
      try {
        await supabase.storage.from(BUCKET).remove([metaPath]);
      } catch (err) {
        console.warn("Failed to remove avatar from storage", err);
      }

      // clear profile metadata
      try {
        const profileRes = await crud.getUserProfile(user.id);
        const existingMetadata =
          (profileRes.data as Record<string, unknown> | null)?.metadata ?? {};
        await crud.updateUserProfile(user.id, {
          metadata: {
            ...(existingMetadata as Record<string, unknown>),
            avatar_path: null,
            avatar_bucket: null,
          },
        });
      } catch (err) {
        console.warn("Failed to remove avatar metadata", err);
      }
    } catch (err) {
      console.warn("Unexpected error removing avatar", err);
    }
    setAvatarUrl(null);
    setMetaPath(null);
    setProcessing(false);
    showSuccess("Avatar removed successfully!");

    // Dispatch event to notify other components to reload
    window.dispatchEvent(new Event("avatar:updated"));
  };

  // Apply crop from dialog -> replace pendingFile with cropped File and preview
  const handleCropApply = async () => {
    if (!imgRef || !completedCrop || !pendingFile) {
      handleError(new Error("Missing crop data"));
      return;
    }
    try {
      const { blob, dataUrl } = await getCroppedImg(imgRef, completedCrop);
      const croppedFile = new File([blob], `cropped_${pendingFile.file.name}`, {
        type: blob.type,
      });
      setPendingFile({ file: croppedFile, preview: dataUrl });
      setAvatarUrl(dataUrl);
      setShowCropDialog(false);
    } catch (err) {
      console.error("Crop failed", err);
      handleError(err);
    }
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
        sx={{
          width: 96,
          height: 96,
          // glossy gradient background when no avatar image is present
          ...(avatarUrl
            ? {}
            : {
                background: "linear-gradient(135deg,#6a11cb,#2575fc)",
                color: "#fff",
                fontWeight: "bold",
              }),
        }}
      >
        {!avatarUrl ? displayInitial : null}
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
                <>
                  <Tooltip title="Remove avatar">
                    <IconButton
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Delete avatar",
                          message:
                            "Are you sure you want to delete your avatar? This will remove the image from storage and your profile.",
                          confirmText: "Delete",
                          confirmColor: "error",
                        });
                        if (confirmed) {
                          await handleRemove();
                          showSuccess("Avatar removed");
                        }
                      }}
                      disabled={processing}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
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
                  closeNotification();
                  // reload current avatar preview if available
                  if (metaPath) {
                    // If metaPath is an external URL, use it directly
                    if (/^https?:\/\//.test(String(metaPath))) {
                      setAvatarUrl(String(metaPath));
                      return;
                    }
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
        {/* centralized notification snackbar */}
        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
      {/* Crop Dialog - interactive crop before confirming upload */}
      <Dialog
        open={showCropDialog}
        onClose={() => setShowCropDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crop Your Avatar</DialogTitle>
        <DialogContent>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
            >
              <Box
                component="img"
                src={imgSrc}
                onLoad={(e) => setImgRef(e.currentTarget as HTMLImageElement)}
                alt="Crop preview"
                sx={{ maxWidth: "100%", maxHeight: 400 }}
              />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCropDialog(false)}>Cancel</Button>
          <Button onClick={handleCropApply} variant="contained">
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePicture;
