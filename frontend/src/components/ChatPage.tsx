import { useEffect, useCallback, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import AddIcon from "@mui/icons-material/Add";
import HomeIcon from "@mui/icons-material/Home";
import { useTranslation } from "react-i18next";
import { QuickActions } from "./chat/QuickActions";
import type {
  ChatRequest,
  ChatMessage,
  ProjectInfo,
  PermissionMode,
  ImageAttachment,
} from "../types";
import type { Language } from "../types/settings";
import { useClaudeStreaming } from "../hooks/useClaudeStreaming";
import { useChatState } from "../hooks/chat/useChatState";
import { usePermissions } from "../hooks/chat/usePermissions";
import { usePermissionMode } from "../hooks/chat/usePermissionMode";
import { useAbortController } from "../hooks/chat/useAbortController";
import { useAutoHistoryLoader } from "../hooks/useHistoryLoader";
import { useSettings, useLanguage } from "../hooks/useSettings";
import { useImageUpload, type ImageUploadError } from "../hooks/useImageUpload";
import { SettingsModal } from "./SettingsModal";
import { ChatInput } from "./chat/ChatInput";
import { ChatMessages } from "./chat/ChatMessages";
import { HistoryView } from "./HistoryView";
import { getChatUrl, getProjectsUrl } from "../config/api";
import { KEYBOARD_SHORTCUTS } from "../utils/constants";
import { normalizeWindowsPath } from "../utils/pathUtils";
import type { StreamingContext } from "../hooks/streaming/useMessageProcessor";

export function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { t } = useTranslation();
  const { theme, toggleTheme } = useSettings();
  const { language, setLanguage } = useLanguage();

  // Extract and normalize working directory from URL
  const workingDirectory = (() => {
    const rawPath = location.pathname.replace("/projects", "");
    if (!rawPath) return undefined;
    const decodedPath = decodeURIComponent(rawPath);
    return normalizeWindowsPath(decodedPath);
  })();

  // Get current view and sessionId from query parameters
  const currentView = searchParams.get("view");
  const sessionId = searchParams.get("sessionId");
  const isHistoryView = currentView === "history";
  const isLoadedConversation = !!sessionId && !isHistoryView;

  const { processStreamLine } = useClaudeStreaming();
  const { abortRequest, createAbortHandler } = useAbortController();
  const { permissionMode, setPermissionMode } = usePermissionMode();

  // Image upload handling
  const handleImageUploadError = useCallback(
    (error: ImageUploadError) => {
      // TODO: Show error toast/notification
      console.error("Image upload error:", error, t(`chat.${error}`));
    },
    [t],
  );

  const {
    images,
    isUploading,
    uploadImages,
    removeImage,
    clearImages,
  } = useImageUpload({
    onError: handleImageUploadError,
  });

  const handleImageUpload = useCallback(
    (files: FileList) => {
      uploadImages(files);
    },
    [uploadImages],
  );

  const getEncodedName = useCallback(() => {
    if (!workingDirectory || !projects.length) return null;
    const project = projects.find((p) => p.path === workingDirectory);
    const normalizedWorking = normalizeWindowsPath(workingDirectory);
    const normalizedProject = projects.find(
      (p) => normalizeWindowsPath(p.path) === normalizedWorking,
    );
    const finalProject = project || normalizedProject;
    return finalProject?.encodedName || null;
  }, [workingDirectory, projects]);

  const {
    messages: historyMessages,
    loading: historyLoading,
    error: historyError,
    sessionId: loadedSessionId,
  } = useAutoHistoryLoader(
    getEncodedName() || undefined,
    sessionId || undefined,
  );

  const {
    messages,
    input,
    isLoading,
    currentSessionId,
    currentRequestId,
    hasShownInitMessage,
    currentAssistantMessage,
    setInput,
    setCurrentSessionId,
    setHasShownInitMessage,
    setHasReceivedInit,
    setCurrentAssistantMessage,
    addMessage,
    updateLastMessage,
    clearInput,
    generateRequestId,
    resetRequestState,
    startRequest,
  } = useChatState({
    initialMessages: historyMessages,
    initialSessionId: loadedSessionId || undefined,
  });

  const {
    allowedTools,
    permissionRequest,
    showPermissionRequest,
    closePermissionRequest,
    allowToolTemporary,
    allowToolPermanent,
    isPermissionMode,
    planModeRequest,
    showPlanModeRequest,
    closePlanModeRequest,
    updatePermissionMode,
  } = usePermissions({
    onPermissionModeChange: setPermissionMode,
  });

  const handlePermissionError = useCallback(
    (toolName: string, patterns: string[], toolUseId: string) => {
      if (patterns.includes("ExitPlanMode")) {
        showPlanModeRequest("");
      } else {
        showPermissionRequest(toolName, patterns, toolUseId);
      }
    },
    [showPermissionRequest, showPlanModeRequest],
  );

  const sendMessage = useCallback(
    async (
      messageContent?: string,
      tools?: string[],
      hideUserMessage = false,
      overridePermissionMode?: PermissionMode,
      messageImages?: ImageAttachment[],
    ) => {
      const content = messageContent || input.trim();
      const imagesToSend = messageImages || images;

      // Allow sending if there's content OR images
      if ((!content && imagesToSend.length === 0) || isLoading) return;

      const requestId = generateRequestId();

      if (!hideUserMessage) {
        const userMessage: ChatMessage = {
          type: "chat",
          role: "user",
          content: content || "(image)",
          timestamp: Date.now(),
          images: imagesToSend.length > 0 ? imagesToSend : undefined,
        };
        addMessage(userMessage);
      }

      if (!messageContent) {
        clearInput();
        clearImages(); // Clear images after sending
      }
      startRequest();

      try {
        const response = await fetch(getChatUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content || "Please describe this image.",
            requestId,
            ...(currentSessionId ? { sessionId: currentSessionId } : {}),
            allowedTools: tools || allowedTools,
            ...(workingDirectory ? { workingDirectory } : {}),
            permissionMode: overridePermissionMode || permissionMode,
            ...(imagesToSend.length > 0 ? { images: imagesToSend } : {}),
          } as ChatRequest),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let localHasReceivedInit = false;
        let shouldAbort = false;

        const streamingContext: StreamingContext = {
          currentAssistantMessage,
          setCurrentAssistantMessage,
          addMessage,
          updateLastMessage,
          onSessionId: setCurrentSessionId,
          shouldShowInitMessage: () => !hasShownInitMessage,
          onInitMessageShown: () => setHasShownInitMessage(true),
          get hasReceivedInit() {
            return localHasReceivedInit;
          },
          setHasReceivedInit: (received: boolean) => {
            localHasReceivedInit = received;
            setHasReceivedInit(received);
          },
          onPermissionError: handlePermissionError,
          onAbortRequest: async () => {
            shouldAbort = true;
            await createAbortHandler(requestId)();
          },
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done || shouldAbort) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (shouldAbort) break;
            processStreamLine(line, streamingContext);
          }

          if (shouldAbort) break;
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        addMessage({
          type: "chat",
          role: "assistant",
          content: "Error: Failed to get response",
          timestamp: Date.now(),
        });
      } finally {
        resetRequestState();
      }
    },
    [
      input,
      images,
      isLoading,
      currentSessionId,
      allowedTools,
      hasShownInitMessage,
      currentAssistantMessage,
      workingDirectory,
      permissionMode,
      generateRequestId,
      clearInput,
      clearImages,
      startRequest,
      addMessage,
      updateLastMessage,
      setCurrentSessionId,
      setHasShownInitMessage,
      setHasReceivedInit,
      setCurrentAssistantMessage,
      resetRequestState,
      processStreamLine,
      handlePermissionError,
      createAbortHandler,
    ],
  );

  const handleAbort = useCallback(() => {
    abortRequest(currentRequestId, isLoading, resetRequestState);
  }, [abortRequest, currentRequestId, isLoading, resetRequestState]);

  const handlePermissionAllow = useCallback(() => {
    if (!permissionRequest) return;
    let updatedAllowedTools = allowedTools;
    permissionRequest.patterns.forEach((pattern) => {
      updatedAllowedTools = allowToolTemporary(pattern, updatedAllowedTools);
    });
    closePermissionRequest();
    if (currentSessionId) {
      sendMessage("continue", updatedAllowedTools, true);
    }
  }, [
    permissionRequest,
    currentSessionId,
    sendMessage,
    allowedTools,
    allowToolTemporary,
    closePermissionRequest,
  ]);

  const handlePermissionAllowPermanent = useCallback(() => {
    if (!permissionRequest) return;
    let updatedAllowedTools = allowedTools;
    permissionRequest.patterns.forEach((pattern) => {
      updatedAllowedTools = allowToolPermanent(pattern, updatedAllowedTools);
    });
    closePermissionRequest();
    if (currentSessionId) {
      sendMessage("continue", updatedAllowedTools, true);
    }
  }, [
    permissionRequest,
    currentSessionId,
    sendMessage,
    allowedTools,
    allowToolPermanent,
    closePermissionRequest,
  ]);

  const handlePermissionDeny = useCallback(() => {
    closePermissionRequest();
  }, [closePermissionRequest]);

  const handlePlanAcceptWithEdits = useCallback(() => {
    updatePermissionMode("acceptEdits");
    closePlanModeRequest();
    if (currentSessionId) {
      sendMessage("accept", allowedTools, true, "acceptEdits");
    }
  }, [
    updatePermissionMode,
    closePlanModeRequest,
    currentSessionId,
    sendMessage,
    allowedTools,
  ]);

  const handlePlanAcceptDefault = useCallback(() => {
    updatePermissionMode("default");
    closePlanModeRequest();
    if (currentSessionId) {
      sendMessage("accept", allowedTools, true, "default");
    }
  }, [
    updatePermissionMode,
    closePlanModeRequest,
    currentSessionId,
    sendMessage,
    allowedTools,
  ]);

  const handlePlanKeepPlanning = useCallback(() => {
    updatePermissionMode("plan");
    closePlanModeRequest();
  }, [updatePermissionMode, closePlanModeRequest]);

  const permissionData = permissionRequest
    ? {
        patterns: permissionRequest.patterns,
        onAllow: handlePermissionAllow,
        onAllowPermanent: handlePermissionAllowPermanent,
        onDeny: handlePermissionDeny,
      }
    : undefined;

  const planPermissionData = planModeRequest
    ? {
        onAcceptWithEdits: handlePlanAcceptWithEdits,
        onAcceptDefault: handlePlanAcceptDefault,
        onKeepPlanning: handlePlanKeepPlanning,
      }
    : undefined;

  const handleHistoryClick = useCallback(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("view", "history");
    navigate({ search: searchParams.toString() });
  }, [navigate]);

  const handleBackToChat = useCallback(() => {
    navigate({ search: "" });
  }, [navigate]);

  const handleBackToHistory = useCallback(() => {
    const searchParams = new URLSearchParams();
    searchParams.set("view", "history");
    navigate({ search: searchParams.toString() });
  }, [navigate]);

  const handleBackToProjects = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleLanguageChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLang: Language | null,
  ) => {
    if (newLang) setLanguage(newLang);
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch(getProjectsUrl());
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_SHORTCUTS.ABORT && isLoading && currentRequestId) {
        e.preventDefault();
        handleAbort();
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isLoading, currentRequestId, handleAbort]);

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
          top: "10%",
          left: "5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            theme === "dark"
              ? "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)",
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
          bottom: "10%",
          right: "5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            theme === "dark"
              ? "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "float 8s ease-in-out infinite reverse",
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1000,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {(isHistoryView || isLoadedConversation) && (
              <IconButton
                onClick={isHistoryView ? handleBackToChat : handleBackToHistory}
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
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box>
              <Typography
                variant="h6"
                onClick={handleBackToProjects}
                sx={{
                  fontWeight: 700,
                  cursor: "pointer",
                  background:
                    theme === "dark"
                      ? "linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%)"
                      : "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #10b981 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                {t("appName")}
              </Typography>
              {workingDirectory && (
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    color: theme === "dark" ? "grey.500" : "grey.600",
                    fontSize: "0.7rem",
                  }}
                >
                  {workingDirectory}
                  {sessionId && ` • ${sessionId.substring(0, 8)}...`}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {/* Home Button */}
            <IconButton
              onClick={handleBackToProjects}
              sx={{
                color: theme === "dark" ? "#60a5fa" : "#2563eb",
                bgcolor:
                  theme === "dark"
                    ? "rgba(96, 165, 250, 0.1)"
                    : "rgba(37, 99, 235, 0.1)",
                "&:hover": {
                  bgcolor:
                    theme === "dark"
                      ? "rgba(96, 165, 250, 0.2)"
                      : "rgba(37, 99, 235, 0.2)",
                },
              }}
              title={t("nav.home")}
            >
              <HomeIcon />
            </IconButton>

            {/* New Project Button - Navigate to homepage to select new project */}
            <IconButton
              onClick={handleBackToProjects}
              sx={{
                color: theme === "dark" ? "#34d399" : "#10b981",
                bgcolor:
                  theme === "dark"
                    ? "rgba(52, 211, 153, 0.1)"
                    : "rgba(16, 185, 129, 0.1)",
                "&:hover": {
                  bgcolor:
                    theme === "dark"
                      ? "rgba(52, 211, 153, 0.2)"
                      : "rgba(16, 185, 129, 0.2)",
                },
              }}
              title={t("nav.projects")}
            >
              <AddIcon />
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

            {/* History */}
            {!isHistoryView && (
              <IconButton
                onClick={handleHistoryClick}
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
                <HistoryIcon />
              </IconButton>
            )}

            {/* Settings */}
            <IconButton
              onClick={() => setIsSettingsOpen(true)}
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

        {/* Main Content */}
        {isHistoryView ? (
          <HistoryView
            workingDirectory={workingDirectory || ""}
            encodedName={getEncodedName()}
            onBack={handleBackToChat}
          />
        ) : historyLoading ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <CircularProgress
              sx={{ color: theme === "dark" ? "#60a5fa" : "#2563eb" }}
            />
            <Typography color="text.secondary">
              {t("status.loading")}
            </Typography>
          </Box>
        ) : historyError ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 2,
            }}
          >
            <Typography color="error">{historyError}</Typography>
          </Box>
        ) : (
          <>
            {/* Chat Messages */}
            <ChatMessages messages={messages} isLoading={isLoading} />

            {/* Input */}
            <ChatInput
              input={input}
              isLoading={isLoading}
              currentRequestId={currentRequestId}
              onInputChange={setInput}
              onSubmit={() => sendMessage()}
              onAbort={handleAbort}
              permissionMode={permissionMode}
              onPermissionModeChange={setPermissionMode}
              showPermissions={isPermissionMode}
              permissionData={permissionData}
              planPermissionData={planPermissionData}
              images={images}
              isUploading={isUploading}
              onImageUpload={handleImageUpload}
              onImageRemove={removeImage}
            />

            {/* Quick Actions */}
            {messages.length === 0 && !isLoading && (
              <QuickActions
                onAction={(prompt) => {
                  setInput(prompt);
                }}
                theme={theme}
                disabled={isLoading}
              />
            )}
          </>
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </Box>
    </Box>
  );
}
