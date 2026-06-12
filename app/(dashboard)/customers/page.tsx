"use client";

import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  ShoppingBag,
  IndianRupee,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  Package,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  FileUp,
  Loader2,
  Trash2,
} from "lucide-react";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

interface OrderItem {
  name: string;
  category: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  amount: number;
  items: string | OrderItem[];
  channel: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  totalSpend: number;
  visitCount: number;
  lastVisitAt: string | null;
  createdAt: string;
  tags: string[];
  _count: { orders: number };
  orders: Order[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function parseOrderItems(items: string | OrderItem[]): OrderItem[] {
  if (typeof items === "string") {
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  }
  return items || [];
}

function getTagColor(tag: string): string {
  const colors: Record<string, string> = {
    "high-value": "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    "mid-value": "bg-blue-500/15 text-blue-300 border-blue-500/20",
    "low-value": "bg-slate-500/15 text-slate-400 border-slate-500/20",
    active: "bg-green-500/15 text-green-300 border-green-500/20",
    churned: "bg-rose-500/15 text-rose-300 border-rose-500/20",
    "at-risk": "bg-amber-500/15 text-amber-300 border-amber-500/20",
    loyal: "bg-violet-500/15 text-violet-300 border-violet-500/20",
    new: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
    "one-time": "bg-orange-500/15 text-orange-300 border-orange-500/20",
    "no-purchase": "bg-slate-500/15 text-slate-500 border-slate-500/20",
  };
  return colors[tag] || "bg-violet-500/10 text-violet-300 border-violet-500/20";
}

function getChannelIcon(channel: string): string {
  const icons: Record<string, string> = {
    online: "🌐",
    store: "🏪",
    mobile: "📱",
    app: "📲",
  };
  return icons[channel] || "🛒";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("totalSpend");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDeleteCustomer = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this customer?")) return;

    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete customer");
      }
    } catch (err) {
      alert("An error occurred while deleting the customer");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // CSV Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success?: boolean;
    message?: string;
    summary?: { totalRows: number; imported: number; skipped: number; errors: number };
    validationErrors?: string[];
    error?: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = useCallback(async (searchQuery?: string) => {
    setLoading(true);
    const q = searchQuery ?? search;
    try {
      const res = await fetch(
        `/api/customers?page=${page}&limit=20&sortBy=${sortBy}&sortOrder=${sortOrder}${
          q ? `&search=${encodeURIComponent(q)}` : ""
        }`
      );
      const data = await res.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  }

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  }

  function toggleExpand(id: string) {
    setExpandedCustomer(expandedCustomer === id ? null : id);
  }

  // CSV Upload handlers
  function openUploadModal() {
    setUploadFile(null);
    setUploadResult(null);
    setUploading(false);
    setShowUploadModal(true);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      setUploadFile(file);
      setUploadResult(null);
    } else {
      setUploadResult({ error: "Please drop a .csv file." });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResult(null);
    }
  }

  async function handleUpload() {
    if (!uploadFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch("/api/customers/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadResult(data);
        // Refresh customer list after successful import
        if (data.summary?.imported > 0) {
          fetchCustomers();
        }
      } else {
        setUploadResult(data);
      }
    } catch {
      setUploadResult({ error: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  }

  const SortHeader = ({
    field,
    children,
    align = "left",
  }: {
    field: string;
    children: React.ReactNode;
    align?: "left" | "right";
  }) => (
    <th
      className={`cursor-pointer hover:text-slate-300 transition-colors text-${align}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortBy === field && (
          <span className="text-violet-400">
            {sortOrder === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 animate-fade-in">
          <div>
            <p className="text-sm font-medium text-emerald-400/80 uppercase tracking-widest mb-2">Customer Database</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
              Store <span className="gradient-text">Customers</span> & Orders
            </h1>
            <p className="text-base text-slate-400 mt-2 max-w-xl">
              {pagination?.total?.toLocaleString() || 0} customers in your CRM. Track who they are, what they bought, and when.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openUploadModal}
              id="csv-upload-btn"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-sm font-medium transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </button>
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="input-dark !pl-11 w-72 lg:w-80 shadow-inner focus:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all"
              />
            </form>
          </div>
        </div>

        {/* CRM Info Pillars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {[
            {
              icon: User,
              label: "Who They Are",
              desc: "Name, email, phone, city",
              color: "from-violet-500/15 to-violet-600/5",
              line: "via-violet-500",
              iconColor: "text-violet-400",
            },
            {
              icon: ShoppingBag,
              label: "What They Bought",
              desc: "Products, categories, channels",
              color: "from-cyan-500/15 to-cyan-600/5",
              line: "via-cyan-500",
              iconColor: "text-cyan-400",
            },
            {
              icon: IndianRupee,
              label: "How Much They Spent",
              desc: "Total spend, order values",
              color: "from-emerald-500/15 to-emerald-600/5",
              line: "via-emerald-500",
              iconColor: "text-emerald-400",
            },
            {
              icon: CalendarDays,
              label: "When They Purchased",
              desc: "Last visit, order dates",
              color: "from-amber-500/15 to-amber-600/5",
              line: "via-amber-500",
              iconColor: "text-amber-400",
            },
          ].map((pillar, i) => (
            <div
              key={pillar.label}
              className="relative overflow-hidden glass-card p-5 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${pillar.line} to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${pillar.color} rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-700`} />
              <div className="relative z-10 flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center border border-white/[0.08] shadow-inner group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3 flex-shrink-0`}>
                  <pillar.icon className={`w-5 h-5 ${pillar.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-wide">{pillar.label}</p>
                  <p className="text-xs text-slate-400 mt-1">{pillar.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Table */}
        <div className="glass-card overflow-hidden border border-white/[0.08] shadow-xl animate-fade-in" style={{ animationDelay: '300ms' }}>
        {loading ? (
          <LoadingSpinner label="Loading customers..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="w-8" />
                    <SortHeader field="name">
                      <User className="w-3.5 h-3.5 text-violet-400 mr-1" />
                      Customer
                    </SortHeader>
                    <th className="text-left">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        Location
                      </span>
                    </th>
                    <SortHeader field="totalSpend" align="right">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                      Total Spend
                    </SortHeader>
                    <SortHeader field="visitCount" align="right">
                      <ShoppingBag className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                      Orders
                    </SortHeader>
                    <SortHeader field="lastVisitAt" align="right">
                      <CalendarDays className="w-3.5 h-3.5 text-amber-400 mr-1" />
                      Last Purchase
                    </SortHeader>
                    <th className="text-left">Tags</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <Fragment key={c.id}>
                      {/* Main customer row */}
                      <tr
                        className={`animate-fade-in cursor-pointer transition-colors ${
                          expandedCustomer === c.id
                            ? "bg-violet-500/5"
                            : "hover:bg-white/[0.02]"
                        }`}
                        style={{ animationDelay: `${i * 20}ms` }}
                        onClick={() => toggleExpand(c.id)}
                      >
                        <td className="w-8 text-center">
                          {expandedCustomer === c.id ? (
                            <ChevronUp className="w-4 h-4 text-violet-400 inline" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600 inline" />
                          )}
                        </td>
                        <td>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {c.name}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {c.email}
                              </span>
                              {c.phone && (
                                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {c.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-slate-400 text-sm">
                          {c.city || "—"}
                        </td>
                        <td className="text-right">
                          <span className="text-emerald-400 font-semibold font-mono text-sm">
                            ₹{Math.round(c.totalSpend).toLocaleString()}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="text-slate-300 font-mono text-sm">
                            {c.visitCount}
                          </span>
                        </td>
                        <td className="text-right">
                          <div>
                            <p className="text-sm text-slate-300">
                              {timeAgo(c.lastVisitAt)}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatDate(c.lastVisitAt)}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {c.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${getTagColor(
                                  tag
                                )}`}
                              >
                                {tag}
                              </span>
                            ))}
                            {c.tags.length > 3 && (
                              <span className="text-[10px] text-slate-500">
                                +{c.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={(e) => handleDeleteCustomer(e, c.id)}
                            disabled={deletingIds.has(c.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                            title="Delete customer"
                          >
                            {deletingIds.has(c.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded order details */}
                      {expandedCustomer === c.id && (
                        <tr key={`${c.id}-detail`}>
                          <td colSpan={8} className="p-0">
                            <div className="bg-white/[0.02] border-t border-b border-violet-500/10 px-6 py-4">
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                {/* Who */}
                                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                                  <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold mb-2 flex items-center gap-1.5">
                                    <User className="w-3 h-3" />
                                    Customer Profile
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Name</span>
                                      <span className="text-white font-medium">{c.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Email</span>
                                      <span className="text-slate-300">{c.email}</span>
                                    </div>
                                    {c.phone && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">Phone</span>
                                        <span className="text-slate-300">{c.phone}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">City</span>
                                      <span className="text-slate-300">{c.city || "Unknown"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Joined</span>
                                      <span className="text-slate-300">{formatDate(c.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Spending summary */}
                                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
                                    <IndianRupee className="w-3 h-3" />
                                    Spending Summary
                                  </p>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Total Spend</span>
                                      <span className="text-emerald-400 font-semibold font-mono">
                                        ₹{Math.round(c.totalSpend).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Total Orders</span>
                                      <span className="text-slate-300 font-mono">{c.visitCount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Avg Order</span>
                                      <span className="text-slate-300 font-mono">
                                        ₹{c.visitCount > 0
                                          ? Math.round(c.totalSpend / c.visitCount).toLocaleString()
                                          : "0"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Last Purchase</span>
                                      <span className="text-amber-300">
                                        {formatDate(c.lastVisitAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Tags */}
                                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                                  <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold mb-2">
                                    Customer Tags
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {c.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className={`text-[11px] px-2.5 py-1 rounded-full border ${getTagColor(tag)}`}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {c.tags.length === 0 && (
                                      <span className="text-xs text-slate-500">No tags</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Recent Orders — What they bought & When */}
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold mb-2 flex items-center gap-1.5">
                                  <Package className="w-3 h-3" />
                                  Recent Orders — What They Bought
                                </p>
                                {c.orders.length > 0 ? (
                                  <div className="space-y-2">
                                    {c.orders.map((order) => {
                                      const items = parseOrderItems(order.items);
                                      return (
                                        <div
                                          key={order.id}
                                          className="flex items-start gap-4 rounded-lg bg-white/[0.02] border border-white/[0.04] px-4 py-3"
                                        >
                                          {/* When */}
                                          <div className="flex-shrink-0 w-20 text-center">
                                            <p className="text-xs text-amber-300 font-medium">
                                              {timeAgo(order.createdAt)}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                              {formatDate(order.createdAt)}
                                            </p>
                                          </div>

                                          {/* What */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap gap-1.5">
                                              {items.map((item, idx) => (
                                                <span
                                                  key={idx}
                                                  className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/15"
                                                >
                                                  {item.name}{" "}
                                                  {item.qty > 1 && (
                                                    <span className="text-cyan-500">
                                                      ×{item.qty}
                                                    </span>
                                                  )}
                                                </span>
                                              ))}
                                            </div>
                                            {items.length > 0 && (
                                              <p className="text-[10px] text-slate-500 mt-1">
                                                {items[0].category}
                                                {" · "}
                                                {getChannelIcon(order.channel)}{" "}
                                                {order.channel}
                                              </p>
                                            )}
                                          </div>

                                          {/* How much */}
                                          <div className="flex-shrink-0 text-right">
                                            <p className="text-sm text-emerald-400 font-semibold font-mono">
                                              ₹{Math.round(order.amount).toLocaleString()}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 py-2">
                                    No orders yet
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06]">
                <p className="text-xs text-slate-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total.toLocaleString()} customers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-white/[0.06] text-slate-400 hover:text-white hover:border-violet-500/30 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-400 font-mono px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage(Math.min(pagination.totalPages, page + 1))
                    }
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg border border-white/[0.06] text-slate-400 hover:text-white hover:border-violet-500/30 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      </div>

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !uploading && setShowUploadModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-[#0d1117] border border-white/[0.08] shadow-2xl shadow-black/50 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Upload Customer CSV</h2>
                  <p className="text-xs text-slate-500">Import customers from a CSV file</p>
                </div>
              </div>
              <button
                onClick={() => !uploading && setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "border-violet-400 bg-violet-500/10"
                    : uploadFile
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {uploadFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-white">{uploadFile.name}</p>
                    <p className="text-xs text-slate-500">
                      {(uploadFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setUploadFile(null); setUploadResult(null); }}
                      className="text-xs text-rose-400 hover:text-rose-300 mt-1 cursor-pointer"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      <FileUp className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-300">
                      <span className="text-violet-400 font-medium">Click to browse</span> or drag & drop
                    </p>
                    <p className="text-xs text-slate-500">CSV file, max 5MB</p>
                  </div>
                )}
              </div>

              {/* CSV Format Hint */}
              <div className="mt-4 rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Expected CSV Format
                </p>
                <pre className="text-[11px] text-cyan-300/80 font-mono leading-relaxed overflow-x-auto">
{`name,email,phone,city
Aayush,a@example.com,9876543210,Delhi
Rahul,r@example.com,9876543211,Mumbai`}
                </pre>
                <p className="text-[10px] text-slate-500 mt-2">
                  <span className="text-white">name</span> and <span className="text-white">email</span> are required. 
                  <span className="text-slate-400"> phone</span> and <span className="text-slate-400">city</span> are optional.
                </p>
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div className="mt-4">
                  {uploadResult.success ? (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-emerald-300">{uploadResult.message}</p>
                          {uploadResult.summary && (
                            <div className="flex gap-4 mt-2 text-xs">
                              <span className="text-emerald-400">
                                ✓ {uploadResult.summary.imported} imported
                              </span>
                              {uploadResult.summary.skipped > 0 && (
                                <span className="text-amber-400">
                                  ⟳ {uploadResult.summary.skipped} duplicates skipped
                                </span>
                              )}
                              {uploadResult.summary.errors > 0 && (
                                <span className="text-rose-400">
                                  ✕ {uploadResult.summary.errors} errors
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-rose-300">
                            {uploadResult.error || "Upload failed"}
                          </p>
                          {uploadResult.validationErrors && uploadResult.validationErrors.length > 0 && (
                            <ul className="mt-2 space-y-0.5 text-xs text-rose-300/70">
                              {uploadResult.validationErrors.slice(0, 5).map((err, i) => (
                                <li key={i}>• {err}</li>
                              ))}
                              {uploadResult.validationErrors.length > 5 && (
                                <li className="text-rose-400">
                                  ...and {uploadResult.validationErrors.length - 5} more errors
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] transition-all disabled:opacity-50 cursor-pointer"
              >
                {uploadResult?.success ? "Close" : "Cancel"}
              </button>
              {!uploadResult?.success && (
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  id="upload-submit-btn"
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Customers
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
