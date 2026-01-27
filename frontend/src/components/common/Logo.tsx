import { Box } from "@mui/material";

interface LogoProps {
  size?: number;
  theme?: "light" | "dark";
}

export function Logo({ size = 40, theme = "dark" }: LogoProps) {
  // Luckin Coffee brand blue color
  const brandColor = "#1e3a8a"; // Luckin blue

  return (
    <Box
      sx={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill={theme === "dark" ? brandColor : brandColor}
        />

        {/* Deer silhouette - Luckin Coffee style */}
        <g transform="translate(15, 8) scale(0.7)">
          {/* Left antler */}
          <path
            d="M35 45 Q30 30 25 10 M30 35 Q22 28 15 22 M28 28 Q18 25 10 28"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Right antler */}
          <path
            d="M65 45 Q70 30 75 10 M70 35 Q78 28 85 22 M72 28 Q82 25 90 28"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Deer head */}
          <path
            d="M50 40
               C35 40 28 55 28 70
               C28 90 38 105 50 105
               C62 105 72 90 72 70
               C72 55 65 40 50 40Z"
            fill="white"
          />

          {/* Left ear */}
          <path d="M32 50 Q25 42 30 35 Q38 40 35 50Z" fill="white" />

          {/* Right ear */}
          <path d="M68 50 Q75 42 70 35 Q62 40 65 50Z" fill="white" />

          {/* Left eye */}
          <ellipse cx="40" cy="65" rx="3" ry="4" fill={brandColor} />

          {/* Nose/muzzle area */}
          <ellipse
            cx="50"
            cy="88"
            rx="8"
            ry="6"
            fill={brandColor}
            opacity="0.3"
          />
        </g>
      </svg>
    </Box>
  );
}
