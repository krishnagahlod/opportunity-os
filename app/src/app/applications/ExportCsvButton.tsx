"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KanbanItem } from "./KanbanBoard";

function escapeCsvField(val: string | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function ExportCsvButton({ items }: { items: KanbanItem[] }) {
  const handleExport = () => {
    if (!items || items.length === 0) return;

    const headers = [
      "Role",
      "Company",
      "Status",
      "Location",
      "Category",
      "Deadline",
      "Last Updated",
      "Apply URL",
    ];

    const rows = items.map((item) => [
      escapeCsvField(item.opportunity?.title),
      escapeCsvField(item.opportunity?.organization),
      escapeCsvField(item.status),
      escapeCsvField(
        item.opportunity?.is_remote
          ? "Remote"
          : item.opportunity?.location || "N/A",
      ),
      escapeCsvField(item.opportunity?.category),
      escapeCsvField(item.opportunity?.deadline || "Rolling"),
      escapeCsvField(
        item.updated_at
          ? new Date(item.updated_at).toLocaleDateString()
          : "N/A",
      ),
      escapeCsvField(item.opportunity?.apply_url || ""),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `opportunity-os-applications-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 shrink-0"
      title="Export applications to CSV"
    >
      <Download className="size-3.5" />
      Export CSV
    </Button>
  );
}
