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
import type { PipelineHealth } from "@/lib/notifications/health";

/**
 * Pipeline-dead alert email. Sent to admin users via the daily-digest cron
 * when no ingestion activity has been logged in the last 24 hours.
 *
 * Intentionally bare-bones — this is a system alert, not a marketing email.
 * Goal: get the admin to open Render and republish workflows within minutes.
 */
export function PipelineAlertEmail({
  health,
  appUrl,
}: {
  health: PipelineHealth;
  appUrl: string;
}) {
  const hours =
    health.hoursSinceLast !== null ? Math.round(health.hoursSinceLast) : null;

  const preview = hours
    ? `Pipeline silent for ${hours}h — check Render`
    : "Pipeline silent — check Render";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={alertStyle}>
            <Heading style={alertHeadingStyle}>
              🚨 Pipeline appears dead
            </Heading>
            <Text style={alertTextStyle}>
              {hours !== null
                ? `No ingestion activity in the last ${hours} hours.`
                : "No ingestion logs found at all."}
            </Text>
          </Section>

          <Heading style={h2Style}>Likely causes</Heading>
          <Text style={paragraphStyle}>
            • <strong>Render free tier suspended n8n</strong> — monthly compute-hour quota exceeded.
            <br />
            • <strong>Workflows lost their published state</strong> — common
            after Render restarts the container.
            <br />
            • <strong>Neon database auto-paused</strong> — wakes on first
            connect but if the connection itself failed, n8n is stuck.
          </Text>

          <Heading style={h2Style}>Fix sequence</Heading>
          <Text style={paragraphStyle}>
            1. Open the Render dashboard, verify n8n service is{" "}
            <strong>Running</strong> (not Suspended).
            <br />
            2. Visit the n8n URL — should load the login screen, not a 503.
            <br />
            3. Log in, walk every workflow, click <strong>Publish</strong>{" "}
            (pill should flip to <code>1/1</code>).
            <br />
            4. Run one workflow manually as a smoke test.
          </Text>

          <Hr style={hrStyle} />

          <Text style={footerStyle}>
            <Link href={`${appUrl}/admin`} style={footerLinkStyle}>
              Open admin dashboard
            </Link>
          </Text>
          <Text style={mutedFooterStyle}>
            You&apos;re getting this because you&apos;re an admin on Opportunity
            OS and the ingestion pipeline has been silent for over a day. This
            alert repeats daily until it&apos;s fixed.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

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

const alertStyle: React.CSSProperties = {
  marginBottom: "24px",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #fca5a5",
  backgroundColor: "#fef2f2",
};

const alertHeadingStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#991b1b",
  margin: "0 0 8px",
};

const alertTextStyle: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#7f1d1d",
  margin: 0,
};

const h2Style: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#71717a",
  margin: "20px 0 8px",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#27272a",
  margin: "0 0 12px",
};

const hrStyle: React.CSSProperties = {
  margin: "32px 0 16px",
  borderColor: "#e4e4e7",
};

const footerStyle: React.CSSProperties = {
  fontSize: "13px",
  margin: "0 0 8px",
};

const footerLinkStyle: React.CSSProperties = {
  color: "#4f46e5",
  textDecoration: "underline",
};

const mutedFooterStyle: React.CSSProperties = {
  fontSize: "11.5px",
  lineHeight: "16px",
  color: "#a1a1aa",
  margin: 0,
};
