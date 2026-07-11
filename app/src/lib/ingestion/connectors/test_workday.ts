import { fetchWorkday } from "./workday";

async function run() {
  const listings = await fetchWorkday({
    companies: [
      {
        displayName: "Mastercard",
        apiUrl: "https://mastercard.wd1.myworkdayjobs.com/wday/cxs/mastercard/CorporateCareers/jobs",
        jobBaseUrl: "https://mastercard.wd1.myworkdayjobs.com/en-US/CorporateCareers/job"
      },
      {
        displayName: "NVIDIA",
        apiUrl: "https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs",
        jobBaseUrl: "https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job"
      }
    ],
    searchTerms: ["intern", "new grad", "university"]
  });

  console.log(`Found ${listings.length} valid early-career/intern jobs from Workday!`);
  if (listings.length > 0) {
    console.log(listings[0]);
  }
}

run();
