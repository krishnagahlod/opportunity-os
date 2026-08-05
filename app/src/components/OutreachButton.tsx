"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Props = {
  opportunityId: string;
};

export function OutreachButton({ opportunityId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunity_id: opportunityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate outreach");
      
      // Redirect to outreach page to view it
      router.push("/outreach");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={handleGenerate}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Send className="size-3.5" />
      )}
      Generate Outreach
    </Button>
  );
}
