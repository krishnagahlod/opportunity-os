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
  const appHref = `${appUrl}/opportunity/${o.id}?action=plan`;
  const compText = o.compensation ? o.compensation : null;

  return (
    <Section style={itemStyle}>
      <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
        <tr>
          <td valign="top" style={{ paddingRight: "16px" }}>
            <Text style={itemTitleStyle}>
              <Link href={appHref} style={titleLinkStyle}>
                {o.title}
              </Link>
            </Text>
            
            <Text style={itemMetaStyle}>
              <strong style={{ color: "#18181b" }}>{o.organization}</strong>
              {o.location ? ` · ${o.is_remote ? "Remote" : o.location}` : ""}
              {" · "}
              {deadlineText}
              <span style={scoreBadgeStyle(score)}>{score}% Match</span>
            </Text>

            {compText && (
              <Text style={compStyle}>
                💵 {compText}
              </Text>
            )}
            
            {o.summary && (
              <Text style={summaryStyle}>
                {o.summary.length > 150 ? o.summary.substring(0, 150) + "..." : o.summary}
              </Text>
            )}

            {why && (
              <Text style={whyStyle}>
                🎯 <strong>Match:</strong> {why}
              </Text>
            )}
          </td>
          <td valign="top" width="100" style={{ paddingTop: "8px", textAlign: "right" }}>
            <Link href={appHref} style={actionPlanBtnStyle}>
              Action Plan
            </Link>
          </td>
        </tr>
      </table>
    </Section>
  );
}

/* ============ Inline styles (email clients ignore most CSS) ============ */

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#fafafa",
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: 0,
  WebkitFontSmoothing: "antialiased",
};

const containerStyle: React.CSSProperties = {
  margin: "40px auto",
  maxWidth: "600px",
  padding: "32px 24px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e4e4e7",
  boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const brandStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  color: "#18181b",
};

const dateStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  fontWeight: 500,
  color: "#71717a",
};

const greetingStyle: React.CSSProperties = {
  margin: "24px 0 8px",
  fontSize: "24px",
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: "#18181b",
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 32px",
  fontSize: "15px",
  color: "#52525b",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "28px",
};

const urgentSectionStyle: React.CSSProperties = {
  marginBottom: "28px",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #fcd34d",
  backgroundColor: "#fffbeb",
};

const recapSectionStyle: React.CSSProperties = {
  marginBottom: "28px",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #c7d2fe",
  backgroundColor: "#eef2ff",
};

const recapH2Style: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#3730a3",
  margin: "0 0 8px",
};

const recapStatLine: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#312e81",
  margin: 0,
};

const h2Style: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#71717a",
  margin: "0 0 12px",
  borderBottom: "1px solid #f4f4f5",
  paddingBottom: "8px",
};

const urgentH2Style: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#92400e",
  margin: "0 0 12px",
  borderBottom: "1px solid #fde68a",
  paddingBottom: "8px",
};

const itemStyle: React.CSSProperties = {
  padding: "16px 0",
  borderBottom: "1px solid #f4f4f5",
};

const itemTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 600,
  color: "#18181b",
  lineHeight: 1.4,
};

const titleLinkStyle: React.CSSProperties = {
  color: "#18181b",
  textDecoration: "none",
};

function scoreBadgeStyle(score: number): React.CSSProperties {
  let bg = "#eef2ff";
  let color = "#4f46e5";
  
  if (score >= 90) {
    bg = "#dcfce7";
    color = "#16a34a";
  } else if (score >= 70) {
    bg = "#f3e8ff";
    color = "#9333ea";
  }

  return {
    fontSize: "11px",
    fontWeight: 700,
    color,
    backgroundColor: bg,
    padding: "2px 6px",
    borderRadius: "6px",
    marginLeft: "8px",
    verticalAlign: "middle",
  };
}

const itemMetaStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "14px",
  color: "#52525b",
  display: "flex",
  alignItems: "center",
};

const compStyle: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: "13px",
  color: "#166534",
  backgroundColor: "#dcfce7",
  padding: "4px 8px",
  borderRadius: "4px",
  display: "inline-block",
  fontWeight: 500,
};

const summaryStyle: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: "14px",
  color: "#3f3f46",
  lineHeight: 1.6,
};

const whyStyle: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: "13px",
  color: "#4338ca",
  backgroundColor: "#eef2ff",
  padding: "8px 12px",
  borderRadius: "6px",
  lineHeight: 1.4,
  border: "1px solid #e0e7ff",
};

const actionPlanBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  backgroundColor: "#18181b",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 500,
  textDecoration: "none",
  borderRadius: "8px",
  textAlign: "center" as const,
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  width: "100%",
  boxSizing: "border-box" as const,
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e4e4e7",
  margin: "40px 0 24px",
};

const footerStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#52525b",
  textAlign: "center" as const,
};

const footerLinkStyle: React.CSSProperties = {
  color: "#4f46e5",
  textDecoration: "none",
  fontWeight: 500,
};

const mutedFooterStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#a1a1aa",
  textAlign: "center" as const,
  marginTop: "12px",
};
