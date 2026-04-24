import Link from "next/link";
import { formatDistanceToNowStrict, isPast, parseISO } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SaveButton } from "./SaveButton";
import { ApplyButton } from "./ApplyButton";
import type { ApplicationStatus, Opportunity } from "@/types/db";

const CATEGORY_LABEL: Record<string, string> = {
  internship: "Internship",
  fulltime: "Full-time",
  case_competition: "Case Comp",
  hackathon: "Hackathon",
  fellowship: "Fellowship",
  scholarship: "Scholarship",
  conference: "Conference",
  workshop: "Workshop",
  bootcamp: "Bootcamp",
  networking: "Networking",
  campus_ambassador: "Ambassador",
  remote_gig: "Remote gig",
  other: "Other",
};

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return null;
  const date = parseISO(deadline);
  const past = isPast(date);
  const distance = formatDistanceToNowStrict(date, { addSuffix: true });
  return (
    <Badge
      variant={past ? "destructive" : "secondary"}
      className="font-normal"
    >
      {past ? "Closed" : `Due ${distance}`}
    </Badge>
  );
}

export function OpportunityCard({
  opportunity,
  isSaved,
  applicationStatus,
}: {
  opportunity: Opportunity;
  isSaved: boolean;
  applicationStatus?: ApplicationStatus;
}) {
  const category = CATEGORY_LABEL[opportunity.category] ?? opportunity.category;
  const summary = opportunity.summary ?? opportunity.description ?? "";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-2">
            <Badge variant="outline">{category}</Badge>
            {opportunity.is_remote && (
              <Badge variant="outline">Remote</Badge>
            )}
          </div>
          <DeadlineBadge deadline={opportunity.deadline} />
        </div>
        <CardTitle className="mt-2 text-base leading-snug">
          {opportunity.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {opportunity.organization}
          {opportunity.location ? ` · ${opportunity.location}` : ""}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        {summary && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {summary}
          </p>
        )}
        {opportunity.compensation && (
          <p className="mt-2 text-xs font-medium">
            {opportunity.compensation}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-2">
        <SaveButton opportunityId={opportunity.id} isSaved={isSaved} />
        <ApplyButton
          opportunityId={opportunity.id}
          currentStatus={applicationStatus}
        />
        {opportunity.apply_url && (
          <Link
            href={opportunity.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "ml-auto",
            })}
          >
            Apply
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
