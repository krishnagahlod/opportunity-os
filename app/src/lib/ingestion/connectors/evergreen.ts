import { SourceListing } from "../types";

const EVERGREEN_DATA = [
  {
    title: "GitHub Student Developer Pack",
    organization: "GitHub",
    url: "https://education.github.com/pack",
    categoryHint: "freebie",
    description: "The GitHub Student Developer Pack gives students free access to best-in-class developer tools and services from GitHub's partners. Includes free access to GitHub Copilot, DigitalOcean credits, Canva Pro, Namecheap domains, and more. Used by 10M+ students globally. Only requires uploading a valid student ID or university email.",
  },
  {
    title: "JetBrains All Products Pack - Student",
    organization: "JetBrains",
    url: "https://www.jetbrains.com/student/",
    categoryHint: "freebie",
    description: "JetBrains gives students free access to its entire suite of IDEs. Just verify your student status with an educational email or document. Includes free access to IntelliJ IDEA, PyCharm, WebStorm, DataGrip, and more. Worth over ₹20,000+ per year at commercial pricing. Can be renewed annually while enrolled.",
  },
  {
    title: "AWS Educate - Free Cloud Training",
    organization: "Amazon Web Services",
    url: "https://aws.amazon.com/training/awseducate/",
    categoryHint: "certification",
    description: "AWS Educate is Amazon's global initiative to provide students with cloud learning content, access to AWS services, and job placement resources. Earn free AWS badges and get $50 credit for practice. AWS is highly valued by employers, and this requires no credit card to sign up.",
  },
  {
    title: "Google Cloud Arcade",
    organization: "Google Cloud",
    url: "https://go.qwiklabs.com/arcade",
    categoryHint: "certification",
    description: "Complete hands-on Google Cloud labs and challenges to earn skill badges and redeem them for Google swag and cloud credits. One of the most consistent freebie programs from Google. India eligible, no purchase required.",
  },
  {
    title: "Microsoft Learn Student Ambassador",
    organization: "Microsoft",
    url: "https://mvp.microsoft.com/en-us/studentambassadors",
    categoryHint: "campus_ambassador",
    description: "Become a Microsoft Learn Student Ambassador. Get free Microsoft certifications, Azure credits, Visual Studio Enterprise subscription, LinkedIn Premium, and mentorship from Microsoft experts.",
  },
  {
    title: "Coursera - Google Data Analytics Cert (Free Audit)",
    organization: "Google",
    url: "https://www.coursera.org/professional-certificates/google-data-analytics",
    categoryHint: "certification",
    description: "Free access to Google's 8-course data analytics program. Audit is 100% free with no credit card needed. Covers SQL, Tableau, R. Self-paced and highly employable skills.",
  }
];

export async function fetchEvergreen(): Promise<SourceListing[]> {
  return EVERGREEN_DATA.map((item) => {
    return {
      sourceUrl: item.url,
      title: item.title,
      organization: item.organization,
      rawText: [
        `SOURCE: Evergreen Static Catalog`,
        `URL: ${item.url}`,
        `HINT CATEGORY: ${item.categoryHint}`,
        `DESCRIPTION:`,
        item.description,
      ].join("\n"),
      sourceSpecific: { is_evergreen: true },
      structured: {
        title: item.title,
        organization: item.organization,
        apply_url: item.url,
        category: item.categoryHint as any,
      }
    };
  });
}
