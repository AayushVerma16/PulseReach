"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Bot,
  Zap,
  Target,
  MessageSquare,
  BarChart3,
  ArrowRight,
  CornerDownLeft,
  Wand2,
  TrendingUp,
  Megaphone,
} from "lucide-react";
import ToolCallCard from "./ToolCallCard";

const SUGGESTED_PROMPTS = [
  {
    text: "Show me an overview of my customer base",
    icon: BarChart3,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10 border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/40",
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(6,182,212,0.1)]",
    description: "Customer analytics & insights",
  },
  {
    text: "Find high-value customers who haven't purchased in 3 months",
    icon: Target,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/20",
    hoverBorder: "hover:border-violet-500/40",
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)]",
    description: "Smart audience segmentation",
  },
  {
    text: "Create a win-back campaign for churned customers via WhatsApp",
    icon: Megaphone,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)]",
    description: "Automated campaign creation",
  },
  {
    text: "What segments do I have? Suggest a new campaign",
    icon: MessageSquare,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]",
    description: "Explore & optimize segments",
  },
  {
    text: "Send a 20% off offer to customers in Mumbai via SMS",
    icon: Zap,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10 border-pink-500/20",
    hoverBorder: "hover:border-pink-500/40",
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(236,72,153,0.1)]",
    description: "Instant promotion launch",
  },
];

const transport = new DefaultChatTransport({
  api: "/api/ai/chat",
});

