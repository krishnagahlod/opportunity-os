import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { format, parseISO } from "date-fns";
import type { DigestItem, WeekRecap } from "@/lib/notifications/digest";

type Props = {
  firstName: string;
  myDeadlines: DigestItem[];
  topPicks: DigestItem[];
  closingSoon: DigestItem[];
  /** Optional Sunday-only week recap; renders above the daily content. */
  weekRecap?: WeekRecap | null;
  appUrl: string;
};

export function DigestEmail({
  firstName,
  myDeadlines,
  topPicks,
  closingSoon,
  weekRecap,
  appUrl,
}: Props) {
  const previewLines: string[] = [];
  if (weekRecap) {
    previewLines.push(
      `Week recap: ${weekRecap.matchedThisWeek} new strong matches`,
    );
  }
  if (myDeadlines.length > 0) {
    previewLines.push(
      `${myDeadlines.length} of your saved closing in 48h`,
    );
  }
  if (topPicks[0]) {
    previewLines.push(`${topPicks[0].score} · ${topPicks[0].opportunity.title}`);
  }
  if (closingSoon.length > 0) {
    previewLines.push(`${closingSoon.length} closing soon`);
  }
  const preview =
    previewLines.join(" — ") || "Your daily opportunity digest";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Heading style={brandStyle}>Opportunity OS</Heading>
            <Text style={dateStyle}>
              {format(new Date(), "EEEE, MMM d")}
            </Text>
          </Section>

          <Heading style={greetingStyle}>Hey {firstName} —</Heading>
          <Text style={paragraphStyle}>
            Here&apos;s what your feed surfaced today.
          </Text>

          {weekRecap && (
            <Section style={recapSectionStyle}>
              <Heading style={recapH2Style}>📅 Your week</Heading>
              <Text style={recapStatLine}>
                <strong>{weekRecap.matchedThisWeek}</strong> new strong
                matches · <strong>{weekRecap.savedThisWeek}</strong> saved ·{" "}
                <strong>{weekRecap.closingThisWeek}</strong> closing this week
              </Text>
            </Section>
          )}

          {myDeadlines.length > 0 && (
            <Section style={urgentSectionStyle}>
              <Heading style={urgentH2Style}>
                🚨 Your saved · closing in 48h
              </Heading>
              {myDeadlines.map((item) => (
                <ItemRow key={item.opportunity.id} item={item} appUrl={appUrl} />
              ))}
            </Section>
          )}

          {closingSoon.length > 0 && (
            <Section style={sectionStyle}>
              <Heading style={h2Style}>⏰ Closing soon</Heading>
              {closingSoon.map((item) => (
                <ItemRow key={item.opportunity.id} item={item} appUrl={appUrl} />
              ))}
            </Section>
          )}

          {topPicks.length > 0 && (
            <Section style={sectionStyle}>
              <Heading style={h2Style}>✨ Top picks for you</Heading>
              {topPicks.map((item) => (
                <ItemRow key={item.opportunity.id} item={item} appUrl={appUrl} />
              ))}
            </Section>
          )}

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            <Link href={appUrl} style={footerLinkStyle}>
              Open dashboard
            </Link>
            {" · "}
            <Link
              href={`${appUrl}/settings`}
              style={footerLinkStyle}
            >
              Settings
            </Link>
          </Text>
          <Text style={mutedFooterStyle}>
            You&apos;re getting this because you&apos;re onboarded on Opportunity OS.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function ItemRow({ item, appUrl }: { item: DigestItem; appUrl: string }) {
  const { opportunity: o, score, why } = item;
  const deadlineText = o.deadline
    ? `Due ${format(parseISO(o.deadline), "MMM d")}`
    : "Rolling";
  const applyHref = o.apply_url ?? `${appUrl}/`;

  return (
    <Section style={itemStyle}>
      <Text style={itemTitleStyle}>
        <Link href={applyHref} style={titleLinkStyle}>
          {o.title}
        </Link>{" "}
        <span style={scoreStyle}>· {score}</span>
      </Text>
      <Text style={itemMetaStyle}>
        {o.organization}
        {o.location ? ` · ${o.is_remote ? "Remote" : o.location}` : ""}
        {" · "}
        {deadlineText}
      </Text>
      {why && <Text style={whyStyle}>{why}</Text>}
    </Section>
  );
}

/* ============ Inline styles (email clients ignore most CSS) ============ */

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#fafaf9",
  fontFamily:
    "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px 24px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const brandStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 600,
  letterSpacing: "-0.01em",
  color: "#18181b",
};

const dateStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#71717a",
};

const greetingStyle: React.CSSProperties = {
  margin: "16px 0 4px",
  fontSize: "22px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#18181b",
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 24px",
  fontSize: "14px",
  color: "#52525b",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "20px",
};

const urgentSectionStyle: React.CSSProperties = {
  marginBottom: "24px",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #fcd34d",
  backgroundColor: "#fffbeb",
};

const recapSectionStyle: React.CSSProperties = {
  marginBottom: "24px",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #c7d2fe",
  backgroundColor: "#eef2ff",
};

const recapH2Style: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#3730a3",
  margin: "0 0 8px",
};

const recapStatLine: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#312e81",
  margin: 0,
};

const h2Style: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#71717a",
  margin: "0 0 8px",
};

const urgentH2Style: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#92400e",
  margin: "0 0 8px",
};

const itemStyle: React.CSSProperties = {
  borderTop: "1px solid #e4e4e7",
  padding: "12px 0",
};

const itemTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 600,
  color: "#18181b",
  lineHeight: 1.35,
};

const titleLinkStyle: React.CSSProperties = {
  color: "#18181b",
  textDecoration: "none",
};

const scoreStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#6366f1",
};

const itemMetaStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "12.5px",
  color: "#71717a",
};

const whyStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "12px",
  color: "#6366f1",
  fontStyle: "italic",
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e4e4e7",
  margin: "32px 0 16px",
};

const footerStyle: React.CSSProperties = {
  fontSize: "12.5px",
  color: "#52525b",
  textAlign: "center" as const,
};

const footerLinkStyle: React.CSSProperties = {
  color: "#6366f1",
  textDecoration: "none",
};

const mutedFooterStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#a1a1aa",
  textAlign: "center" as const,
  marginTop: "8px",
};
