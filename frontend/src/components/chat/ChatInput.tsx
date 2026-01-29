import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Box,
  TextField,
  IconButton,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import StopIcon from "@mui/icons-material/Stop";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";
import { useTranslation } from "react-i18next";
import { KEYBOARD_SHORTCUTS } from "../../utils/constants";
import { useEnterBehavior } from "../../hooks/useSettings";
import { PermissionInputPanel } from "./PermissionInputPanel";
import { PlanPermissionInputPanel } from "./PlanPermissionInputPanel";
import { ImagePreview } from "./ImagePreview";
import type { PermissionMode, ImageAttachment } from "../../types";

interface PermissionData {
  patterns: string[];
  onAllow: () => void;
  onAllowPermanent: () => void;
  onDeny: () => void;
  getButtonClassName?: (
    buttonType: "allow" | "allowPermanent" | "deny",
    defaultClassName: string,
  ) => string;
  onSelectionChange?: (selection: "allow" | "allowPermanent" | "deny") => void;
  externalSelectedOption?: "allow" | "allowPermanent" | "deny" | null;
}

interface PlanPermissionData {
  onAcceptWithEdits: () => void;
  onAcceptDefault: () => void;
  onKeepPlanning: () => void;
  getButtonClassName?: (
    buttonType: "acceptWithEdits" | "acceptDefault" | "keepPlanning",
    defaultClassName: string,
  ) => string;
  onSelectionChange?: (
    selection: "acceptWithEdits" | "acceptDefault" | "keepPlanning",
  ) => void;
  externalSelectedOption?:
    | "acceptWithEdits"
    | "acceptDefault"
    | "keepPlanning"
    | null;
}

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  currentRequestId: string | null;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onAbort: () => void;
  // Permission mode props
  permissionMode: PermissionMode;
  onPermissionModeChange: (mode: PermissionMode) => void;
  showPermissions?: boolean;
  permissionData?: PermissionData;
  planPermissionData?: PlanPermissionData;
  // Image upload props
  images?: ImageAttachment[];
  isUploading?: boolean;
  onImageUpload?: (files: FileList) => void;
  onImageRemove?: (id: string) => void;
}

