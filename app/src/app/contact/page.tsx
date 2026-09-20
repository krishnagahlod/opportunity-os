import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Clock, ShieldCheck, UserCheck } from "lucide-react";

export const metadata = {
  title: "Contact & Grievance Redressal | Opportunity OS",
  description: "Official contact information, operational headquarters, support turnaround times, and statutory Grievance Redressal Officer details for Opportunity OS.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to Opportunity OS
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>DPDPA Section 13 Compliant</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary">
            <UserCheck className="size-3" />
            <span>Official Identity & Support Channels</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Contact & Grievance Redressal
          </h1>
          <p className="text-sm text-muted-foreground">
            Official operational information, support turnaround commitments, and statutory Grievance Redressal Officer (GRO) disclosures per the Digital Personal Data Protection Act (DPDPA 2023).
          </p>
        </div>

        <div className="space-y-8">
          {/* Support Channels Card */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 space-y-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <Mail className="size-5 text-primary" />
              Customer Support & Inquiries
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 rounded-xl border border-border/40 bg-muted/20 p-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  General Support & Helpdesk
                </span>
                <p className="text-foreground font-medium text-sm">
                  <a href="mailto:krishnagahlod@gmail.com" className="hover:text-primary transition-colors">
                    krishnagahlod@gmail.com
                  </a>
                </p>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono pt-1">
                  <Clock className="size-3" />
                  <span>Turnaround Time: 24–48 Business Hours</span>
                </div>
              </div>

              <div className="space-y-1.5 rounded-xl border border-border/40 bg-muted/20 p-4">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Billing & Refund Requests
                </span>
                <p className="text-foreground font-medium text-sm">
                  <a href="mailto:krishnagahlod@gmail.com?subject=Billing%20Inquiry%20-%20Opportunity%20OS" className="hover:text-primary transition-colors">
                    krishnagahlod@gmail.com
                  </a>
                </p>
                <div className="flex items-center gap-1.5 text-primary text-[11px] font-mono pt-1">
                  <Clock className="size-3" />
                  <span>Turnaround Time: 24–48 Business Hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grievance Redressal Officer (GRO) */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-500" />
              Statutory Grievance Redressal Officer (DPDPA 2023, Section 13)
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In accordance with Section 13 of the Digital Personal Data Protection Act, 2023, Opportunity OS has appointed a designated Grievance Redressal Officer to address questions, complaints, or rights requests regarding the processing of personal data.
            </p>
            <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-xs space-y-2 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="text-muted-foreground">Officer Name:</span>
                <span className="sm:col-span-2 text-foreground font-semibold font-sans">Krishna Gahlod</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="text-muted-foreground">Designation:</span>
                <span className="sm:col-span-2 text-foreground font-sans">Founder & Data Grievance Redressal Officer</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="text-muted-foreground">Official Email:</span>
                <span className="sm:col-span-2 text-foreground">
                  <a href="mailto:krishnagahlod@gmail.com?subject=Grievance%20Redressal%20Request%20-%20Opportunity%20OS" className="text-primary hover:underline">
                    krishnagahlod@gmail.com
                  </a>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="text-muted-foreground">Location:</span>
                <span className="sm:col-span-2 text-foreground font-sans">Mumbai, Maharashtra, India</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span className="text-muted-foreground">Statutory Resolution SLA:</span>
                <span className="sm:col-span-2 text-emerald-600 dark:text-emerald-400 font-semibold font-sans">Within 30 Calendar Days</span>
              </div>
            </div>
          </div>

          {/* Operational & Entity Information */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Operational Headquarters & Tax Status
            </h2>
            <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                <strong>Platform Operator:</strong> Krishna Gahlod, Individual Software Developer & Operator of Opportunity OS.
              </p>
              <p>
                <strong>Operating Headquarters:</strong> Mumbai, Maharashtra, India.
              </p>
              <p>
                <strong>Tax & GST Exemption:</strong> Operating under the CGST Act Section 22 threshold (&lt; ₹20 Lakhs/annum). No Goods and Services Tax (GST) is collected from consumers at checkout.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
