import { Box, Chip, Tooltip } from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import BugReportIcon from "@mui/icons-material/BugReport";
import DescriptionIcon from "@mui/icons-material/Description";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SpeedIcon from "@mui/icons-material/Speed";
import SecurityIcon from "@mui/icons-material/Security";
import ArchitectureIcon from "@mui/icons-material/Architecture";
import ScienceIcon from "@mui/icons-material/Science";
import { useTranslation } from "react-i18next";

interface QuickActionsProps {
  onAction: (prompt: string) => void;
  theme: "light" | "dark";
  disabled?: boolean;
}

export function QuickActions({ onAction, theme, disabled = false }: QuickActionsProps) {
  const { t } = useTranslation();

  const actions = [
    {
      icon: <CodeIcon fontSize="small" />,
      label: t("quickActions.review", "Code Review"),
      labelZh: "代码审查",
      prompt: "Please review the code in this project and provide suggestions for improvements, best practices, and potential issues.",
      color: "#3b82f6",
    },
    {
      icon: <BugReportIcon fontSize="small" />,
      label: t("quickActions.debug", "Debug"),
      labelZh: "调试问题",
      prompt: "Help me debug issues in this project. Analyze the code for potential bugs, errors, and suggest fixes.",
      color: "#ef4444",
    },
    {
      icon: <DescriptionIcon fontSize="small" />,
      label: t("quickActions.docs", "Generate Docs"),
      labelZh: "生成文档",
      prompt: "Generate comprehensive documentation for this project including README, API docs, and inline comments.",
      color: "#10b981",
    },
    {
      icon: <AutoFixHighIcon fontSize="small" />,
      label: t("quickActions.refactor", "Refactor"),
      labelZh: "重构代码",
      prompt: "Analyze the codebase and suggest refactoring opportunities to improve code quality, maintainability, and performance.",
      color: "#8b5cf6",
    },
    {
      icon: <SpeedIcon fontSize="small" />,
      label: t("quickActions.optimize", "Optimize"),
      labelZh: "性能优化",
      prompt: "Analyze this project for performance optimization opportunities. Suggest improvements for speed, memory usage, and efficiency.",
      color: "#f59e0b",
    },
    {
      icon: <SecurityIcon fontSize="small" />,
      label: t("quickActions.security", "Security Scan"),
      labelZh: "安全扫描",
      prompt: "Perform a security audit of this codebase. Identify potential vulnerabilities, security risks, and suggest fixes.",
      color: "#ec4899",
    },
    {
      icon: <ArchitectureIcon fontSize="small" />,
      label: t("quickActions.architecture", "Architecture"),
      labelZh: "架构分析",
      prompt: "Analyze the architecture of this project. Provide insights on the structure, patterns used, and suggestions for improvements.",
      color: "#06b6d4",
    },
    {
      icon: <ScienceIcon fontSize="small" />,
      label: t("quickActions.test", "Generate Tests"),
      labelZh: "生成测试",
      prompt: "Generate comprehensive unit tests and integration tests for this project. Cover edge cases and critical paths.",
      color: "#84cc16",
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        justifyContent: "center",
        py: 1.5,
        px: 1,
      }}
    >
      {actions.map((action, index) => (
        <Tooltip
          key={index}
          title={action.prompt.substring(0, 60) + "..."}
          arrow
          placement="top"
        >
          <Chip
            icon={action.icon}
            label={action.label}
            onClick={() => !disabled && onAction(action.prompt)}
            disabled={disabled}
            sx={{
              bgcolor: theme === "dark"
                ? `${action.color}20`
                : `${action.color}15`,
              color: theme === "dark" ? action.color : action.color,
              border: "1px solid",
              borderColor: theme === "dark"
                ? `${action.color}40`
                : `${action.color}30`,
              fontWeight: 500,
              fontSize: "0.75rem",
              height: 32,
              transition: "all 0.2s ease",
              cursor: disabled ? "not-allowed" : "pointer",
              "& .MuiChip-icon": {
                color: action.color,
              },
              "&:hover": {
                bgcolor: theme === "dark"
                  ? `${action.color}35`
                  : `${action.color}25`,
                transform: disabled ? "none" : "translateY(-2px)",
                boxShadow: disabled ? "none" : `0 4px 12px ${action.color}30`,
              },
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
}
