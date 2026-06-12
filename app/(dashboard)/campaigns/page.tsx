"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Megaphone,
  ArrowRight,
  Plus,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Mail,
  Smartphone,
  Users,
  Target,
  Sparkles,
} from "lucide-react";
import StatusBadge from "@/app/components/ui/StatusBadge";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

interface Segment {
  id: string;
  name: string;
  customerCount: number;
}

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  totalMessages: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
  segment: { name: string; customerCount: number };
}

// ──────────────────────────────────────────────────
// Channel definitions
// ──────────────────────────────────────────────────

const CHANNELS = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    color: "text-green-400",
    bgActive: "bg-green-500/15 border-green-500/30",
    hint: "Rich messages up to 1000 chars. Supports emojis & links.",
  },
  {
    value: "sms",
    label: "SMS",
    icon: Smartphone,
    color: "text-blue-400",
    bgActive: "bg-blue-500/15 border-blue-500/30",
    hint: "Keep under 160 chars. Be direct & include a short link.",
  },
  {
    value: "email",
    label: "Email",
    icon: Mail,
    color: "text-violet-400",
    bgActive: "bg-violet-500/15 border-violet-500/30",
    hint: "Can be longer. Use a compelling subject line.",
  },
  {
    value: "rcs",
    label: "RCS",
    icon: Sparkles,
    color: "text-amber-400",
    bgActive: "bg-amber-500/15 border-amber-500/30",
    hint: "Rich cards with images and buttons supported.",
  },
];

