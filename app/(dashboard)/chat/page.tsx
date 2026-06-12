import ChatPanel from "@/app/components/chat/ChatPanel";
import { Sparkles, Cpu, Shield, Zap } from "lucide-react";

export const metadata = {
  title: "AI Copilot — PulseReach",
  description: "Your AI-powered marketing assistant",
};

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-[#030712] copilot-grid-bg relative overflow-hidden">
      {/* Noise texture overlay */}
      <div className="absolute inset-0 noise-overlay pointer-events-none z-0" />

      {/* Premium Header */}
      <div className="relative z-10 px-6 py-4 border-b border-white/[0.06] overflow-hidden">
        {/* Animated gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-transparent to-cyan-600/5 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent header-line" />
        
        <div className="relative max-w-3xl mx-auto flex items-center gap-4">
          {/* Icon with glow ring */}
          <div className="relative group cursor-default">
            <div className="absolute -inset-1.5 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              <Sparkles className="w-5 h-5 text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
            </div>
          </div>

          {/* Title & description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
              AI Marketing Copilot
              <span className="text-[10px] font-medium text-violet-400/70 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/15">
                v2.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Create segments, draft messages, launch campaigns — all through conversation
            </p>
          </div>

          {/* Capabilities pills */}
          <div className="hidden lg:flex items-center gap-2">
            {[
              { icon: Cpu, label: "AI Powered", color: "text-violet-400/60" },
              { icon: Shield, label: "Secure", color: "text-emerald-400/60" },
              { icon: Zap, label: "Real-time", color: "text-amber-400/60" },
            ].map((cap) => (
              <div
                key={cap.label}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[10px] text-slate-500"
              >
                <cap.icon className={`w-3 h-3 ${cap.color}`} />
                {cap.label}
              </div>
            ))}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wider uppercase">Online</span>
            </span>
          </div>
        </div>
      </div>

      {/* Chat body */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ChatPanel />
      </div>
    </div>
  );
}
