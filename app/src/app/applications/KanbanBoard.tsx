"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { ExternalLink, GripVertical } from "lucide-react";
import Link from "next/link";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { getCategoryStyle, orgInitials } from "@/lib/categories";
import { UrgencyDot } from "@/components/DeadlineLabel";
import { updateApplicationStatus } from "@/app/actions";
import type { ApplicationStatus, Opportunity } from "@/types/db";

export type KanbanItem = {
  id: string;                  // application row id
  opportunity_id: string;
  status: ApplicationStatus;
  updated_at: string;
  opportunity: Opportunity;
};

type ColumnEmphasis = "default" | "primary" | "muted";

const COLUMNS: {
  status: ApplicationStatus;
  label: string;
  tone: string;
  emphasis: ColumnEmphasis;
}[] = [
  {
    status: "saved",
    label: "Saved",
    tone: "from-slate-400/20 to-transparent text-slate-700 dark:text-slate-300",
    emphasis: "default",
  },
  {
    status: "applied",
    // Primary entry point — visually highlighted so the eye lands here.
    label: "Applied",
    tone: "from-indigo-400/25 to-transparent text-indigo-700 dark:text-indigo-300",
    emphasis: "primary",
  },
  {
    status: "interviewing",
    label: "Interviewing",
    tone: "from-amber-400/25 to-transparent text-amber-700 dark:text-amber-300",
    emphasis: "default",
  },
  {
    status: "rejected",
    // Terminal state — dimmed to recede.
    label: "Rejected",
    tone: "from-rose-400/25 to-transparent text-rose-700 dark:text-rose-300",
    emphasis: "muted",
  },
  {
    status: "won",
    label: "Won",
    tone: "from-emerald-400/25 to-transparent text-emerald-700 dark:text-emerald-300",
    emphasis: "default",
  },
];

export function KanbanBoard({ initial }: { initial: KanbanItem[] }) {
  const [items, setItems] = useState<KanbanItem[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // small drag before we steal click
    }),
  );

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const newStatus = String(over.id) as ApplicationStatus;
    const draggedId = String(active.id);
    const dragged = items.find((i) => i.id === draggedId);
    if (!dragged || dragged.status === newStatus) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === draggedId
          ? { ...i, status: newStatus, updated_at: new Date().toISOString() }
          : i,
      ),
    );

    // Persist
    startTransition(async () => {
      const res = await updateApplicationStatus(
        dragged.opportunity_id,
        newStatus,
      );
      if (res && "error" in res) {
        // Roll back on failure
        setItems((prev) =>
          prev.map((i) => (i.id === draggedId ? dragged : i)),
        );
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const colItems = items.filter((i) => i.status === col.status);
            return (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                tone={col.tone}
                emphasis={col.emphasis}
                items={colItems}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
        {activeItem ? (
          <div className="rotate-1 opacity-95 shadow-xl">
            <KanbanCardInner item={activeItem} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  label,
  tone,
  emphasis,
  items,
}: {
  status: ApplicationStatus;
  label: string;
  tone: string;
  emphasis: ColumnEmphasis;
  items: KanbanItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const isPrimary = emphasis === "primary";
  const isMuted = emphasis === "muted";

  return (
    <div
      ref={setNodeRef}
      role="list"
      aria-label={`${label} applications, ${items.length} card${items.length === 1 ? "" : "s"}. Drop zone.`}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40 transition-colors",
        // Primary entry-point column gets a top accent
        isPrimary && "border-t-[3px] border-t-primary/60",
        // Terminal column dims slightly
        isMuted && "opacity-80",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between bg-gradient-to-b px-3.5 py-2.5",
          tone,
          isMuted && "opacity-80",
        )}
      >
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em]">
          {label}
        </h3>
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-background/80 text-[10px] font-semibold tabular-nums text-foreground/80 ring-1 ring-inset ring-border/60">
          {items.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2.5">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-center text-[11px] text-muted-foreground">
            Drag here
          </div>
        ) : (
          items.map((item) => <KanbanCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

function KanbanCard({ item }: { item: KanbanItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: item.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-none",
        isDragging && "opacity-30",
      )}
    >
      <KanbanCardInner item={item} />
    </div>
  );
}

function KanbanCardInner({
  item,
  dragging,
}: {
  item: KanbanItem;
  dragging?: boolean;
}) {
  const cat = getCategoryStyle(item.opportunity.category);
  const Icon = cat.Icon;
  return (
    <div
      className={cn(
        "group relative cursor-grab rounded-xl border border-border/70 bg-card p-3 shadow-sm transition active:cursor-grabbing",
        !dragging && "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            cat.chipBg,
            cat.chipText,
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight">
            {item.opportunity.title}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              aria-hidden
              className="inline-flex size-4 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-foreground/70"
            >
              {orgInitials(item.opportunity.organization)}
            </span>
            <span className="truncate">{item.opportunity.organization}</span>
          </div>
        </div>
        {/* Grip visible at low opacity, full on hover/focus — keyboard users see it */}
        <GripVertical
          aria-hidden
          className="size-3.5 shrink-0 text-muted-foreground/40 opacity-50 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <UrgencyDot deadline={item.opportunity.deadline} />
        {item.opportunity.apply_url && (
          <Link
            href={item.opportunity.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-medium text-primary hover:underline"
          >
            Open <ExternalLink className="size-2.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
