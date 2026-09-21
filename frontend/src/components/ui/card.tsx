"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = "", 
  hoverEffect = true,
  ...props 
}) => {
  return (
    <div
      className={`glass-card rounded-2xl p-5 md:p-6 ${hoverEffect ? "hover:border-violet-500/40" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};