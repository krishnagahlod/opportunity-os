-- ============================================================================
-- Opportunity OS — seed starter opportunities
-- Apply via: Supabase SQL Editor → paste → Run
-- Safe to re-run: uses ON CONFLICT DO NOTHING against the unique source_url.
-- ============================================================================

with manual as (
  select id from public.sources where name = 'Manual Admin Entry' limit 1
)
insert into public.opportunities (
  title, organization, category, description, summary, tags,
  deadline, eligibility, location, compensation, is_remote,
  apply_url, source_url, source_id, difficulty, estimated_value_score,
  featured, status
)
select
  d.title, d.organization, d.category, d.description, d.summary, d.tags,
  d.deadline, d.eligibility, d.location, d.compensation, d.is_remote,
  d.apply_url, d.source_url, manual.id, d.difficulty, d.estimated_value_score,
  d.featured, 'active'
from manual, (values
  (
    'Summer Software Engineering Internship',
    'Zerodha',
    'internship',
    'Work with the core trading platform team on high-throughput backend systems. You will touch Go, Python, and Postgres at scale. 8-week internship with conversion potential.',
    'Backend internship at Zerodha working on the core trading platform. 8 weeks, Bangalore.',
    array['backend','go','python','postgres','fintech'],
    '2026-06-15 23:59:00+05:30'::timestamptz,
    'Pre-final year B.Tech/BE (CS/IT/ECE). CGPA 7+.',
    'Bangalore', '₹60,000/month', false,
    'https://careers.zerodha.com/summer-internship-2026',
    'manual:zerodha-swe-summer-2026',
    'medium', 82, true
  ),
  (
    'APM Internship — Associate Product Manager',
    'Razorpay',
    'internship',
    'Join the payments product team. Define requirements, work with design + engineering, and ship features used by millions of merchants.',
    'APM internship at Razorpay — own features on the payments product. 10 weeks.',
    array['product','fintech','payments','apm'],
    '2026-05-30 23:59:00+05:30'::timestamptz,
    'Pre-final year. Any stream. Strong analytical + communication skills.',
    'Bangalore', '₹75,000/month', false,
    'https://razorpay.com/careers/apm-internship-2026',
    'manual:razorpay-apm-2026',
    'high', 90, true
  ),
  (
    'Data Science Intern',
    'Swiggy',
    'internship',
    'Build ML models for demand forecasting and delivery ETA prediction. Work with Python, Spark, and Databricks on real production data.',
    'ML internship at Swiggy — demand forecasting and ETA models. Python + Spark.',
    array['data-science','ml','python','spark','forecasting'],
    '2026-06-10 23:59:00+05:30'::timestamptz,
    'B.Tech/M.Tech in CS, Math, Stats, or related. Strong in Python + SQL.',
    'Bangalore', '₹70,000/month', false,
    'https://careers.swiggy.com/ds-intern-2026',
    'manual:swiggy-ds-2026',
    'medium', 78, false
  ),
  (
    'BCG ACE 2026',
    'Boston Consulting Group',
    'case_competition',
    'BCG''s flagship case competition. Teams of 3-4 solve a real business problem over 4 weeks. Winners get direct access to BCG interviews.',
    'BCG ACE — India''s biggest strategy case competition. Direct interview fast-track for winners.',
    array['consulting','strategy','case','bcg'],
    '2026-07-20 23:59:00+05:30'::timestamptz,
    'Pre-final and final year undergrads. Teams of 3-4.',
    'All India (virtual + finale in Mumbai)', 'Interview fast-track + ₹5L cash prize pool', true,
    'https://bcg.com/ace-india-2026',
    'manual:bcg-ace-2026',
    'high', 95, true
  ),
  (
    'Bain CoE Case Challenge',
    'Bain & Company',
    'case_competition',
    'Bain''s Consulting Opportunity of Excellence. Compete in a cracker case with 100 top teams nationwide. Winners get PPI to Bain Associate Consultant role.',
    'Bain CoE — national strategy case comp. PPI for winners to Bain Associate Consultant role.',
    array['consulting','strategy','case','bain'],
    '2026-08-05 23:59:00+05:30'::timestamptz,
    'Pre-final year undergrads. Teams of 3.',
    'All India', 'PPI to AC role + ₹3L prize', false,
    'https://bain.com/coe-india-2026',
    'manual:bain-coe-2026',
    'high', 92, false
  ),
  (
    'Smart India Hackathon 2026 — Software Edition',
    'Ministry of Education, GoI',
    'hackathon',
    'India''s largest government-backed hackathon. 36-hour finale where teams solve problem statements from ministries and PSUs. ₹1L prize per winning team.',
    'SIH 2026 — 36-hour national hackathon. Real problem statements from ministries. ₹1L per team.',
    array['hackathon','government','36hr','software'],
    '2026-07-01 23:59:00+05:30'::timestamptz,
    'All college students. Teams of 6.',
    'All India (offline finale)', '₹1,00,000 per winning team', false,
    'https://sih.gov.in/2026',
    'manual:sih-2026',
    'medium', 70, false
  ),
  (
    'HackWithInfy 2026',
    'Infosys',
    'hackathon',
    'Online coding competition across 3 rounds. Top performers get direct offers as System Engineer Specialist with higher package.',
    'Infosys HackWithInfy — competitive coding hackathon. Direct SES offers for top coders.',
    array['hackathon','competitive-programming','infosys','coding'],
    '2026-05-20 23:59:00+05:30'::timestamptz,
    'Graduating in 2027 or 2028. Any engineering stream.',
    'Online', 'SES offer (~₹8 LPA) + prize money', true,
    'https://infosys.com/hackwithinfy-2026',
    'manual:infy-hack-2026',
    'low', 72, false
  ),
  (
    'Flipkart GRiD 7.0',
    'Flipkart',
    'case_competition',
    'Flipkart''s flagship challenge across software, product, and business tracks. Winners receive PPI to Flipkart''s leadership programs.',
    'Flipkart GRiD — multi-track challenge (software/product/business). PPI for winners.',
    array['case','product','software','flipkart','multi-track'],
    '2026-07-10 23:59:00+05:30'::timestamptz,
    'Pre-final and final year undergrads.',
    'All India', 'PPI to leadership programs + ₹4L prize pool', false,
    'https://unstop.com/flipkart-grid-7',
    'manual:flipkart-grid-7',
    'high', 88, true
  ),
  (
    'Young India Fellowship 2027',
    'Ashoka University',
    'fellowship',
    'One-year postgrad multidisciplinary program. Learn from world-class faculty, work on Experiential Learning Module, and join a 1200+ strong alumni network.',
    'YIF 2027 — 1-year multidisciplinary postgrad at Ashoka. Strong alumni network.',
    array['fellowship','multidisciplinary','ashoka','liberal-arts'],
    '2026-07-31 23:59:00+05:30'::timestamptz,
    'Graduating 2027 or completed undergrad. Any discipline.',
    'Sonipat, Haryana', 'Need-based scholarships up to 100%', false,
    'https://ashoka.edu.in/yif',
    'manual:yif-2027',
    'high', 88, false
  ),
  (
    'Teach For India 2026 Fellowship',
    'Teach For India',
    'fellowship',
    '2-year paid fellowship teaching in low-income schools across India. Build leadership skills and drive educational equity.',
    'TFI — 2-year paid teaching fellowship in underserved schools. Leadership-building.',
    array['fellowship','education','social-impact','leadership'],
    '2026-06-30 23:59:00+05:30'::timestamptz,
    'Graduating in 2026. Any discipline. Indian citizen.',
    '8 Indian cities', '₹22,000/month stipend', false,
    'https://apply.teachforindia.org/2026',
    'manual:tfi-2026',
    'medium', 80, false
  ),
  (
    'Software Engineer — New Grad',
    'Atlassian',
    'fulltime',
    'Join the platform team in Bengaluru. Work on Jira, Confluence, or Bitbucket. Strong mentorship for new grads.',
    'New-grad SWE at Atlassian Bengaluru on Jira/Confluence/Bitbucket. Great mentorship.',
    array['software','fulltime','new-grad','atlassian'],
    '2026-06-01 23:59:00+05:30'::timestamptz,
    'Graduating 2026 with a CS or related degree.',
    'Bengaluru', '₹24-28 LPA CTC', false,
    'https://atlassian.com/careers/new-grad-2026',
    'manual:atlassian-ng-2026',
    'high', 90, false
  ),
  (
    'Graduate Product Manager',
    'Microsoft',
    'fulltime',
    'APM program — rotate through 3 product teams in 2 years. One of the most selective PM programs globally.',
    'Microsoft APM program — 2yr rotational PM role. Highly selective, globally renowned.',
    array['product','apm','microsoft','fulltime','rotational'],
    '2026-07-15 23:59:00+05:30'::timestamptz,
    'Graduating 2026. Any undergrad degree with strong analytical + communication skills.',
    'Hyderabad / Redmond', '₹32-38 LPA + relocation', false,
    'https://careers.microsoft.com/apm-2026',
    'manual:msft-apm-2026',
    'high', 95, true
  ),
  (
    'Design Internship',
    'Groww',
    'internship',
    'Work on Groww''s investing app used by 50M+ Indians. Full product design cycle — research, wireframes, high-fidelity, prototyping.',
    'Product design internship at Groww. End-to-end UX for a 50M-user investing app.',
    array['design','ux','product-design','figma','groww'],
    '2026-05-25 23:59:00+05:30'::timestamptz,
    'Pre-final year. Portfolio required.',
    'Bengaluru (Hybrid)', '₹55,000/month', false,
    'https://groww.in/careers/design-intern-2026',
    'manual:groww-design-2026',
    'medium', 78, false
  ),
  (
    'Off-Campus Placement Drive',
    'Goldman Sachs',
    'fulltime',
    'Engineering, Operations, and Finance roles for 2026 graduates. Open to students from all Tier 1 and Tier 2 colleges via off-campus route.',
    'GS off-campus 2026 — Engineering / Ops / Finance. Open to all Tier 1+2 colleges.',
    array['finance','engineering','goldman','fulltime','off-campus'],
    '2026-05-15 23:59:00+05:30'::timestamptz,
    'Graduating 2026. CGPA 7.5+.',
    'Bengaluru / Hyderabad', '₹18-30 LPA depending on role', false,
    'https://goldmansachs.com/careers/off-campus-india-2026',
    'manual:gs-ocp-2026',
    'high', 88, false
  ),
  (
    'Scaler Academy Open House',
    'Scaler',
    'workshop',
    'Free 3-hour workshop on system design + competitive programming. Taught by Scaler instructors. Good prep for placement season.',
    'Free 3-hr Scaler workshop on system design + CP. Good placement-season prep.',
    array['workshop','system-design','cp','free','scaler'],
    '2026-05-10 18:00:00+05:30'::timestamptz,
    'Open to all engineering students.',
    'Online', 'Free', true,
    'https://scaler.com/events/open-house-may-2026',
    'manual:scaler-openhouse-may-2026',
    'low', 50, false
  ),
  (
    'Kearney CEO Summit',
    'Kearney',
    'case_competition',
    'Invitation to Kearney''s flagship event for top 100 pre-final-year students. Solve a cracker case + network with senior partners.',
    'Kearney CEO Summit — flagship case event for top 100 students. Direct partner access.',
    array['consulting','strategy','kearney','networking'],
    '2026-06-20 23:59:00+05:30'::timestamptz,
    'Pre-final year. Selected via application + case test.',
    'Mumbai', 'All expenses paid + PPI opportunity', false,
    'https://kearney.com/ceo-summit-2026',
    'manual:kearney-ceosummit-2026',
    'high', 86, false
  ),
  (
    'Remote ML Research Collaborator',
    'EleutherAI',
    'remote_gig',
    'Part-time remote research role on open-source LLM projects. Flexible hours, collaborate with a global community of ML researchers.',
    'Remote part-time ML research with EleutherAI. Flexible hours, open-source LLM work.',
    array['ml','research','remote','open-source','llm'],
    '2026-05-31 23:59:00+05:30'::timestamptz,
    'Demonstrated ML research interest. No degree requirement.',
    'Remote', 'Unpaid, credit as co-author', true,
    'https://eleuther.ai/get-involved',
    'manual:eleuther-research-2026',
    'medium', 70, false
  ),
  (
    'IIM Bangalore Eximius 2026',
    'IIM Bangalore',
    'case_competition',
    'Eximius is IIMB''s annual entrepreneurship summit. Features pitching competitions, VC panels, and startup showcases open to undergrads.',
    'Eximius @ IIMB — entrepreneurship summit with pitch competitions and VC access.',
    array['entrepreneurship','startup','pitch','iimb','networking'],
    '2026-08-15 23:59:00+05:30'::timestamptz,
    'Open to all undergrads with a startup idea or working prototype.',
    'Bangalore', '₹5L prize pool + VC intros', false,
    'https://eximius.iimb.ac.in/2026',
    'manual:eximius-2026',
    'medium', 78, false
  )
) as d(
  title, organization, category, description, summary, tags,
  deadline, eligibility, location, compensation, is_remote,
  apply_url, source_url, difficulty, estimated_value_score, featured
)
on conflict (source_url) do nothing;