export default function ChatPanel() {
  const { messages, sendMessage, status, error } = useChat({
    transport,
  });

  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "streaming" || status === "submitted";
  const isStreaming = status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue;
    setInputValue("");
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage({ text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestedPrompt = async (prompt: string) => {
    setInputValue("");
    await sendMessage({ text: prompt });
  };

  // Helper to check if a part is a tool part
  const isToolPart = (part: { type: string }) =>
    part.type.startsWith("tool-");

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-8 pb-40 scroll-smooth">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          {messages.length === 0 && (
            <div
              className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              {/* Hero section with ambient blobs */}
              <div className="relative mb-10">
                {/* Ambient blobs */}
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-violet-500/10 animate-blob-morph blur-3xl" />
                <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-cyan-500/8 animate-blob-morph-delayed blur-3xl" />

                {/* Spotlight sweep */}
                <div className="absolute inset-0 w-[200%] -left-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-spotlight pointer-events-none" />

                {/* Animated Icon with Pulse Ring + Orbiting Particles */}
                <div className="relative cursor-default animate-float">
                  {/* Pulse rings */}
                  <div className="absolute inset-0 rounded-[1.75rem] bg-violet-500/20 animate-pulse-ring" />
                  <div
                    className="absolute inset-0 rounded-[1.75rem] bg-cyan-500/15 animate-pulse-ring"
                    style={{ animationDelay: "1.5s" }}
                  />

                  {/* Orbiting particles */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="animate-orbit">
                      <div className="w-2 h-2 rounded-full bg-violet-400/60 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                    </div>
                    <div className="animate-orbit-reverse">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    </div>
                    <div className="animate-orbit" style={{ animationDuration: "18s" }}>
                      <div className="w-1 h-1 rounded-full bg-pink-400/40 shadow-[0_0_6px_rgba(236,72,153,0.4)]" />
                    </div>
                  </div>

                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/30 blur-3xl rounded-full opacity-60" />

                  {/* Icon container */}
                  <div className="relative w-24 h-24 rounded-[1.75rem] bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/[0.12] flex items-center justify-center shadow-[inset_0_0_30px_rgba(139,92,246,0.15)]">
                    <Sparkles className="w-11 h-11 text-violet-400 animate-glow-pulse" />
                  </div>
                </div>
              </div>

              <h2
                className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-cyan-300 mb-3 tracking-tight animate-gradient-text animate-reveal-up"
                style={{ animationDelay: "200ms" }}
              >
                Your Marketing Copilot
              </h2>
              <p
                className="text-slate-400 text-[15px] mb-4 leading-relaxed max-w-md mx-auto animate-reveal-up"
                style={{ animationDelay: "350ms" }}
              >
                I can analyze your customers, create targeted segments, draft
                compelling messages, and launch campaigns instantly.
              </p>

              {/* Capability badges */}
              <div
                className="flex flex-wrap justify-center gap-2 mb-10 animate-reveal-up"
                style={{ animationDelay: "450ms" }}
              >
                {[
                  { icon: TrendingUp, label: "Analytics", color: "text-cyan-400" },
                  { icon: Target, label: "Segmentation", color: "text-violet-400" },
                  { icon: Wand2, label: "AI Drafts", color: "text-amber-400" },
                  { icon: Megaphone, label: "Campaigns", color: "text-emerald-400" },
                ].map((cap) => (
                  <span
                    key={cap.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400"
                  >
                    <cap.icon className={`w-3.5 h-3.5 ${cap.color}`} />
                    {cap.label}
                  </span>
                ))}
              </div>

              {/* Suggested Prompts — 2-column grid on large */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                    className={`animate-card-enter group/btn text-left text-sm px-5 py-4 rounded-2xl border border-white/[0.06] bg-[#0a0a0f]/60 backdrop-blur-sm text-slate-300 hover:bg-[#12141a]/80 ${prompt.hoverBorder} hover:text-white ${prompt.hoverShadow} transition-all duration-300 flex items-start gap-4 cursor-pointer hover:-translate-y-0.5`}
                    style={{ animationDelay: `${500 + i * 80}ms` }}
                  >
                    <span
                      className={`w-9 h-9 rounded-xl ${prompt.bgColor} border flex items-center justify-center group-hover/btn:scale-110 transition-transform duration-300 shrink-0 mt-0.5`}
                    >
                      <prompt.icon className={`w-4 h-4 ${prompt.color}`} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium tracking-wide text-[13px] leading-snug block">
                        {prompt.text}
                      </span>
                      <span className="text-[11px] text-slate-600 mt-1 block">
                        {prompt.description}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover/btn:text-violet-400 group-hover/btn:translate-x-1 transition-all duration-300 mt-1 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, msgIdx) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.role === "user"
                  ? "justify-end animate-msg-right"
                  : "justify-start animate-msg-left"
              }`}
            >
              {message.role !== "user" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-500/25 border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  <Bot className="w-4.5 h-4.5 text-violet-300" />
                </div>
              )}
              <div
                className={`msg-bubble max-w-[80%] lg:max-w-[70%] ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-[1.5rem] rounded-tr-md shadow-[0_4px_20px_rgba(139,92,246,0.2)]"
                    : "bg-[#0f1117]/90 backdrop-blur-md border border-white/[0.06] text-slate-200 rounded-[1.5rem] rounded-tl-md shadow-xl"
                } px-5 py-4`}
              >
                {/* Render message parts */}
                {message.parts?.map((part, i) => {
                  if (part.type === "text" && "text" in part) {
                    const isLastAssistantMsg =
                      message.role === "assistant" &&
                      msgIdx === messages.length - 1;
                    const isLastPart = i === (message.parts?.length ?? 0) - 1;
                    const showCursor = isStreaming && isLastAssistantMsg && isLastPart;
                    return (
                      <div
                        key={i}
                        className={`ai-prose whitespace-pre-wrap ${
                          showCursor ? "streaming-cursor" : ""
                        }`}
                      >
                        {(part as { type: "text"; text: string }).text}
                      </div>
                    );
                  }
                  if (isToolPart(part)) {
                    const toolPart = part as unknown as {
                      type: string;
                      toolName: string;
                      toolCallId: string;
                      state: string;
                      input?: unknown;
                      output?: unknown;
                    };
                    return (
                      <div key={i} className="mt-3">
                        <ToolCallCard
                          toolName={toolPart.toolName}
                          args={
                            toolPart.input as Record<string, unknown>
                          }
                          result={toolPart.output}
                          state={toolPart.state}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
              {message.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0 mt-1 border border-white/[0.1] shadow-lg">
                  <User className="w-4.5 h-4.5 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-4 animate-msg-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/25 to-cyan-500/25 border border-white/[0.08] flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                <Bot className="w-4.5 h-4.5 text-violet-300" />
              </div>
              <div className="bg-[#0f1117]/90 backdrop-blur-md border border-white/[0.06] rounded-[1.5rem] rounded-tl-md shadow-xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="typing-indicator flex gap-1.5">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-md p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm text-center space-y-2 shadow-[0_8px_30px_rgba(239,68,68,0.1)] animate-scale-in">
              <p className="font-medium">
                {error.message || "Something went wrong. Please try again."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2 transition-colors"
              >
                Refresh page
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-gradient-to-t from-[#030712] via-[#030712]/95 to-transparent pt-10 pb-6 px-6">
          <form
            onSubmit={handleSubmit}
            className="relative group animate-slide-up max-w-3xl mx-auto"
          >
            {/* Ambient glow when focused */}
            <div
              className={`absolute -inset-2 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/10 to-cyan-600/20 blur-2xl rounded-3xl pointer-events-none transition-opacity duration-700 ${
                isFocused ? "opacity-100" : "opacity-0"
              }`}
            />

            <div
              className={`relative flex items-end gap-3 p-2 bg-[#0c1120]/95 backdrop-blur-xl border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 ${
                isFocused
                  ? "border-violet-500/40 shadow-[0_8px_40px_rgba(139,92,246,0.15)]"
                  : "border-white/[0.1]"
              }`}
            >
              <div className="pl-4 flex-1">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Copilot to analyze customers, create segments, launch campaigns..."
                  className="w-full bg-transparent text-[14.5px] text-white placeholder:text-slate-500 focus:outline-none py-2.5 tracking-wide resize-none min-h-[40px] max-h-[120px] leading-relaxed"
                  disabled={isLoading}
                  rows={1}
                />
              </div>

              {/* Right side controls */}
              <div className="flex items-center gap-2 pb-0.5">
                {/* Keyboard hint */}
                <div
                  className={`hidden sm:flex items-center gap-1 text-slate-600 transition-opacity duration-300 ${
                    inputValue.trim() ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <kbd className="kbd-badge">
                    <CornerDownLeft className="w-3 h-3" />
                  </kbd>
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-600 flex items-center justify-center transition-all duration-300 disabled:shadow-none shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] disabled:cursor-not-allowed group/btn shrink-0 hover:scale-105 active:scale-95"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 text-white/80 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  )}
                </button>
              </div>
            </div>

            {/* Footer hint */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="text-[10px] text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-500/40" />
                Powered by Gemini AI
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