// ──────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Create campaign state
  const [showCreator, setShowCreator] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("whatsapp");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // AI message generation state
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("friendly");
  const [aiIncludeOffer, setAiIncludeOffer] = useState(false);
  const [aiOfferDetails, setAiOfferDetails] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");

  // ────── Fetch campaigns ──────
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns?limit=50");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ────── Fetch segments for the creator ──────
  async function fetchSegments() {
    setLoadingSegments(true);
    try {
      const res = await fetch("/api/segments");
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (err) {
      console.error("Failed to fetch segments:", err);
    } finally {
      setLoadingSegments(false);
    }
  }

  // ────── Open creator ──────
  function openCreator() {
    setCampaignName("");
    setSelectedSegment("");
    setSelectedChannel("whatsapp");
    setMessageTemplate("");
    setLaunchResult(null);
    setShowAiPanel(false);
    setAiPrompt("");
    setAiTone("friendly");
    setAiIncludeOffer(false);
    setAiOfferDetails("");
    setAiError("");
    setShowCreator(true);
    fetchSegments();
  }

  // ────── AI message generation ──────
  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;

    setAiGenerating(true);
    setAiError("");

    try {
      const res = await fetch("/api/ai/generate-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          channel: selectedChannel,
          segmentId: selectedSegment || undefined,
          tone: aiTone,
          includeOffer: aiIncludeOffer,
          offerDetails: aiIncludeOffer ? aiOfferDetails : undefined,
        }),
      });
      const data = await res.json();

      if (res.ok && data.message) {
        setMessageTemplate(data.message);
        setShowAiPanel(false);
      } else {
        setAiError(data.error || "Failed to generate message");
      }
    } catch {
      setAiError("Network error. Please try again.");
    } finally {
      setAiGenerating(false);
    }
  }

  // ────── Insert personalization token ──────
  function insertToken(token: string) {
    setMessageTemplate((prev) => prev + token);
  }

  // ────── Launch campaign ──────
  async function handleLaunch() {
    if (!campaignName.trim() || !selectedSegment || !messageTemplate.trim())
      return;

    setLaunching(true);
    setLaunchResult(null);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          segmentId: selectedSegment,
          channel: selectedChannel,
          messageTemplate,
          launch: true,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        const seg = segments.find((s) => s.id === selectedSegment);
        setLaunchResult({
          success: true,
          message: `Campaign "${campaignName}" launched! Sending to ${
            seg?.customerCount.toLocaleString() || "all"
          } customers via ${selectedChannel}.`,
        });
        fetchCampaigns();
        // Auto-close after success
        setTimeout(() => {
          setShowCreator(false);
        }, 3000);
      } else {
        setLaunchResult({
          success: false,
          message: data.error || "Failed to launch campaign",
        });
      }
    } catch {
      setLaunchResult({
        success: false,
        message: "Failed to launch campaign. Please try again.",
      });
    } finally {
      setLaunching(false);
    }
  }

  // ────── Helpers ──────
  function getChannelInfo(channel: string) {
    return CHANNELS.find((c) => c.value === channel) || CHANNELS[0];
  }

  const selectedSegmentData = segments.find((s) => s.id === selectedSegment);

  // ──────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner label="Loading campaigns..." />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 animate-fade-in">
          <div>
            <p className="text-sm font-medium text-pink-400/80 uppercase tracking-widest mb-2">Outbound Messaging</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
              Manage <span className="gradient-text">Campaigns</span>
            </h1>
            <p className="text-base text-slate-400 mt-2 max-w-xl">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total. Send targeted messages to your audience segments.
            </p>
          </div>
          <button
            onClick={openCreator}
            id="create-campaign-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-sm font-medium transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>

      {/* Empty state */}
      {campaigns.length === 0 && !showCreator && (
        <div className="relative overflow-hidden glass-card p-12 text-center group animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-white/[0.08] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Megaphone className="w-8 h-8 text-pink-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No campaigns yet</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
              Create your first campaign to send targeted messages to your segments and track their performance.
            </p>
            <button
              onClick={openCreator}
              className="inline-flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 font-medium transition-colors cursor-pointer group/btn"
            >
              Start building a campaign
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ─────── Campaign Creator Modal ─────── */}
      {showCreator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !launching && setShowCreator(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1117] border border-white/[0.08] shadow-2xl shadow-black/50 animate-fade-in">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#0d1117] flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/20 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Create Campaign
                  </h2>
                  <p className="text-xs text-slate-500">
                    Send targeted messages to a customer segment
                  </p>
                </div>
              </div>
              <button
                onClick={() => !launching && setShowCreator(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Step 1: Campaign Name */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                  Campaign Name *
                </label>
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Win Back Campaign"
                  className="input-dark w-full"
                />
              </div>

              {/* Step 2: Target Segment */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                  Target Audience *
                </label>
                {loadingSegments ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading segments...
                  </div>
                ) : segments.length === 0 ? (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-4 text-center">
                    <p className="text-sm text-amber-300">
                      No segments yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Create a segment first from the Segments page or via the
                      AI Copilot
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                    {segments.map((seg) => (
                      <button
                        key={seg.id}
                        onClick={() => setSelectedSegment(seg.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedSegment === seg.id
                            ? "bg-violet-500/10 border-violet-500/30"
                            : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Target
                            className={`w-4 h-4 ${
                              selectedSegment === seg.id
                                ? "text-violet-400"
                                : "text-slate-500"
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              selectedSegment === seg.id
                                ? "text-white font-medium"
                                : "text-slate-300"
                            }`}
                          >
                            {seg.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-xs text-slate-400 font-mono">
                            {seg.customerCount.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Channel */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                  Channel *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CHANNELS.map((ch) => {
                    const Icon = ch.icon;
                    const isActive = selectedChannel === ch.value;
                    return (
                      <button
                        key={ch.value}
                        onClick={() => setSelectedChannel(ch.value)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all cursor-pointer ${
                          isActive
                            ? ch.bgActive
                            : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            isActive ? ch.color : "text-slate-500"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            isActive ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {ch.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {getChannelInfo(selectedChannel).hint}
                </p>
              </div>

              {/* Step 4: Message Template */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                    Message *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => insertToken("{{name}}")}
                        className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/15 hover:bg-violet-500/20 transition-colors cursor-pointer"
                      >
                        + {"{{name}}"}
                      </button>
                      <button
                        onClick={() => insertToken("{{firstName}}")}
                        className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/15 hover:bg-violet-500/20 transition-colors cursor-pointer"
                      >
                        + {"{{firstName}}"}
                      </button>
                    </div>
                    <button
                      onClick={() => setShowAiPanel((prev) => !prev)}
                      id="ai-generate-message-btn"
                      className={`flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        showAiPanel
                          ? "bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-violet-300 border border-violet-500/30"
                          : "bg-gradient-to-r from-violet-600/80 to-pink-600/80 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-600/15"
                      }`}
                    >
                      {showAiPanel ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Close AI
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3 h-3" />
                          Generate with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── AI Generation Panel ── */}
                {showAiPanel && (
                  <div className="mb-3 rounded-xl bg-gradient-to-br from-violet-500/[0.06] to-pink-500/[0.06] border border-violet-500/15 p-4 space-y-3 animate-fade-in">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500/30 to-pink-500/30 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-violet-300" />
                      </div>
                      <span className="text-xs font-semibold text-violet-300">
                        AI Message Generator
                      </span>
                    </div>

                    {/* Prompt input */}
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Describe your message goal
                      </label>
                      <input
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && !aiGenerating) {
                            e.preventDefault();
                            handleAiGenerate();
                          }
                        }}
                        placeholder="e.g. Create a message for inactive high-value customers with a 20% discount"
                        className="input-dark w-full text-sm"
                        disabled={aiGenerating}
                        id="ai-prompt-input"
                      />
                    </div>

                    {/* Tone & Offer row */}
                    <div className="flex flex-wrap gap-3">
                      {/* Tone selector */}
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Tone
                        </label>
                        <select
                          value={aiTone}
                          onChange={(e) => setAiTone(e.target.value)}
                          className="input-dark w-full text-sm cursor-pointer"
                          disabled={aiGenerating}
                          id="ai-tone-select"
                        >
                          <option value="friendly">😊 Friendly</option>
                          <option value="professional">💼 Professional</option>
                          <option value="casual">🤙 Casual</option>
                          <option value="urgent">⚡ Urgent</option>
                          <option value="playful">🎉 Playful</option>
                        </select>
                      </div>

                      {/* Include offer toggle */}
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Include Offer?
                        </label>
                        <button
                          onClick={() => setAiIncludeOffer((prev) => !prev)}
                          disabled={aiGenerating}
                          className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                            aiIncludeOffer
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                              : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.12]"
                          }`}
                          id="ai-offer-toggle"
                        >
                          {aiIncludeOffer ? "✓ Yes, include offer" : "No offer"}
                        </button>
                      </div>
                    </div>

                    {/* Offer details (conditional) */}
                    {aiIncludeOffer && (
                      <div className="animate-fade-in">
                        <label className="block text-[10px] text-slate-400 mb-1">
                          Offer Details
                        </label>
                        <input
                          value={aiOfferDetails}
                          onChange={(e) => setAiOfferDetails(e.target.value)}
                          placeholder="e.g. 20% off, Free shipping, Buy 1 Get 1"
                          className="input-dark w-full text-sm"
                          disabled={aiGenerating}
                          id="ai-offer-input"
                        />
                      </div>
                    )}

                    {/* Quick prompt suggestions */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Win back inactive customers",
                        "Welcome new customers",
                        "Announce a flash sale",
                        "Re-engage high-value customers",
                        "Loyalty reward message",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setAiPrompt(suggestion)}
                          disabled={aiGenerating}
                          className="text-[10px] px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-violet-300 hover:border-violet-500/20 hover:bg-violet-500/5 transition-all cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    {/* Error display */}
                    {aiError && (
                      <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/15 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {aiError}
                      </div>
                    )}

                    {/* Generate button */}
                    <button
                      onClick={handleAiGenerate}
                      disabled={aiGenerating || !aiPrompt.trim()}
                      id="ai-generate-btn"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating message...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          Generate Message
                        </>
                      )}
                    </button>
                  </div>
                )}

                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder={`Hi {{name}},\nWe miss you! 💛\nGet 20% off on your next purchase.\nUse code: COMEBACK20\n\nShop now → example.com/shop`}
                  rows={5}
                  className="input-dark w-full resize-none"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-slate-500">
                    Use {"{{name}}"} or {"{{firstName}}"} for personalization
                  </p>
                  <p
                    className={`text-[10px] font-mono ${
                      messageTemplate.length > 1000
                        ? "text-rose-400"
                        : messageTemplate.length > 160 &&
                          selectedChannel === "sms"
                        ? "text-amber-400"
                        : "text-slate-500"
                    }`}
                  >
                    {messageTemplate.length} chars
                  </p>
                </div>
              </div>

              {/* Message Preview */}
              {messageTemplate && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                    Message Preview
                  </p>
                  <div
                    className={`rounded-lg p-4 ${
                      selectedChannel === "whatsapp"
                        ? "bg-[#0b4d3a]/50 border border-green-800/30"
                        : selectedChannel === "sms"
                        ? "bg-blue-950/30 border border-blue-800/20"
                        : selectedChannel === "email"
                        ? "bg-white/[0.04] border border-white/[0.08]"
                        : "bg-amber-950/20 border border-amber-800/20"
                    }`}
                  >
                    <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                      {messageTemplate
                        .replace(/\{\{name\}\}/g, "Aayush")
                        .replace(/\{\{firstName\}\}/g, "Aayush")}
                    </p>
                  </div>
                  {selectedSegmentData && (
                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                      This message will be sent to{" "}
                      <span className="text-white font-medium">
                        {selectedSegmentData.customerCount.toLocaleString()}
                      </span>{" "}
                      customers via{" "}
                      <span className="text-white font-medium">
                        {selectedChannel}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Launch Result */}
              {launchResult && (
                <div
                  className={`rounded-lg p-4 ${
                    launchResult.success
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-rose-500/10 border border-rose-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {launchResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400" />
                    )}
                    <p
                      className={`text-sm ${
                        launchResult.success
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {launchResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#0d1117] flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <div>
                {selectedSegmentData && (
                  <p className="text-xs text-slate-400">
                    <span className="text-white font-medium">
                      {selectedSegmentData.name}
                    </span>{" "}
                    ·{" "}
                    {selectedSegmentData.customerCount.toLocaleString()}{" "}
                    customers ·{" "}
                    <span className={getChannelInfo(selectedChannel).color}>
                      {getChannelInfo(selectedChannel).label}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreator(false)}
                  disabled={launching}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={
                    launching ||
                    !campaignName.trim() ||
                    !selectedSegment ||
                    !messageTemplate.trim()
                  }
                  id="launch-campaign-btn"
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                >
                  {launching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Launch Campaign
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────── Campaigns Table ─────── */}
      {campaigns.length > 0 && (
        <div className="glass-card overflow-hidden border border-white/[0.08] shadow-xl animate-fade-in" style={{ animationDelay: '200ms' }}>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Campaign</th>
                <th className="text-left">Channel</th>
                <th className="text-left">Status</th>
                <th className="text-right">Total</th>
                <th className="text-right">Delivered</th>
                <th className="text-right">Opened</th>
                <th className="text-right">Clicked</th>
                <th className="text-right">Failed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => {
                const deliveryRate =
                  c.totalMessages > 0
                    ? Math.round(
                        (c.deliveredCount / c.totalMessages) * 100
                      )
                    : 0;
                const chInfo = getChannelInfo(c.channel);
                const ChIcon = chInfo.icon;

                return (
                  <tr
                    key={c.id}
                    className="animate-fade-in group hover:bg-white/[0.02] transition-colors"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td>
                      <p className="text-white font-semibold group-hover:text-pink-300 transition-colors duration-300">{c.name}</p>
                      <p className="text-[11px] uppercase tracking-wider font-medium text-slate-500 mt-0.5">
                        {c.segment.name}
                      </p>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] ${chInfo.color}`}
                      >
                        <ChIcon className="w-3.5 h-3.5" />
                        {chInfo.label}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="text-right text-slate-300 font-mono text-sm">
                      {c.totalMessages.toLocaleString()}
                    </td>
                    <td className="text-right font-mono text-sm">
                      <span className="text-emerald-400">
                        {c.deliveredCount.toLocaleString()}
                      </span>
                      <span className="text-slate-600 ml-1.5 text-[11px]">
                        ({deliveryRate}%)
                      </span>
                    </td>
                    <td className="text-right text-violet-400 font-mono text-sm">
                      {c.openedCount.toLocaleString()}
                    </td>
                    <td className="text-right text-cyan-400 font-mono text-sm">
                      {c.clickedCount.toLocaleString()}
                    </td>
                    <td className="text-right text-rose-400 font-mono text-sm">
                      {c.failedCount.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] text-slate-400 hover:text-pink-400 transition-all inline-flex group-hover:shadow-[0_0_15px_rgba(244,114,182,0.15)]"
                      >
                        <ArrowRight className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-300" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
