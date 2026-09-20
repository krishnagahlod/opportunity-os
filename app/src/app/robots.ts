import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://opportunity-os.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/login",
          "/terms",
          "/privacy",
          "/cookies",
          "/refund",
          "/contact",
          "/opportunity/*",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/saved",
          "/saved/*",
          "/applications",
          "/applications/*",
          "/outreach",
          "/outreach/*",
          "/settings",
          "/settings/*",
          "/onboarding",
          "/onboarding/*",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
