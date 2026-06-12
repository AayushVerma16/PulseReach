"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Target,
  Users,
  Plus,
  Trash2,
  Eye,
  Save,
  Loader2,
  ChevronDown,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
  MapPin,
  IndianRupee,
  ShoppingBag,
  CalendarDays,
  Tag,
  Mail,
  UserIcon,
} from "lucide-react";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

interface Segment {
  id: string;
  name: string;
  description: string | null;
  rules: string;
  naturalQuery: string | null;
  customerCount: number;
  createdAt: string;
  _count: { campaigns: number };
}

interface RuleCondition {
  field: string;
  operator: string;
  value: string | number;
}

interface PreviewCustomer {
  id: string;
  name: string;
  email: string;
  city: string | null;
  totalSpend: number;
  visitCount: number;
  lastVisitAt: string | null;
  tags: string[];
}

// ──────────────────────────────────────────────────
// Field / Operator definitions for the builder
// ──────────────────────────────────────────────────

const FIELD_OPTIONS: {
  value: string;
  label: string;
  icon: typeof IndianRupee;
  color: string;
  operators: { value: string; label: string }[];
  type: "number" | "date" | "text" | "tag";
}[] = [
  {
    value: "totalSpend",
    label: "Total Spend (₹)",
    icon: IndianRupee,
    color: "text-emerald-400",
    type: "number",
    operators: [
      { value: "gt", label: "greater than" },
      { value: "gte", label: "greater than or equal" },
      { value: "lt", label: "less than" },
      { value: "lte", label: "less than or equal" },
      { value: "eq", label: "equals" },
    ],
  },
  {
    value: "visitCount",
    label: "Number of Orders",
    icon: ShoppingBag,
    color: "text-cyan-400",
    type: "number",
    operators: [
      { value: "gt", label: "more than" },
      { value: "gte", label: "at least" },
      { value: "lt", label: "less than" },
      { value: "lte", label: "at most" },
      { value: "eq", label: "exactly" },
    ],
  },
  {
    value: "lastVisitAt",
    label: "Last Order Date",
    icon: CalendarDays,
    color: "text-amber-400",
    type: "date",
    operators: [
      { value: "before", label: "more than X days ago" },
      { value: "after", label: "within last X days" },
    ],
  },
  {
    value: "createdAt",
    label: "Customer Since",
    icon: CalendarDays,
    color: "text-violet-400",
    type: "date",
    operators: [
      { value: "before", label: "joined more than X days ago" },
      { value: "after", label: "joined within last X days" },
    ],
  },
  {
    value: "city",
    label: "City",
    icon: MapPin,
    color: "text-rose-400",
    type: "text",
    operators: [
      { value: "eq", label: "is" },
      { value: "neq", label: "is not" },
      { value: "contains", label: "contains" },
    ],
  },
  {
    value: "tags",
    label: "Customer Tag",
    icon: Tag,
    color: "text-violet-400",
    type: "tag",
    operators: [
      { value: "hasTag", label: "has tag" },
      { value: "notHasTag", label: "does not have tag" },
    ],
  },
  {
    value: "email",
    label: "Email",
    icon: Mail,
    color: "text-blue-400",
    type: "text",
    operators: [
      { value: "contains", label: "contains" },
      { value: "eq", label: "is" },
    ],
  },
  {
    value: "name",
    label: "Name",
    icon: UserIcon,
    color: "text-slate-400",
    type: "text",
    operators: [{ value: "contains", label: "contains" }],
  },
];

const TAG_SUGGESTIONS = [
  "high-value",
  "mid-value",
  "low-value",
  "active",
  "churned",
  "at-risk",
  "loyal",
  "new",
  "one-time",
  "no-purchase",
];

// ──────────────────────────────────────────────────
// Helper functions
// ──────────────────────────────────────────────────

function getFieldMeta(fieldValue: string) {
  return FIELD_OPTIONS.find((f) => f.value === fieldValue) || FIELD_OPTIONS[0];
}

