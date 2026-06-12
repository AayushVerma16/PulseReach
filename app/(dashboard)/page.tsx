"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Megaphone,
  Target,
  TrendingUp,
  Sparkles,
  ArrowRight,
  MessageSquare,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Activity,
  ChevronRight,
  Mail,
  Smartphone,
  Zap,
  ArrowUpRight,
  Clock,
  Send,
  Database,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import StatusBadge from "@/app/components/ui/StatusBadge";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

// ── Mock data for when DB is not connected ─────────────────
const MOCK_DATA = {
  metrics: {
    totalCustomers: 1000,
    totalOrders: 4218,
    totalCampaigns: 3,
    totalSegments: 3,
    totalMessages: 0,
    avgDeliveryRate: 0,
    avgOpenRate: 0,
    totalRevenue: 4872530,
    avgSpend: 4872,
    maxSpend: 48990,
  },
  tagDistribution: [
    { tag: "active", count: 342 },
    { tag: "high-value", count: 187 },
    { tag: "churned", count: 263 },
    { tag: "loyal", count: 124 },
    { tag: "at-risk", count: 198 },
    { tag: "new", count: 86 },
    { tag: "mid-value", count: 413 },
    { tag: "one-time", count: 97 },
    { tag: "low-value", count: 400 },
  ],
  topCities: [
    { city: "Mumbai", count: 134 },
    { city: "Delhi", count: 121 },
    { city: "Bangalore", count: 98 },
    { city: "Hyderabad", count: 76 },
    { city: "Chennai", count: 67 },
    { city: "Pune", count: 54 },
  ],
  recentCampaigns: [] as DashboardData["recentCampaigns"],
  channelBreakdown: [] as DashboardData["channelBreakdown"],
  deliveryFunnel: {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    failed: 0,
  },
};

// ── Types ──────────────────────────────────────────────────
interface DashboardData {
  metrics: {
    totalCustomers: number;
    totalOrders: number;
    totalCampaigns: number;
    totalSegments: number;
    totalMessages: number;
    avgDeliveryRate: number;
    avgOpenRate: number;
    totalRevenue: number;
    avgSpend: number;
    maxSpend: number;
  };
  tagDistribution: Array<{ tag: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  recentCampaigns: Array<{
    id: string;
    name: string;
    channel: string;
    status: string;
    totalMessages: number;
    delivered: number;
    opened: number;
    failed: number;
    segmentName: string;
    createdAt: string;
  }>;
  channelBreakdown: Array<{
    channel: string;
    campaigns: number;
    messages: number;
    delivered: number;
  }>;
  deliveryFunnel: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
}

// ── Animated counter hook ───────────────────────────────────
function useAnimatedCount(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

// ── Color palette ───────────────────────────────────────────
const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];
const TAG_COLORS: Record<string, string> = {
  "high-value": "#10b981",
  "mid-value": "#06b6d4",
  "low-value": "#64748b",
  churned: "#ef4444",
  active: "#8b5cf6",
  "at-risk": "#f59e0b",
  loyal: "#ec4899",
  new: "#6366f1",
  "one-time": "#94a3b8",
};
const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  sms: Smartphone,
  whatsapp: MessageSquare,
  rcs: Zap,
};

