import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  _resend = new Resend(key);
  return _resend;
}

export type SendEmailArgs = {
  to: string;
  subject: string;
  react: ReactElement;
  /** Optional: override the From address; defaults to RESEND_FROM_EMAIL env. */
  from?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const from = args.from ?? process.env.RESEND_FROM_EMAIL;
  if (!from) {
    return { ok: false, error: "RESEND_FROM_EMAIL not set" };
  }
  try {
    const { data, error } = await getResend().emails.send({
      from,
      to: args.to,
      subject: args.subject,
      react: args.react,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id ?? "" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