function formatRuleForDisplay(rule: RuleCondition): string {
  const field = getFieldMeta(rule.field);
  const op = field.operators.find((o) => o.value === rule.operator);
  const opLabel = op?.label || rule.operator;

  if (field.type === "date") {
    return `${field.label} ${opLabel.replace("X", String(rule.value))}`;
  }
  if (field.type === "number") {
    return `${field.label} ${opLabel} ₹${Number(rule.value).toLocaleString()}`;
  }
  return `${field.label} ${opLabel} "${rule.value}"`;
}

function buildApiCondition(rule: RuleCondition) {
  const field = getFieldMeta(rule.field);
  let value: string | number = rule.value;

  if (field.type === "date") {
    // Convert days to the "_days_ago" format the engine expects
    value = `${rule.value}_days_ago`;
  } else if (field.type === "number") {
    value = Number(rule.value);
  }

  return {
    field: rule.field,
    operator: rule.operator,
    value,
  };
}

// ──────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Builder state
  const [showBuilder, setShowBuilder] = useState(false);
  const [rules, setRules] = useState<RuleCondition[]>([
    { field: "totalSpend", operator: "gt", value: 10000 },
  ]);
  const [segmentName, setSegmentName] = useState("");
  const [segmentDesc, setSegmentDesc] = useState("");

  // Preview state
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewCustomers, setPreviewCustomers] = useState<PreviewCustomer[]>(
    []
  );
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // ────── Fetch segments ──────
  const fetchSegments = useCallback(async () => {
    try {
      const res = await fetch("/api/segments");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSegments(data.segments || []);
    } catch (err) {
      console.error("Failed to load segments:", err);
      setError("Could not load segments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  // ────── Rule builder helpers ──────
  function addRule() {
    setRules([...rules, { field: "totalSpend", operator: "gt", value: "" }]);
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  function updateRule(index: number, updates: Partial<RuleCondition>) {
    setRules(
      rules.map((r, i) => {
        if (i !== index) return r;
        const updated = { ...r, ...updates };
        // When field changes, reset operator and value
        if (updates.field && updates.field !== r.field) {
          const newField = getFieldMeta(updates.field);
          updated.operator = newField.operators[0].value;
          updated.value = "";
        }
        return updated;
      })
    );
    // Clear previous preview when rules change
    setPreviewCount(null);
    setPreviewCustomers([]);
    setSaveResult(null);
  }

  // ────── Preview ──────
  async function handlePreview() {
    const validRules = rules.filter((r) => r.value !== "" && r.value !== undefined);
    if (validRules.length === 0) return;

    setPreviewing(true);
    setPreviewCount(null);
    setPreviewCustomers([]);

    try {
      const apiRules = validRules.map(buildApiCondition);
      const res = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: apiRules, limit: 5 }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewCount(data.count);
        setPreviewCustomers(data.customers || []);
      } else {
        setPreviewCount(null);
        console.error("Preview failed:", data);
      }
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setPreviewing(false);
    }
  }

  // ────── Save segment ──────
  async function handleSave() {
    if (!segmentName.trim()) return;
    const validRules = rules.filter((r) => r.value !== "" && r.value !== undefined);
    if (validRules.length === 0) return;

    setSaving(true);
    setSaveResult(null);

    try {
      const apiRules = validRules.map(buildApiCondition);
      const res = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDesc || undefined,
          rules: apiRules,
          naturalQuery: validRules.map(formatRuleForDisplay).join(" AND "),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveResult({
          success: true,
          message: `Segment "${data.segment.name}" created with ${data.customerCount.toLocaleString()} customers!`,
        });
        // Refresh segments list
        fetchSegments();
        // Reset builder after a delay
        setTimeout(() => {
          setShowBuilder(false);
          setRules([{ field: "totalSpend", operator: "gt", value: 10000 }]);
          setSegmentName("");
          setSegmentDesc("");
          setPreviewCount(null);
          setPreviewCustomers([]);
          setSaveResult(null);
        }, 2000);
      } else {
        setSaveResult({ success: false, message: data.error || "Failed to save segment" });
      }
    } catch {
      setSaveResult({ success: false, message: "Failed to save segment" });
    } finally {
      setSaving(false);
    }
  }

  // ────── Delete segment ──────
  async function handleDeleteSegment(id: string) {
    if (!window.confirm("Are you sure you want to delete this segment? Note: Segments used in campaigns cannot be deleted.")) return;

    try {
      const res = await fetch(`/api/segments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete segment");
      } else {
        fetchSegments();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete segment");
    }
  }

  // ────── Open builder ──────
  function openBuilder() {
    setShowBuilder(true);
    setRules([{ field: "totalSpend", operator: "gt", value: 10000 }]);
    setSegmentName("");
    setSegmentDesc("");
    setPreviewCount(null);
    setPreviewCustomers([]);
    setSaveResult(null);
  }

  // ──────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner label="Loading segments..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-rose-400 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-slate-400 hover:text-slate-200 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
      {/* Premium Ambient Background */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 animate-fade-in">
          <div>
            <p className="text-sm font-medium text-cyan-400/80 uppercase tracking-widest mb-2">Target Audiences</p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
              Customer <span className="gradient-text">Segments</span>
            </h1>
            <p className="text-base text-slate-400 mt-2 max-w-xl">
              {segments.length} segment{segments.length !== 1 ? "s" : ""} created. Group customers by spend, orders, and activity.
            </p>
          </div>
          <button
            onClick={openBuilder}
            id="create-segment-btn"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-sm font-medium transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Create Segment
          </button>
        </div>

      {/* Example Segments Hint (shown when no segments) */}
      {segments.length === 0 && !showBuilder && (
        <div className="glass-card p-8 mb-6">
          <div className="text-center mb-6">
            <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h2 className="text-lg text-white font-semibold mb-1">
              Create your first segment
            </h2>
            <p className="text-sm text-slate-400">
              Group customers into target audiences using rules like these:
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              {
                label: "Spent > ₹10,000",
                icon: IndianRupee,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                label: "No orders in 90 days",
                icon: CalendarDays,
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
              {
                label: "More than 5 orders",
                icon: ShoppingBag,
                color: "text-cyan-400",
                bg: "bg-cyan-500/10",
              },
              {
                label: "From Delhi",
                icon: MapPin,
                color: "text-rose-400",
                bg: "bg-rose-500/10",
              },
            ].map((ex) => (
              <div
                key={ex.label}
                className={`rounded-xl ${ex.bg} border border-white/[0.06] p-3 flex items-center gap-2`}
              >
                <ex.icon className={`w-4 h-4 ${ex.color} flex-shrink-0`} />
                <span className="text-xs text-slate-300">{ex.label}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-5">
            <button
              onClick={openBuilder}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
            >
              → Start building a segment
            </button>
          </div>
        </div>
      )}

      {/* ─────── Segment Builder Modal ─────── */}
      {showBuilder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBuilder(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1117] border border-white/[0.08] shadow-2xl shadow-black/50 animate-fade-in">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#0d1117] flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Create Segment
                  </h2>
                  <p className="text-xs text-slate-500">
                    Define rules to group customers into a target audience
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBuilder(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Segment Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                    Segment Name *
                  </label>
                  <input
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="e.g. High-Value Customers"
                    className="input-dark w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                    Description
                  </label>
                  <input
                    value={segmentDesc}
                    onChange={(e) => setSegmentDesc(e.target.value)}
                    placeholder="Optional description..."
                    className="input-dark w-full"
                  />
                </div>
              </div>

              {/* Rules */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-3">
                  Filter Rules (combined with AND logic)
                </p>

                <div className="space-y-3">
                  {rules.map((rule, i) => {
                    const fieldMeta = getFieldMeta(rule.field);
                    const FieldIcon = fieldMeta.icon;

                    return (
                      <div key={i} className="relative">
                        {/* AND connector */}
                        {i > 0 && (
                          <div className="flex items-center justify-center mb-3">
                            <div className="h-px flex-1 bg-white/[0.06]" />
                            <span className="px-3 text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                              AND
                            </span>
                            <div className="h-px flex-1 bg-white/[0.06]" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                          {/* Field icon */}
                          <div
                            className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${fieldMeta.color}`}
                          >
                            <FieldIcon className="w-4 h-4" />
                          </div>

                          {/* Field selector */}
                          <div className="relative">
                            <select
                              value={rule.field}
                              onChange={(e) =>
                                updateRule(i, { field: e.target.value })
                              }
                              className="appearance-none bg-[#1a1b2e] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white pr-7 cursor-pointer focus:outline-none focus:border-violet-500/30"
                            >
                              {FIELD_OPTIONS.map((f) => (
                                <option key={f.value} value={f.value} style={{ backgroundColor: '#1a1b2e', color: '#e2e8f0' }}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                          </div>

                          {/* Operator selector */}
                          <div className="relative">
                            <select
                              value={rule.operator}
                              onChange={(e) =>
                                updateRule(i, { operator: e.target.value })
                              }
                              className="appearance-none bg-[#1a1b2e] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 pr-7 cursor-pointer focus:outline-none focus:border-violet-500/30"
                            >
                              {fieldMeta.operators.map((op) => (
                                <option key={op.value} value={op.value} style={{ backgroundColor: '#1a1b2e', color: '#e2e8f0' }}>
                                  {op.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                          </div>

                          {/* Value input */}
                          {fieldMeta.type === "tag" ? (
                            <div className="relative">
                              <select
                                value={rule.value}
                                onChange={(e) =>
                                  updateRule(i, { value: e.target.value })
                                }
                                className="appearance-none bg-[#1a1b2e] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white pr-7 cursor-pointer focus:outline-none focus:border-violet-500/30"
                              >
                                <option value="" style={{ backgroundColor: '#1a1b2e', color: '#94a3b8' }}>Select tag...</option>
                                {TAG_SUGGESTIONS.map((t) => (
                                  <option key={t} value={t} style={{ backgroundColor: '#1a1b2e', color: '#e2e8f0' }}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                            </div>
                          ) : (
                            <input
                              type={
                                fieldMeta.type === "number" ||
                                fieldMeta.type === "date"
                                  ? "number"
                                  : "text"
                              }
                              value={rule.value}
                              onChange={(e) =>
                                updateRule(i, {
                                  value:
                                    fieldMeta.type === "number" ||
                                    fieldMeta.type === "date"
                                      ? Number(e.target.value)
                                      : e.target.value,
                                })
                              }
                              placeholder={
                                fieldMeta.type === "number"
                                  ? "10000"
                                  : fieldMeta.type === "date"
                                  ? "days (e.g. 90)"
                                  : "value..."
                              }
                              className="bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white w-28 focus:outline-none focus:border-violet-500/30"
                            />
                          )}

                          {/* Remove button */}
                          {rules.length > 1 && (
                            <button
                              onClick={() => removeRule(i)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add rule button */}
                <button
                  onClick={addRule}
                  className="mt-3 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another condition
                </button>
              </div>

              {/* Preview button */}
              <button
                onClick={handlePreview}
                disabled={
                  previewing ||
                  rules.every((r) => r.value === "" || r.value === undefined)
                }
                id="preview-segment-btn"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {previewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview Audience
                  </>
                )}
              </button>

              {/* Preview Results */}
              {previewCount !== null && (
                <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/15 p-5 animate-fade-in">
                  {/* Count */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {previewCount.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          customers found
                        </p>
                      </div>
                    </div>
                    <Sparkles className="w-5 h-5 text-amber-400/50" />
                  </div>

                  {/* Rule summary */}
                  <div className="mb-4 space-y-1">
                    {rules
                      .filter((r) => r.value !== "" && r.value !== undefined)
                      .map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {i > 0 && (
                            <span className="text-[9px] font-bold text-violet-400 uppercase">
                              AND
                            </span>
                          )}
                          <span className="text-xs text-slate-300">
                            {formatRuleForDisplay(r)}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Sample customers */}
                  {previewCustomers.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                        Sample Customers
                      </p>
                      <div className="space-y-1.5">
                        {previewCustomers.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                          >
                            <div className="flex items-center gap-3">
                              <p className="text-xs text-white font-medium">
                                {c.name}
                              </p>
                              <span className="text-[10px] text-slate-500">
                                {c.city || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-emerald-400 font-mono">
                                ₹{Math.round(c.totalSpend).toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-400">
                                {c.visitCount} orders
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {previewCount > 5 && (
                        <p className="text-[10px] text-slate-500 mt-2 text-center">
                          ...and {(previewCount - 5).toLocaleString()} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Save result */}
              {saveResult && (
                <div
                  className={`rounded-lg p-4 ${
                    saveResult.success
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-rose-500/10 border border-rose-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {saveResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <p
                      className={`text-sm ${
                        saveResult.success
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {saveResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-[#0d1117] flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setShowBuilder(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saving ||
                  !segmentName.trim() ||
                  rules.every((r) => r.value === "" || r.value === undefined)
                }
                id="save-segment-btn"
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Segment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────── Existing Segments Grid ─────── */}
      {segments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((segment, i) => {
            let parsedRules: RuleCondition[] = [];
            try {
              parsedRules =
                typeof segment.rules === "string"
                  ? JSON.parse(segment.rules)
                  : segment.rules;
            } catch {
              /* ignore */
            }

            return (
              <div
                key={segment.id}
                className="relative overflow-hidden glass-card p-6 flex flex-col group hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-500 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Top glowing line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Ambient background glow */}
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-cyan-500/15 to-violet-500/5 rounded-full blur-3xl opacity-40 group-hover:opacity-80 transition-opacity duration-700" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-violet-500/5 flex items-center justify-center border border-white/[0.08] shadow-inner group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3">
                      <Target className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-white font-bold text-2xl drop-shadow-sm group-hover:scale-105 origin-right transition-transform duration-500">
                          <Users className="w-5 h-5 text-violet-400" />
                          {segment.customerCount.toLocaleString()}
                        </div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mt-1">customers</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSegment(segment.id); }}
                        className="p-2 mt-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-slate-500 transition-colors duration-300"
                        title="Delete segment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                    {segment.name}
                  </h3>
                  {segment.description && (
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed line-clamp-2">
                      {segment.description}
                    </p>
                  )}

                  {/* Show rules as pills */}
                  {parsedRules.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                      {parsedRules.slice(0, 3).map((r: RuleCondition, ri: number) => {
                        const fm = getFieldMeta(r.field);
                        const FIcon = fm.icon;
                        return (
                          <span
                            key={ri}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-slate-300 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/5 transition-colors duration-500"
                          >
                            <FIcon className={`w-3.5 h-3.5 ${fm.color}`} />
                            {r.field}{" "}
                            {r.operator}{" "}
                            <span className="text-white">{String(r.value).replace("_days_ago", "d")}</span>
                          </span>
                        );
                      })}
                      {parsedRules.length > 3 && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 self-center">
                          +{parsedRules.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {segment.naturalQuery && (
                    <div className="mb-4 pt-4 border-t border-white/[0.06]">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
                        Rules
                      </p>
                      <p className="text-xs text-violet-300/80 italic leading-relaxed">
                        &ldquo;{segment.naturalQuery}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 group-hover:text-slate-300 transition-colors duration-300">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                      {segment._count.campaigns} campaign{segment._count.campaigns !== 1 ? "s" : ""}
                    </span>
                    <span className="uppercase tracking-wider">
                      {new Date(segment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