// ── Custom Recharts Tooltip ─────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-lg px-3 py-2 shadow-xl text-sm">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="font-bold text-white">{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, suffix = "", prefix = "", delay = 0,
}: {
  label: string; value: number; icon: typeof Users; color: string;
  suffix?: string; prefix?: string; delay?: number;
}) {
  const animated = useAnimatedCount(value);
  const colorMap: Record<string, { bg: string; icon: string; line: string }> = {
    violet: { bg: "from-violet-500/15 to-violet-600/5", icon: "text-violet-400", line: "via-violet-500" },
    cyan: { bg: "from-cyan-500/15 to-cyan-600/5", icon: "text-cyan-400", line: "via-cyan-500" },
    emerald: { bg: "from-emerald-500/15 to-emerald-600/5", icon: "text-emerald-400", line: "via-emerald-500" },
    amber: { bg: "from-amber-500/15 to-amber-600/5", icon: "text-amber-400", line: "via-amber-500" },
    rose: { bg: "from-rose-500/15 to-rose-600/5", icon: "text-rose-400", line: "via-rose-500" },
    pink: { bg: "from-pink-500/15 to-pink-600/5", icon: "text-pink-400", line: "via-pink-500" },
  };
  const c = colorMap[color] || colorMap.violet;

  return (
    <div
      className="relative overflow-hidden glass-card p-6 flex flex-col justify-between group animate-fade-in hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 min-h-[160px]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top glowing line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${c.line} to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Ambient background glow */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${c.bg} rounded-full blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-700`} />
      
      <div className="relative z-10 flex items-start justify-between mb-2">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center border border-white/[0.08] shadow-inner group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <div className="w-8 h-8 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/[0.04] group-hover:bg-white/[0.06] transition-colors duration-500">
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors duration-500" />
        </div>
      </div>
      
      <div className="relative z-10 mt-auto pt-4">
        <p className="text-2xl font-bold text-white tracking-tight drop-shadow-sm group-hover:translate-x-1 transition-transform duration-500">
          {prefix}{animated.toLocaleString()}{suffix}
        </p>
        <p className={`text-[10px] ${c.icon} mt-1.5 uppercase tracking-wider font-bold opacity-80 group-hover:opacity-100 transition-opacity duration-500`}>
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Funnel Step ─────────────────────────────────────────────
function FunnelStep({ label, value, total, color, delay }: {
  label: string; value: number; total: number; color: string; delay: number;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const animated = useAnimatedCount(value);

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className="text-xs font-bold text-white">
          {animated.toLocaleString()}
          <span className="text-slate-500 ml-1 font-normal">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────
export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.error) {
          setDbError(true);
          setData(MOCK_DATA);
        } else {
          setData(json);
        }
      } catch {
        setDbError(true);
        setData(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  // Guaranteed non-null after loading
  const d = data ?? MOCK_DATA;
  const m = d.metrics;
  const funnelTotal = Math.max(d.deliveryFunnel.sent, 1);

  const cityChartData = (d.topCities ?? []).map((c) => ({ name: c.city, customers: c.count }));
  const tagChartData = (d.tagDistribution ?? [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((t) => ({ name: t.tag.replace(/-/g, " "), value: t.count, color: TAG_COLORS[t.tag] || "#64748b" }));

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <div className="relative z-10 space-y-8">

      {/* DB Warning Banner */}
      {dbError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm animate-fade-in">
          <Database className="w-4 h-4 flex-shrink-0" />
          <span>
            Database not connected — showing demo data.{" "}
            <span className="text-amber-400 font-medium">
              Set a valid <code className="font-mono text-xs bg-amber-500/10 px-1.5 py-0.5 rounded">DATABASE_URL</code> in your{" "}
              <code className="font-mono text-xs bg-amber-500/10 px-1.5 py-0.5 rounded">.env</code> file and run{" "}
              <code className="font-mono text-xs bg-amber-500/10 px-1.5 py-0.5 rounded">npm run db:push && npm run db:seed</code>.
            </span>
          </span>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 animate-fade-in mb-4">
        <div>
          <p className="text-sm font-medium text-violet-400/80 uppercase tracking-widest mb-2">{greeting}</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
            <span className="gradient-text">PulseReach</span> Dashboard
          </h1>
          <p className="text-base text-slate-400 mt-2 max-w-lg">Real-time overview of your marketing operations and AI insights.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/chat"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-violet-500/20 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            AI Copilot
          </Link>
          <Link
            href="/campaigns"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
          >
            <Megaphone className="w-4 h-4" />
            Campaigns
          </Link>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard label="Customers" value={m.totalCustomers} icon={Users} color="violet" delay={0} />
        <StatCard label="Total Orders" value={m.totalOrders} icon={ShoppingBag} color="cyan" delay={60} />
        <StatCard label="Revenue (₹)" value={m.totalRevenue} icon={DollarSign} color="emerald" delay={120} />
        <StatCard label="Campaigns" value={m.totalCampaigns} icon={Megaphone} color="amber" delay={180} />
        <StatCard label="Delivery Rate" value={m.avgDeliveryRate} icon={TrendingUp} color="pink" suffix="%" delay={240} />
        <StatCard label="Open Rate" value={m.avgOpenRate} icon={BarChart3} color="rose" suffix="%" delay={300} />
      </div>

      {/* ── Charts Row ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Customers by City */}
        <div className="lg:col-span-2 glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Customers by City</h3>
            </div>
            <Link href="/customers" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityChartData} barCategoryGap="20%">
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 11 }} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="customers" radius={[6, 6, 0, 0]}>
                  {cityChartData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audience Tag Distribution */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Audience Tags</h3>
            </div>
            <Link href="/segments" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              Segments <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5 space-y-3.5">
            {tagChartData.map((tag, i) => {
              const maxCount = tagChartData[0]?.value || 1;
              const pct = (tag.value / maxCount) * 100;
              return (
                <div key={tag.name} className="group animate-fade-in" style={{ animationDelay: `${400 + i * 60}ms` }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400 capitalize group-hover:text-white transition-colors">{tag.name}</span>
                    <span className="text-xs font-semibold text-white">{tag.value.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: tag.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Funnel + Channel + AI CTA Row ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Delivery Funnel */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "350ms" }}>
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.06]">
            <Send className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Delivery Funnel</h3>
          </div>
          <div className="p-6 space-y-4">
            {d.deliveryFunnel.sent === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">
                <Send className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                No campaigns sent yet
              </div>
            ) : (
              <>
                <FunnelStep label="Sent" value={d.deliveryFunnel.sent} total={funnelTotal} color="#8b5cf6" delay={400} />
                <FunnelStep label="Delivered" value={d.deliveryFunnel.delivered} total={funnelTotal} color="#10b981" delay={460} />
                <FunnelStep label="Opened" value={d.deliveryFunnel.opened} total={funnelTotal} color="#06b6d4" delay={520} />
                <FunnelStep label="Clicked" value={d.deliveryFunnel.clicked} total={funnelTotal} color="#f59e0b" delay={580} />
                <FunnelStep label="Failed" value={d.deliveryFunnel.failed} total={funnelTotal} color="#ef4444" delay={640} />
              </>
            )}
          </div>
        </div>

        {/* Channel Mix */}
        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.06]">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Channel Mix</h3>
          </div>
          <div className="p-6">
            {(d.channelBreakdown ?? []).length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-slate-700" />
                </div>
                <p>No campaigns yet</p>
                <Link href="/chat" className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-xs">
                  <Sparkles className="w-3 h-3" /> Launch with AI
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {d.channelBreakdown.map((ch, i) => {
                  const CI = CHANNEL_ICONS[ch.channel] || MessageSquare;
                  const rate = ch.messages > 0 ? Math.round((ch.delivered / ch.messages) * 100) : 0;
                  return (
                    <div key={ch.channel} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all group animate-fade-in" style={{ animationDelay: `${450 + i * 80}ms` }}>
                      <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.06] transition-colors">
                        <CI className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white capitalize">{ch.channel}</span>
                          <span className="text-xs font-bold text-emerald-400">{rate}%</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-slate-500">{ch.campaigns} campaign{ch.campaigns !== 1 ? "s" : ""}</span>
                          <span className="text-[11px] text-slate-500">{ch.messages.toLocaleString()} msgs</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* AI Copilot CTA */}
        <div className="glass-card overflow-hidden animate-fade-in relative group" style={{ animationDelay: "450ms" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="relative p-6 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-7 h-7 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Marketing Copilot</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                Create segments, draft messages, and launch campaigns — all through natural language.
              </p>
              <div className="space-y-2 mb-6">
                {[
                  "Find churned high-value customers",
                  "Draft a win-back WhatsApp campaign",
                  "Show me campaign performance",
                ].map((prompt, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                    <ChevronRight className="w-3 h-3 text-violet-500/60" />
                    <span>{prompt}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/chat"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4" />
              Start Conversation
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Campaigns ─────────────────────────────── */}
      <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Recent Campaigns</h3>
          </div>
          <Link href="/campaigns" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {(d.recentCampaigns ?? []).length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Megaphone className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-3">No campaigns yet.</p>
            <Link href="/chat" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/20 text-violet-400 text-sm hover:bg-violet-600/30 transition-all">
              <Sparkles className="w-3.5 h-3.5" /> Create with AI Copilot
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Campaign</th>
                  <th className="text-left">Channel</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Messages</th>
                  <th className="text-right">Delivered</th>
                  <th className="text-right">Opened</th>
                  <th className="text-right"><Clock className="w-3.5 h-3.5 inline" /></th>
                </tr>
              </thead>
              <tbody>
                {d.recentCampaigns.map((c, i) => {
                  const rate = c.totalMessages > 0 ? Math.round((c.delivered / c.totalMessages) * 100) : 0;
                  const CI = CHANNEL_ICONS[c.channel] || MessageSquare;
                  return (
                    <tr key={c.id} className="animate-fade-in group" style={{ animationDelay: `${550 + i * 60}ms` }}>
                      <td>
                        <Link href={`/campaigns/${c.id}`} className="text-white hover:text-violet-400 transition-colors font-medium">{c.name}</Link>
                        <p className="text-[11px] text-slate-500 mt-0.5">{c.segmentName}</p>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs uppercase text-slate-400 font-medium">
                          <CI className="w-3 h-3" />{c.channel}
                        </span>
                      </td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-right text-slate-300 font-medium">{c.totalMessages.toLocaleString()}</td>
                      <td className="text-right">
                        <span className="text-emerald-400 font-medium">{c.delivered.toLocaleString()}</span>
                        <span className="text-slate-600 text-xs ml-1">({rate}%)</span>
                      </td>
                      <td className="text-right text-violet-400 font-medium">{c.opened.toLocaleString()}</td>
                      <td className="text-right text-xs text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "600ms" }}>
        {[
          { href: "/segments", icon: Target, label: "Create Segment", color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-600/5" },
          { href: "/chat", icon: Sparkles, label: "AI Campaign", color: "text-violet-400", bg: "from-violet-500/10 to-violet-600/5" },
          { href: "/customers", icon: Users, label: "Browse Customers", color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-600/5" },
          { href: "/campaigns", icon: BarChart3, label: "View Analytics", color: "text-amber-400", bg: "from-amber-500/10 to-amber-600/5" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="glass-card p-4 flex items-center gap-3 group hover:bg-white/[0.03] transition-all"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{action.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}
