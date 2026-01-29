import { Box, IconButton, Paper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { ImageAttachment } from "../../types";

interface ImagePreviewProps {
  images: ImageAttachment[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

/**
 * Displays a preview of attached images with remove functionality
 */
export function ImagePreview({ images, onRemove, disabled }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1, px: 1 }}>
      {images.map((image) => (
        <Paper
          key={image.id}
          elevation={1}
          sx={{
            position: "relative",
            width: 80,
            height: 80,
            borderRadius: 1,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <img
            src={`data:${image.mediaType};base64,${image.base64Data}`}
            alt={image.filename}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {!disabled && (
            <IconButton
              size="small"
              onClick={() => onRemove(image.id)}
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                bgcolor: "rgba(0,0,0,0.5)",
                color: "white",
                p: 0.25,
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              }}
              title="Remove image"
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: "rgba(0,0,0,0.5)",
              px: 0.5,
              py: 0.25,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "white",
                fontSize: "0.6rem",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {formatFileSize(image.size)}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
