import { Opportunity } from "@/types/db";

export type SourceListing = {
  sourceUrl: string;
  title: string;
  organization: string;
  rawText: string;
  structured: Partial<Opportunity>;
  sourceSpecific: Record<string, unknown>;
};
