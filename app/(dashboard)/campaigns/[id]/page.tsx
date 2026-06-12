"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  XCircle,
  RefreshCw,
} from "lucide-react";
import StatusBadge from "@/app/components/ui/StatusBadge";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

interface CampaignDetail {
  id: string;
  name: string;
  channel: string;
  status: string;
  messageTemplate: string;
  totalMessages: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
  sentAt: string | null;
  segment: { name: string; customerCount: number };
}

interface SampleMessage {
  id: string;
  status: string;
  content: string;
  sentAt: string | null;
  deliveredAt: string | null;
  customer: { name: string; email: string };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<
    Record<string, number>
  >({});
  const [sampleMessages, setSampleMessages] = useState<SampleMessage[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCampaign() {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const data = await res.json();
      setCampaign(data.campaign);
      setStatusBreakdown(data.statusBreakdown || {});
      setSampleMessages(data.sampleMessages || []);
    } catch (err) {
      console.error("Failed to fetch campaign:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCampaign();
    // Auto-refresh every 5s while campaign is active
    const interval = setInterval(() => {
      if (
        campaign?.status === "sending" ||
        campaign?.status === "sent"
      ) {
        fetchCampaign();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [campaignId, campaign?.status]);

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner label="Loading campaign..." />
      </div>
    );
  }

  const funnelSteps = [
    {
      label: "Sent",
      value: campaign.sentCount,
      icon: Send,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Delivered",
      value: campaign.deliveredCount,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Opened",
      value: campaign.openedCount,
      icon: Eye,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Clicked",
      value: campaign.clickedCount,
      icon: MousePointerClick,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
    },
    {
      label: "Failed",
      value: campaign.failedCount,
      icon: XCircle,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/campaigns"
          className="p-2 rounded-lg border border-white/[0.06] text-slate-400 hover:text-white hover:border-violet-500/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
            <StatusBadge status={campaign.status} size="md" />
          </div>
          <p className="text-sm text-slate-500">
            {campaign.segment.name} · {campaign.channel.toUpperCase()} ·{" "}
            {campaign.totalMessages} messages
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchCampaign();
          }}
          className="p-2 rounded-lg border border-white/[0.06] text-slate-400 hover:text-violet-400 transition-all"
          title="Refresh stats"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={async () => {
            if (window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
              try {
                const res = await fetch(`/api/campaigns/${campaignId}`, {
                  method: "DELETE",
                });
                if (res.ok) {
                  window.location.href = "/campaigns";
                } else {
                  alert("Failed to delete campaign");
                }
              } catch (err) {
                console.error("Delete failed:", err);
                alert("Failed to delete campaign");
              }
            }
          }}
          className="px-4 py-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all text-sm font-medium ml-2"
        >
          Delete Campaign
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Delivery Rate",
            value: campaign.sentCount > 0 
              ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100) 
              : 0,
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20",
          },
          {
            label: "Open Rate",
            value: campaign.deliveredCount > 0 
              ? Math.round((campaign.openedCount / campaign.deliveredCount) * 100) 
              : 0,
            icon: Eye,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
            border: "border-violet-500/20",
          },
          {
            label: "Click-Through Rate (CTR)",
            value: campaign.openedCount > 0 
              ? Math.round((campaign.clickedCount / campaign.openedCount) * 100) 
              : 0,
            icon: MousePointerClick,
            color: "text-pink-400",
            bg: "bg-pink-500/10",
            border: "border-pink-500/20",
          },
        ].map((metric, i) => (
          <div 
            key={metric.label} 
            className={`glass-card p-5 border ${metric.border} animate-fade-in`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-400">{metric.label}</span>
              <div className={`w-8 h-8 rounded-lg ${metric.bg} flex items-center justify-center`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{metric.value}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Funnel */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-white mb-4">
          Delivery Funnel
        </h3>
        <div className="flex items-end gap-4">
          {funnelSteps.map((step, i) => {
            const percentage =
              campaign.totalMessages > 0
                ? Math.round((step.value / campaign.totalMessages) * 100)
                : 0;
            const barHeight = Math.max(percentage * 1.5, 8);
            const Icon = step.icon;

            return (
              <div
                key={step.label}
                className="flex-1 flex flex-col items-center gap-2 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Bar */}
                <div className="w-full flex flex-col items-center">
                  <span className={`text-lg font-bold ${step.color}`}>
                    {step.value}
                  </span>
                  <span className="text-xs text-slate-500 mb-2">
                    {percentage}%
                  </span>
                  <div
                    className={`w-full rounded-xl ${step.bg} transition-all duration-700`}
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                {/* Label */}
                <div className="flex items-center gap-1 mt-2">
                  <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                  <span className="text-xs text-slate-400">{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Template */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">
          Message Template
        </h3>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
            {campaign.messageTemplate}
          </pre>
        </div>
      </div>

      {/* Sample Messages */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">
            Message Log (sample)
          </h3>
        </div>
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">Recipient</th>
              <th className="text-left">Status</th>
              <th className="text-left">Content Preview</th>
              <th className="text-right">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {sampleMessages.map((msg, i) => (
              <tr
                key={msg.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <td>
                  <p className="text-white text-sm font-medium">
                    {msg.customer.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {msg.customer.email}
                  </p>
                </td>
                <td>
                  <StatusBadge status={msg.status} />
                </td>
                <td className="text-xs text-slate-400 max-w-xs truncate">
                  {msg.content.substring(0, 80)}...
                </td>
                <td className="text-right text-xs text-slate-500">
                  {msg.sentAt
                    ? new Date(msg.sentAt).toLocaleTimeString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