export function ChatInput({
  input,
  isLoading,
  currentRequestId,
  onInputChange,
  onSubmit,
  onAbort,
  permissionMode,
  onPermissionModeChange,
  showPermissions = false,
  permissionData,
  planPermissionData,
  images = [],
  isUploading = false,
  onImageUpload,
  onImageRemove,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { enterBehavior } = useEnterBehavior();
  const { t } = useTranslation();

  // Focus input when not loading and not in permission mode
  useEffect(() => {
    if (!isLoading && !showPermissions && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, showPermissions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Permission mode toggle: Ctrl+Shift+M (all platforms)
    if (
      e.key === KEYBOARD_SHORTCUTS.PERMISSION_MODE_TOGGLE &&
      e.shiftKey &&
      e.ctrlKey &&
      !e.metaKey &&
      !isComposing
    ) {
      e.preventDefault();
      onPermissionModeChange(getNextPermissionMode(permissionMode));
      return;
    }

    if (e.key === KEYBOARD_SHORTCUTS.SUBMIT && !isComposing) {
      if (enterBehavior === "newline") {
        handleNewlineModeKeyDown(e);
      } else {
        handleSendModeKeyDown(e);
      }
    }
  };

  const handleNewlineModeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSendModeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setTimeout(() => setIsComposing(false), 0);
  };

  const getPermissionModeIndicator = (mode: PermissionMode): string => {
    switch (mode) {
      case "default":
        return "normal mode";
      case "plan":
        return "plan mode";
      case "acceptEdits":
        return "accept edits";
    }
  };

  const getPermissionModeName = (mode: PermissionMode): string => {
    switch (mode) {
      case "default":
        return "normal mode";
      case "plan":
        return "plan mode";
      case "acceptEdits":
        return "accept edits";
    }
  };

  const getNextPermissionMode = (current: PermissionMode): PermissionMode => {
    const modes: PermissionMode[] = ["default", "plan", "acceptEdits"];
    const currentIndex = modes.indexOf(current);
    return modes[(currentIndex + 1) % modes.length];
  };

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0 && onImageUpload) {
        onImageUpload(e.target.files);
      }
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onImageUpload],
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onImageUpload) {
        // Filter for image files only
        const imageFiles = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith("image/"),
        );
        if (imageFiles.length > 0) {
          const dt = new DataTransfer();
          imageFiles.forEach((file) => dt.items.add(file));
          onImageUpload(dt.files);
        }
      }
    },
    [onImageUpload],
  );

  // Click to open file picker
  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Check if send should be enabled (has text OR images)
  const canSend = (input.trim() || images.length > 0) && !isLoading;

  // If we're in plan permission mode, show the plan permission panel instead
  if (showPermissions && planPermissionData) {
    return (
      <PlanPermissionInputPanel
        onAcceptWithEdits={planPermissionData.onAcceptWithEdits}
        onAcceptDefault={planPermissionData.onAcceptDefault}
        onKeepPlanning={planPermissionData.onKeepPlanning}
        getButtonClassName={planPermissionData.getButtonClassName}
        onSelectionChange={planPermissionData.onSelectionChange}
        externalSelectedOption={planPermissionData.externalSelectedOption}
      />
    );
  }

  // If we're in regular permission mode, show the permission panel instead
  if (showPermissions && permissionData) {
    return (
      <PermissionInputPanel
        patterns={permissionData.patterns}
        onAllow={permissionData.onAllow}
        onAllowPermanent={permissionData.onAllowPermanent}
        onDeny={permissionData.onDeny}
        getButtonClassName={permissionData.getButtonClassName}
        onSelectionChange={permissionData.onSelectionChange}
        externalSelectedOption={permissionData.externalSelectedOption}
      />
    );
  }

  return (
    <Box sx={{ flexShrink: 0 }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Paper
        component="form"
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          p: 1,
          border: 2,
          borderColor: isDragOver ? "primary.main" : "divider",
          borderRadius: 3,
          bgcolor: isDragOver ? "action.hover" : "background.paper",
          transition: "border-color 0.2s, background-color 0.2s",
        }}
      >
        {/* Image preview */}
        {images.length > 0 && (
          <ImagePreview
            images={images}
            onRemove={onImageRemove || (() => {})}
            disabled={isLoading}
          />
        )}

        {/* Input row */}
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
          {/* Image upload button */}
          {onImageUpload && (
            <IconButton
              onClick={handleImageButtonClick}
              disabled={isLoading || isUploading}
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "primary.main",
                },
                mb: 0.5,
              }}
              title={t("chat.attachImage")}
            >
              {isUploading ? (
                <CircularProgress size={20} />
              ) : (
                <ImageIcon fontSize="small" />
              )}
            </IconButton>
          )}

          <TextField
            inputRef={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={
              isLoading && currentRequestId
                ? t("status.processing")
                : isDragOver
                  ? t("chat.dropImage")
                  : t("chat.placeholder")
            }
            multiline
            maxRows={10}
            disabled={isLoading}
            fullWidth
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                px: 1,
                py: 0.5,
                fontSize: "0.95rem",
                minHeight: 48,
              },
            }}
          />

          <Box sx={{ display: "flex", gap: 0.5, pb: 0.5 }}>
            {isLoading && currentRequestId && (
              <IconButton
                onClick={onAbort}
                size="small"
                sx={{
                  bgcolor: "error.main",
                  color: "white",
                  "&:hover": {
                    bgcolor: "error.dark",
                  },
                }}
                title="Stop (ESC)"
              >
                <StopIcon fontSize="small" />
              </IconButton>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={!canSend}
              size="small"
              endIcon={<SendIcon />}
              sx={{
                minWidth: 80,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              {isLoading
                ? "..."
                : permissionMode === "plan"
                  ? "Plan"
                  : t("actions.send")}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Permission mode status bar */}
      <Box
        component="button"
        type="button"
        onClick={() =>
          onPermissionModeChange(getNextPermissionMode(permissionMode))
        }
        sx={{
          width: "100%",
          px: 2,
          py: 0.5,
          textAlign: "left",
          bgcolor: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          color: "text.secondary",
          "&:hover": {
            color: "text.primary",
          },
        }}
        title={`Current: ${getPermissionModeName(permissionMode)} - Click to cycle (Ctrl+Shift+M)`}
      >
        <Typography
          component="span"
          variant="caption"
          sx={{ fontFamily: "monospace" }}
        >
          {permissionMode === "default" && "🔧 "}
          {permissionMode === "plan" && "⏸ "}
          {permissionMode === "acceptEdits" && "⏵⏵ "}
          {getPermissionModeIndicator(permissionMode)}
        </Typography>
        <Typography
          component="span"
          variant="caption"
          sx={{ ml: 1, color: "text.disabled", fontSize: "0.65rem" }}
        >
          - Click to cycle (Ctrl+Shift+M)
        </Typography>
      </Box>
    </Box>
  );
}
