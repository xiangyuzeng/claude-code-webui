import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import StorageIcon from "@mui/icons-material/Storage";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks/useSettings";
import type { FontSize } from "../../types/settings";

export function GeneralSettings() {
  const { t } = useTranslation("settings");
  const {
    enterBehavior,
    toggleEnterBehavior,
    fontSize,
    setFontSize,
    compactMode,
    setCompactMode,
  } = useSettings();

  // Local state for additional settings (these would normally be persisted)
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);

  return (
    <Box sx={{ py: 1 }}>
      {/* Live region for screen reader announcements */}
      <Box
        component="div"
        aria-live="polite"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {enterBehavior === "send"
          ? "Enter key sends messages"
          : "Enter key creates newlines"}
        .
      </Box>

      <Typography variant="h6" fontWeight={600} gutterBottom>
        {t("general")}
      </Typography>

      {/* Enter Behavior Setting */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {t("behavior.enterKey")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("behavior.enterDescription")}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 0,
            overflow: "hidden",
          }}
        >
          <Button
            fullWidth
            onClick={toggleEnterBehavior}
            sx={{
              justifyContent: "flex-start",
              px: 2,
              py: 1.5,
              textTransform: "none",
              color: "text.primary",
            }}
            role="switch"
            aria-checked={enterBehavior === "send"}
            aria-label={`Enter key behavior. Currently set to ${enterBehavior === "send" ? "send message" : "newline"}.`}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
              }}
            >
              <KeyboardIcon sx={{ color: "text.secondary" }} />
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="body2" fontWeight={500}>
                  {enterBehavior === "send"
                    ? t("behavior.enterSend")
                    : t("behavior.enterNewline")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {enterBehavior === "send"
                    ? "Shift+Enter for newline"
                    : "Shift+Enter to send"}
                </Typography>
              </Box>
            </Box>
          </Button>
        </Paper>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Display Settings */}
      <Typography
        variant="h6"
        fontWeight={600}
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <TextFieldsIcon fontSize="small" />
        {t("display.title", "Display")}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>{t("display.fontSize", "Font Size")}</InputLabel>
          <Select
            value={fontSize}
            label={t("display.fontSize", "Font Size")}
            onChange={(e) => setFontSize(e.target.value as FontSize)}
          >
            <MenuItem value="small">{t("display.small", "Small")}</MenuItem>
            <MenuItem value="medium">{t("display.medium", "Medium")}</MenuItem>
            <MenuItem value="large">{t("display.large", "Large")}</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={compactMode}
              onChange={(e) => setCompactMode(e.target.checked)}
              size="small"
            />
          }
          label={t("display.compactMode", "Compact Mode")}
        />

        <FormControlLabel
          control={
            <Switch
              checked={showTimestamps}
              onChange={(e) => setShowTimestamps(e.target.checked)}
              size="small"
            />
          }
          label={t("display.showTimestamps", "Show Timestamps")}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Notifications */}
      <Typography
        variant="h6"
        fontWeight={600}
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <NotificationsIcon fontSize="small" />
        {t("notifications.title", "Notifications")}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              size="small"
            />
          }
          label={t("notifications.sound", "Sound notifications")}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Data & Storage */}
      <Typography
        variant="h6"
        fontWeight={600}
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <StorageIcon fontSize="small" />
        {t("storage.title", "Data & Storage")}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            if (
              window.confirm(
                t(
                  "storage.clearHistoryConfirm",
                  "Are you sure you want to clear chat history?",
                ),
              )
            ) {
              localStorage.removeItem("chat-history");
            }
          }}
        >
          {t("storage.clearHistory", "Clear History")}
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          onClick={() => {
            if (
              window.confirm(
                t(
                  "storage.resetConfirm",
                  "Are you sure you want to reset all settings?",
                ),
              )
            ) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          {t("storage.resetSettings", "Reset All Settings")}
        </Button>
      </Box>
    </Box>
  );
}
