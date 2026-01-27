import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export const SuspenseLoader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body2" color="text.secondary">
        {t("status.loading")}
      </Typography>
    </Box>
  );
};
