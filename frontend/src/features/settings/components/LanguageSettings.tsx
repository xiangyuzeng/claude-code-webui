import React from "react";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLanguage } from "~hooks/useSettings";
import type { Language } from "~types/settings";

export const LanguageSettings: React.FC = () => {
  const { t } = useTranslation("settings");
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLanguage: Language | null,
  ) => {
    if (newLanguage) {
      setLanguage(newLanguage);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {t("language.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("language.description")}
      </Typography>

      <ToggleButtonGroup
        value={language}
        exclusive
        onChange={handleLanguageChange}
        aria-label="language selection"
        sx={{
          "& .MuiToggleButton-root": {
            px: 3,
            py: 1,
          },
        }}
      >
        <ToggleButton value="en" aria-label="English">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" fontWeight={500}>
              EN
            </Typography>
            <Typography variant="body2">{t("language.english")}</Typography>
          </Box>
        </ToggleButton>
        <ToggleButton value="zh" aria-label="Chinese">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" fontWeight={500}>
              ZH
            </Typography>
            <Typography variant="body2">{t("language.chinese")}</Typography>
          </Box>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
