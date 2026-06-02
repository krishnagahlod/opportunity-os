"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionPlanDrawer } from "./ActionPlanDrawer";

type Props = {
  opportunityId: string;
  defaultOpen?: boolean;
};

export function ActionPlanButton({ opportunityId, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="sm"
        className="gap-1.5 bg-foreground text-background hover:bg-foreground/90"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="size-3.5 text-yellow-400" />
        Action Plan
      </Button>

      <ActionPlanDrawer 
        opportunityId={opportunityId} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
