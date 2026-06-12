"use client";

import React, { useState } from "react";
import {
  Target,
  Rocket,
  BarChart3,
  Users,
  Loader2,
  CheckCircle2,
  MessageSquare,
  List,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  state: string;
}

const toolMeta: Record<
  string,
  {
    label: string;
    doneLabel: string;
    icon: typeof Target;
    color: string;
    bgColor: string;
    borderColor: string;
    accentGradient: string;
  }
> = {
  createSegment: {
    label: "Creating Segment",
    doneLabel: "Segment Created",
    icon: Target,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    accentGradient: "from-cyan-500/20 to-cyan-600/5",
  },
  previewSegment: {
    label: "Previewing Audience",
    doneLabel: "Audience Preview Ready",
    icon: Users,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    accentGradient: "from-violet-500/20 to-violet-600/5",
  },
  draftMessage: {
    label: "Drafting Message",
    doneLabel: "Message Drafted",
    icon: MessageSquare,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    accentGradient: "from-amber-500/20 to-amber-600/5",
  },
  launchCampaign: {
    label: "Launching Campaign",
    doneLabel: "Campaign Launched",
    icon: Rocket,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    accentGradient: "from-emerald-500/20 to-emerald-600/5",
  },
  getCampaignStats: {
    label: "Fetching Campaign Stats",
    doneLabel: "Campaign Stats",
    icon: BarChart3,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    accentGradient: "from-cyan-500/20 to-cyan-600/5",
  },
  getCustomerInsights: {
    label: "Analyzing Customer Base",
    doneLabel: "Customer Insights",
    icon: Users,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    accentGradient: "from-violet-500/20 to-violet-600/5",
  },
  listCampaigns: {
    label: "Listing Campaigns",
    doneLabel: "Campaign List",
    icon: List,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    accentGradient: "from-amber-500/20 to-amber-600/5",
  },
  listSegments: {
    label: "Listing Segments",
    doneLabel: "Segment List",
    icon: List,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    accentGradient: "from-cyan-500/20 to-cyan-600/5",
  },
};

// AI SDK v6 tool states
const loadingStates = new Set([
  "call",
  "partial-call",
  "input-streaming",
  "input-available",
]);
const doneStates = new Set(["result", "output-available"]);

