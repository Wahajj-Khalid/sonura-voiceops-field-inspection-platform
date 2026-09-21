"use client";

import React from "react";
import { Card } from "./card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon
}) => {
  return (
    <Card className="flex flex-col justify-between">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-xs font-medium font-sans">{title}</span>
        <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline">
        <span className="text-2xl md:text-3xl font-extrabold text-white font-sans">{value}</span>
        {trend && (
          <span className="ml-2 text-xs text-emerald-400 font-medium font-mono">
            {trend}
          </span>
        )}
      </div>
      <p className="text-[11px] text-slate-500 mt-2 font-mono">{subtitle}</p>
    </Card>
  );
};