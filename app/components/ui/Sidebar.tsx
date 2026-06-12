"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Target,
  Megaphone,
  Sparkles,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Copilot", icon: Sparkles, primary: true },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/segments", label: "Segments", icon: Target },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 flex flex-col border-r border-white/[0.04] bg-[#080b12] z-50">
      {/* Subtle Top Gradient */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-violet-600/[0.03] to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="relative px-5 pt-6 pb-2 flex justify-center">
        <Link href="/" className="flex items-center justify-center w-full max-w-[180px] h-12 overflow-hidden">
          <img src="/logo.png" alt="PulseReach Logo" className="w-full h-full object-cover object-center scale-[1.25] drop-shadow-md" />
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-5 my-3 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-1 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em]">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200
                ${isActive
                  ? "bg-violet-500/12 text-violet-300 shadow-[inset_0_1px_0_rgba(139,92,246,0.15)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              )}

              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200
                ${isActive
                  ? "bg-violet-500/15 text-violet-400"
                  : "bg-white/[0.03] text-slate-500 group-hover:text-slate-300 group-hover:bg-white/[0.05]"
                }
              `}>
                <Icon className="w-[17px] h-[17px]" />
              </div>

              <span className="flex-1">{item.label}</span>

              {item.primary && !isActive && (
                <span className="text-[9px] font-bold bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/15 uppercase tracking-wider">
                  AI
                </span>
              )}

              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-violet-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="relative">
        {/* Top fade gradient for smooth visual separation */}
        <div className="absolute -top-8 inset-x-0 h-8 bg-gradient-to-t from-[#080b12] to-transparent pointer-events-none" />

        <div className="p-4 space-y-3">
          {/* User Card */}
          {session?.user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-9 h-9 rounded-xl ring-2 ring-violet-500/20 ring-offset-1 ring-offset-[#080b12]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-200 truncate">
                  {session.user.name || "User"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            id="logout-btn"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold text-slate-500 hover:text-rose-300 hover:bg-rose-500/8 border border-white/[0.04] hover:border-rose-500/20 transition-all duration-300 cursor-pointer tracking-wide"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
