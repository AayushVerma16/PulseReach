"use client";

import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "violet" | "cyan" | "emerald" | "amber" | "rose";
  delay?: number;
}

const colorMap = {
  violet: {
    bg: "from-violet-500/20 to-violet-600/5",
    icon: "text-violet-400",
    border: "border-violet-500/20",
  },
  cyan: {
    bg: "from-cyan-500/20 to-cyan-600/5",
    icon: "text-cyan-400",
    border: "border-cyan-500/20",
  },
  emerald: {
    bg: "from-emerald-500/20 to-emerald-600/5",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  amber: {
    bg: "from-amber-500/20 to-amber-600/5",
    icon: "text-amber-400",
    border: "border-amber-500/20",
  },
  rose: {
    bg: "from-rose-500/20 to-rose-600/5",
    icon: "text-rose-400",
    border: "border-rose-500/20",
  },
};

export default function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = "violet",
  delay = 0,
}: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={`glass-card p-5 animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center border ${colors.border}`}
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              trendUp
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