export default function ToolCallCard({
  toolName,
  result,
  state,
}: ToolCallCardProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);
  const meta = toolMeta[toolName] || {
    label: toolName,
    doneLabel: toolName,
    icon: Target,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    accentGradient: "from-slate-500/20 to-slate-600/5",
  };
  const Icon = meta.icon;
  const isLoading = loadingStates.has(state);
  const isDone = doneStates.has(state);

  const renderIcon = (): React.JSX.Element => {
    if (isLoading) {
      return <Loader2 className={`w-4 h-4 ${meta.color} animate-spin`} />;
    }
    if (isDone) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    return <Icon className={`w-4 h-4 ${meta.color}`} />;
  };

  return (
    <div className="my-2 rounded-xl border border-white/[0.08] bg-[#0a0e18]/80 backdrop-blur-sm overflow-hidden shadow-lg transition-all duration-300 hover:border-white/[0.12] animate-tool-expand">
      {/* Header — clickable to expand/collapse */}
      <button
        onClick={() => isDone && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${meta.accentGradient} to-transparent border-b border-white/[0.06] transition-colors ${
          isDone ? "cursor-pointer hover:bg-white/[0.02]" : "cursor-default"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg ${meta.bgColor} border ${meta.borderColor} flex items-center justify-center ${
            isLoading ? "animate-pulse" : ""
          } transition-all duration-300`}
        >
          {renderIcon()}
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-xs font-semibold text-slate-200 tracking-wide block">
            {isDone ? meta.doneLabel : meta.label + "..."}
          </span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1.5">
            <Sparkles className={`w-3 h-3 ${meta.color} animate-pulse`} />
            <span className="text-[10px] font-medium text-slate-500">
              Processing
            </span>
          </div>
        )}
        {isDone && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Done
            </span>
            {result != null && (
              isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )
            )}
          </div>
        )}
      </button>

      {/* Progress bar when loading */}
      {isLoading && <div className="tool-progress-bar" />}

      {/* Result — collapsible */}
      {isDone && result != null && isExpanded && (
        <div className="px-4 py-3.5 animate-tool-expand">
          {renderResult(toolName, result as Record<string, unknown>)}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────
   Result renderers per tool
   ────────────────────────────────────── */

function renderResult(
  toolName: string,
  result: Record<string, unknown>
): React.JSX.Element {
  if (result.error) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/15">
        <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">!</span>
        <p className="text-xs text-rose-400">{String(result.error)}</p>
      </div>
    );
  }

  switch (toolName) {
    case "createSegment":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Target className="w-3 h-3 text-cyan-500/60" />
              Segment Created
            </span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/15">
              {String(result.customerCount)} customers
            </span>
          </div>
          <p className="text-sm font-semibold text-white">
            {String(result.name)}
          </p>
        </div>
      );

    case "previewSegment":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Matching Customers</span>
            <span className="text-lg font-bold text-violet-400 tabular-nums">
              {String(result.totalMatching)}
            </span>
          </div>
          {Array.isArray(result.sampleCustomers) &&
            result.sampleCustomers.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Sample Matches
                </p>
                <div className="rounded-lg border border-white/[0.04] overflow-hidden">
                  {(
                    result.sampleCustomers as Array<{
                      name: string;
                      city: string;
                      totalSpend: number;
                    }>
                  ).map((c, i) => (
                    <div
                      key={i}
                      className={`flex justify-between text-[11px] px-3 py-2 ${
                        i % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent"
                      } ${
                        i > 0 ? "border-t border-white/[0.03]" : ""
                      }`}
                    >
                      <span className="text-slate-300 font-medium">
                        {c.name}
                      </span>
                      <span className="text-slate-500">
                        {c.city} ·{" "}
                        <span className="text-emerald-400 font-semibold">
                          ₹{Math.round(c.totalSpend).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      );

    case "launchCampaign":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Rocket className="w-3 h-3 text-emerald-400" />
            </div>
            <p className="text-sm text-emerald-400 font-semibold">
              Campaign Launched Successfully!
            </p>
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Campaign</span>
              <span className="text-white font-medium">{String(result.name)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Segment</span>
              <span className="text-slate-300">{String(result.segmentName)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Audience</span>
              <span className="text-violet-400 font-semibold">{String(result.targetCustomers)} customers</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Channel</span>
              <span className="text-cyan-400 uppercase text-[10px] font-semibold tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded-full">{String(result.channel)}</span>
            </div>
          </div>
        </div>
      );

    case "getCampaignStats": {
      const stats = result.stats as Record<string, number> | undefined;
      const rates = result.rates as Record<string, string> | undefined;
      if (!stats)
        return <p className="text-xs text-slate-500">No stats available</p>;

      const statItems = [
        { label: "Sent", value: stats.sent, color: "text-cyan-400", bg: "bg-cyan-500/10" },
        { label: "Delivered", value: stats.delivered, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { label: "Opened", value: stats.opened, color: "text-violet-400", bg: "bg-violet-500/10" },
        { label: "Clicked", value: stats.clicked, color: "text-pink-400", bg: "bg-pink-500/10" },
        { label: "Failed", value: stats.failed, color: "text-rose-400", bg: "bg-rose-500/10" },
      ];

      return (
        <div className="space-y-3">
          <p className="text-xs text-white font-semibold flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-500/60" />
            {String(result.name)}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {statItems.map((s) => (
              <div
                key={s.label}
                className={`text-center p-2.5 rounded-xl ${s.bg} border border-white/[0.04] transition-transform duration-200 hover:scale-105`}
              >
                <p className={`text-base font-bold ${s.color} tabular-nums`}>
                  {s.value}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          {rates && (
            <div className="flex gap-4 text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
              <span>
                Delivery:{" "}
                <strong className="text-emerald-400">{rates.delivery}</strong>
              </span>
              <span>
                Open:{" "}
                <strong className="text-violet-400">{rates.open}</strong>
              </span>
              <span>
                Click:{" "}
                <strong className="text-pink-400">{rates.click}</strong>
              </span>
            </div>
          )}
        </div>
      );
    }

    case "getCustomerInsights": {
      const spending = result.spending as Record<string, number> | undefined;
      const segments = result.segments as
        | Array<{ tag: string; count: number }>
        | undefined;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.04]">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Total Customers
              </p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">
                {String(result.totalCustomers)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.04]">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Total Orders
              </p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">
                {String(result.totalOrders)}
              </p>
            </div>
          </div>
          {spending && (
            <div className="flex justify-between text-xs p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent border border-white/[0.04]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Average Spend
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                ₹{spending.average?.toLocaleString()}
              </span>
            </div>
          )}
          {segments && segments.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Customer Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {segments.map((s) => (
                  <span
                    key={s.tag}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/15 hover:bg-violet-500/20 transition-colors cursor-default"
                  >
                    {s.tag}:{" "}
                    <strong className="text-violet-200">{s.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    default:
      return (
        <pre className="text-[10px] text-slate-400 overflow-auto max-h-32 font-mono bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
          {JSON.stringify(result, null, 2)}
        </pre>
      );
  }
}
