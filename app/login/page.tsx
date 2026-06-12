"use client";

import { signIn } from "next-auth/react";
import { MessageSquare, Sparkles, BarChart3, Users, ArrowRight, Bot, Zap } from "lucide-react";

export default function LoginPage() {

  return (
    <div className="min-h-screen flex bg-[#030712] overflow-hidden selection:bg-violet-500/30 relative">
      {/* LEFT SIDE - Hero Marketing (Hidden on smaller screens) */}
      <div className="hidden lg:flex w-[65%] relative flex-col justify-between p-12 border-r border-white/[0.05]">
        {/* Animated gradient backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-violet-600/15 blur-[120px] animate-pulse-glow" />
          <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        {/* Logo */}
        <div className="flex items-center w-[260px] h-20 overflow-hidden -ml-3">
          <img src="/logo.png" alt="PulseReach Logo" className="w-full h-full object-cover object-center scale-[1.35] drop-shadow-md" />
        </div>

        {/* Center Content */}
        <div className="relative z-10 w-full max-w-2xl 2xl:max-w-3xl">
          <div className="group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.08] mb-8 animate-fade-in shadow-[0_0_20px_rgba(139,92,246,0.1)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(139,92,246,0.2)] hover:border-violet-500/30 hover:bg-white/[0.04] overflow-hidden cursor-default">
            {/* Hover Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-cyan-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Top Shine Line */}
            <div className="absolute top-0 inset-x-0 h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30" />
            {/* Moving Shine Animation */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            
            <Sparkles className="w-3.5 h-3.5 text-amber-400 relative z-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-[10px] font-bold text-slate-200 tracking-[0.2em] uppercase relative z-10">Next-Gen Marketing</span>
          </div>
          <h1 className="text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Turn your customer data into <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">revenue.</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed mb-12 animate-fade-in font-light text-justify w-full" style={{ animationDelay: '200ms' }}>
            The AI-native CRM built for modern D2C brands. Automate your campaigns, segment with natural language, and chat directly with your marketing data.
          </p>

          {/* Feature floating cards */}
          <div className="grid grid-cols-2 gap-6 w-full animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-violet-500/30 hover:bg-white/[0.04] transition-all duration-500 flex items-center gap-5 cursor-default w-full overflow-hidden hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet-500/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:bg-violet-500/20 transition-all duration-500 relative z-10">
                <Users className="w-6 h-6 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              </div>
              <div className="relative z-10">
                <p className="text-base font-bold text-slate-100 tracking-wide group-hover:text-violet-200 transition-colors duration-300">Smart Segments</p>
                <p className="text-sm text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors duration-300">AI audience builder</p>
              </div>
            </div>
            
            <div className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-500 flex items-center gap-5 cursor-default w-full overflow-hidden hover:shadow-[0_8px_30px_rgba(6,182,212,0.12)] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-500 relative z-10">
                <BarChart3 className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
              </div>
              <div className="relative z-10">
                <p className="text-base font-bold text-slate-100 tracking-wide group-hover:text-cyan-200 transition-colors duration-300">Live Analytics</p>
                <p className="text-sm text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors duration-300">Track ROI instantly</p>
              </div>
            </div>
            
            <div className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all duration-500 flex items-center gap-5 cursor-default w-full overflow-hidden hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-500 relative z-10">
                <Bot className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
              <div className="relative z-10">
                <p className="text-base font-bold text-slate-100 tracking-wide group-hover:text-emerald-200 transition-colors duration-300">AI Copilot</p>
                <p className="text-sm text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors duration-300">Draft messages instantly</p>
              </div>
            </div>
            
            <div className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-amber-500/30 hover:bg-white/[0.04] transition-all duration-500 flex items-center gap-5 cursor-default w-full overflow-hidden hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-500/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-500 relative z-10">
                <Zap className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              </div>
              <div className="relative z-10">
                <p className="text-base font-bold text-slate-100 tracking-wide group-hover:text-amber-200 transition-colors duration-300">Auto Campaigns</p>
                <p className="text-sm text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors duration-300">Trigger on user actions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credits */}
        <div className="relative z-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-5 mt-8">
            <div className="flex items-center">
              <div className="flex -space-x-2.5">
                <img src="https://i.pravatar.cc/100?img=5" alt="User 1" className="w-8 h-8 rounded-full border-2 border-[#030712] object-cover" />
                <img src="https://i.pravatar.cc/100?img=11" alt="User 2" className="w-8 h-8 rounded-full border-2 border-[#030712] object-cover" />
                <img src="https://i.pravatar.cc/100?img=41" alt="User 3" className="w-8 h-8 rounded-full border-2 border-[#030712] object-cover" />
                <img src="https://i.pravatar.cc/100?img=12" alt="User 4" className="w-8 h-8 rounded-full border-2 border-[#030712] object-cover" />
              </div>
              <span className="ml-3 text-[13.5px] font-medium text-slate-300 tracking-wide">10k+ happy users</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-[2px]">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-[#FFC107] fill-[#FFC107]" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-[13.5px] font-medium text-slate-300">4.9/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Auth Form */}
      <div className="w-full lg:w-[35%] relative flex items-center justify-center p-8 lg:p-12">
        {/* Subtle background glow for mobile only */}
        <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        <div className="w-full max-w-[400px] relative z-10 animate-scale-in">
          {/* Mobile Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center w-[240px] h-20 overflow-hidden">
              <img src="/logo.png" alt="PulseReach Logo" className="w-full h-full object-cover object-center scale-[1.35] drop-shadow-lg" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-white tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-400">Log in to your PulseReach workspace to continue.</p>
          </div>

          {/* Premium Glass Auth Card */}
          <div className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden">
            {/* Glossy top highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              id="google-sign-in-btn"
              className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm transition-all duration-300 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.5)] hover:-translate-y-1 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all ml-auto absolute right-6" />
            </button>

            <div className="mt-8 pt-8 border-t border-white/[0.04] text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                By signing in, you agree to our <a href="#" className="text-slate-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-2">Terms of Service</a> and <a href="#" className="text-slate-400 hover:text-white transition-colors underline decoration-white/20 underline-offset-2">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
