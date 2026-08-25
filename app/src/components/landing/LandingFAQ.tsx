"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Where does Opportunity OS source job and internship listings from?",
    answer:
      "We continuously index over 50 verified career platforms including Greenhouse, Lever, Ashby, Y Combinator Work at a Startup, Hacker News 'Who is Hiring', Unstop, Internshala, Devpost hackathons, and top venture capital portfolio job boards. All listings are deduplicated and verified before appearing in your feed.",
  },
  {
    question: "How does the AI match score calculate my compatibility?",
    answer:
      "When you upload your resume, our parsing engine builds a deep technical profile of your skills, libraries, frameworks, past projects, and career level. When an opportunity is ingested, our AI scores the alignment across three pillars: Technical Fit (0-100), Career Brand Value, and Application Actionability.",
  },
  {
    question: "Is my resume and personal data secure?",
    answer:
      "Yes, 100%. Your resume is used solely to generate your personal matching embeddings and skill profile. We never share, sell, or monetize your resume data with third-party recruiters or data brokers.",
  },
  {
    question: "How does the IIT Bombay free access work?",
    answer:
      "If you sign in using your official @iitb.ac.in Google Workspace email, our system automatically verifies your academic domain and unlocks full Opportunity OS Pro access with zero payment required.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Through our Dodo Payments integration, we accept all major Indian payment methods including Google Pay, PhonePe, Paytm, BHIM UPI, QR code scan, Net Banking, and Indian/International Debit & Credit Cards.",
  },
  {
    question: "Can I use Opportunity OS across multiple devices?",
    answer:
      "Yes! Each account allows up to 3 simultaneous active device sessions (for example, your laptop, mobile browser, and tablet). You can view and manage all active sessions anytime in your Billing settings.",
  },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-24 border-b border-border/70 bg-card/20">
      <div className="mx-auto max-w-4xl px-4 space-y-12">
        <div className="text-center space-y-2">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
            Clear Answers
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about Opportunity OS, scoring, and passes.
          </p>
        </div>

        <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card overflow-hidden">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={faq.question} className="p-5 sm:p-6 transition-colors hover:bg-muted/20">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="flex w-full items-center justify-between gap-4 text-left font-semibold text-sm sm:text-base text-foreground"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180 text-primary"
                    )}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
