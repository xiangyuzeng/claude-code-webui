import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import StopIcon from "@mui/icons-material/Stop";
import SendIcon from "@mui/icons-material/Send";
import { useTranslation } from "react-i18next";
import { KEYBOARD_SHORTCUTS } from "../../utils/constants";
import { useEnterBehavior } from "../../hooks/useSettings";
import { PermissionInputPanel } from "./PermissionInputPanel";
import { PlanPermissionInputPanel } from "./PlanPermissionInputPanel";
import type { PermissionMode } from "../../types";

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
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isComposing, setIsComposing] = useState(false);
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
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          p: 1,
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          bgcolor: "background.paper",
        }}
      >
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
            disabled={!input.trim() || isLoading}
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
