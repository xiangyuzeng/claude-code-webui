import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CircularProgress,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Button,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import SettingsIcon from "@mui/icons-material/Settings";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import type { ProjectsResponse, ProjectInfo } from "../types";
import { getProjectsUrl } from "../config/api";
import { useSettings, useLanguage } from "../hooks/useSettings";
import { SettingsModal } from "./SettingsModal";
import type { Language } from "../types/settings";

export function ProjectSelector() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useSettings();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(getProjectsUrl());
      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.statusText}`);
      }
      const data: ProjectsResponse = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectPath: string) => {
    const normalizedPath = projectPath.startsWith("/")
      ? projectPath
      : `/${projectPath}`;
    navigate(`/projects${normalizedPath}`);
  };

  const handleLanguageChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLang: Language | null,
  ) => {
    if (newLang) setLanguage(newLang);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme === "dark"
            ? "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)"
            : "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 50%, #f5f7ff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background grid */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            theme === "dark"
              ? `linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)`
              : `linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
          animation: "gridMove 20s linear infinite",
          "@keyframes gridMove": {
            "0%": { transform: "translate(0, 0)" },
            "100%": { transform: "translate(50px, 50px)" },
          },
        }}
      />

      {/* Glowing orbs */}
      <Box
        sx={{
          position: "absolute",
          top: "20%",
          left: "10%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            theme === "dark"
              ? "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float 6s ease-in-out infinite",
          "@keyframes float": {
            "0%, 100%": { transform: "translateY(0)" },
            "50%": { transform: "translateY(-20px)" },
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "20%",
          right: "10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            theme === "dark"
              ? "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 800,
          mx: "auto",
          px: 3,
          py: 6,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 6,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background:
                    theme === "dark"
                      ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)"
                      : "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #10b981 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                {t("appName")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme === "dark" ? "grey.500" : "grey.600",
                  mt: 0.5,
                }}
              >
                {t("appSubtitle")}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {/* Refresh Button */}
            <IconButton
              onClick={loadProjects}
              sx={{
                color: theme === "dark" ? "grey.400" : "grey.600",
                bgcolor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                "&:hover": {
                  bgcolor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                },
              }}
              title={t("actions.refresh")}
            >
              <RefreshIcon />
            </IconButton>

            {/* Language Toggle */}
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={handleLanguageChange}
              size="small"
              sx={{
                bgcolor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                borderRadius: 2,
                "& .MuiToggleButton-root": {
                  border: "none",
                  color: theme === "dark" ? "grey.400" : "grey.600",
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  "&.Mui-selected": {
                    bgcolor:
                      theme === "dark"
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(37, 99, 235, 0.15)",
                    color: theme === "dark" ? "#60a5fa" : "#2563eb",
                  },
                },
              }}
            >
              <ToggleButton value="en">EN</ToggleButton>
              <ToggleButton value="zh">ZH</ToggleButton>
            </ToggleButtonGroup>

            {/* Theme Toggle */}
            <IconButton
              onClick={toggleTheme}
              sx={{
                color: theme === "dark" ? "grey.400" : "grey.600",
                bgcolor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                "&:hover": {
                  bgcolor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                },
              }}
            >
              {theme === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            {/* Settings */}
            <IconButton
              onClick={() => setSettingsOpen(true)}
              sx={{
                color: theme === "dark" ? "grey.400" : "grey.600",
                bgcolor:
                  theme === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                "&:hover": {
                  bgcolor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                },
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              py: 10,
              gap: 2,
            }}
          >
            <CircularProgress
              sx={{
                color: theme === "dark" ? "#60a5fa" : "#2563eb",
              }}
            />
            <Typography color="text.secondary">
              {t("status.loading")}
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Card
            sx={{
              p: 4,
              textAlign: "center",
              bgcolor:
                theme === "dark"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(239, 68, 68, 0.05)",
              border: "1px solid",
              borderColor:
                theme === "dark"
                  ? "rgba(239, 68, 68, 0.3)"
                  : "rgba(239, 68, 68, 0.2)",
              borderRadius: 3,
            }}
          >
            <Typography color="error">{error}</Typography>
          </Card>
        )}

        {/* Projects List */}
        {!loading && !error && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: theme === "dark" ? "grey.500" : "grey.600",
                  fontWeight: 600,
                  letterSpacing: 2,
                }}
              >
                {t("nav.projects")}
              </Typography>

              {/* New Project Button */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  // Open file picker or prompt for new project path
                  const newPath = window.prompt(
                    language === "zh"
                      ? "请输入新项目路径:"
                      : "Enter new project path:",
                    "/Users/",
                  );
                  if (newPath) {
                    handleProjectSelect(newPath);
                  }
                }}
                sx={{
                  bgcolor: theme === "dark" ? "#1e3a8a" : "#2563eb",
                  color: "white",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: theme === "dark" ? "#1e40af" : "#1d4ed8",
                  },
                }}
              >
                {language === "zh" ? "新建项目" : "New Project"}
              </Button>
            </Box>

            {projects.length === 0 ? (
              <Card
                sx={{
                  p: 6,
                  textAlign: "center",
                  bgcolor:
                    theme === "dark"
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(0,0,0,0.02)",
                  border: "1px dashed",
                  borderColor: theme === "dark" ? "grey.800" : "grey.300",
                  borderRadius: 3,
                }}
              >
                <Typography color="text.secondary">
                  No projects found. Please configure project directories.
                </Typography>
              </Card>
            ) : (
              projects.map((project) => (
                <Card
                  key={project.path}
                  sx={{
                    bgcolor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid",
                    borderColor:
                      theme === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.08)",
                    borderRadius: 3,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor:
                        theme === "dark"
                          ? "rgba(59, 130, 246, 0.5)"
                          : "rgba(37, 99, 235, 0.3)",
                      boxShadow:
                        theme === "dark"
                          ? "0 0 30px rgba(59, 130, 246, 0.15)"
                          : "0 4px 20px rgba(37, 99, 235, 0.1)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleProjectSelect(project.path)}
                    sx={{ p: 2.5 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor:
                            theme === "dark"
                              ? "rgba(59, 130, 246, 0.15)"
                              : "rgba(37, 99, 235, 0.1)",
                        }}
                      >
                        <FolderIcon
                          sx={{
                            color: theme === "dark" ? "#60a5fa" : "#2563eb",
                            fontSize: 24,
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontFamily:
                            "'JetBrains Mono', 'Fira Code', monospace",
                          fontSize: "0.9rem",
                          color: theme === "dark" ? "grey.300" : "grey.700",
                        }}
                      >
                        {project.path}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              ))
            )}
          </Box>
        )}
      </Box>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Box>
  );
}
