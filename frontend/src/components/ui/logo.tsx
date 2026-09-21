import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

const SIZE_MAP = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  animated = false,
}) => {
  const dimensionClass = SIZE_MAP[size] || "w-8 h-8";

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${dimensionClass} ${className}`}>
      {animated ? (
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 opacity-60 blur-sm animate-pulse pointer-events-none" />
      ) : null}

      <div className={`relative ${dimensionClass} rounded-xl bg-[#090d16] border border-violet-500/30 flex items-center justify-center overflow-hidden p-1 shadow-md`}>
        <img
          src="/icon.svg"
          alt="Sonura Logo"
          className="w-full h-full object-contain select-none pointer-events-none"
        />
      </div>
    </div>
  );
};