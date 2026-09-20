"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareOpportunityButton({
  title,
  organization,
  url,
  className,
}: {
  title: string;
  organization: string;
  url?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareText = `Check out this opportunity: ${title} at ${organization} on Opportunity OS!`;

    // Try native Web Share API on mobile devices first
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${title} at ${organization}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        // User canceled or share failed; fallback to clipboard copy
        if (err?.name === "AbortError") return;
      }
    }

    // Fallback: Clipboard copy
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={`text-xs gap-1.5 cursor-pointer transition ${className || ""}`}
      title="Share opportunity link"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="size-3.5 text-muted-foreground" />
          <span>Share</span>
        </>
      )}
    </Button>
  );
}
