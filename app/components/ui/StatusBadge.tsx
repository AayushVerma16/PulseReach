interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

const statusLabels: Record<string, string> = {
  queued: "Queued",
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  opened: "Opened",
  clicked: "Clicked",
  failed: "Failed",
  completed: "Completed",
  draft: "Draft",
};

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const label = statusLabels[status] || status;
  const sizeClasses =
    size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full status-${status} ${sizeClasses}`}
    >
      {(status === "sending" || status === "sent") && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  );
}
