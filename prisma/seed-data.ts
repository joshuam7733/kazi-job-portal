// Sample (demo) content for KAZI. Every company below is fictional and flagged `isSample: true`.

export const CATEGORIES = [
  { name: "Software & IT", slug: "software-it", icon: "Code2" },
  { name: "Accounting & Finance", slug: "accounting-finance", icon: "Calculator" },
  { name: "Healthcare", slug: "healthcare", icon: "HeartPulse" },
  { name: "Sales & Marketing", slug: "sales-marketing", icon: "Megaphone" },
  { name: "Engineering", slug: "engineering", icon: "Wrench" },
  { name: "Education & Training", slug: "education", icon: "GraduationCap" },
  { name: "NGO & Development", slug: "ngo-development", icon: "HandHeart" },
  { name: "Agriculture & Agribusiness", slug: "agriculture", icon: "Sprout" },
  { name: "Logistics & Supply Chain", slug: "logistics", icon: "Truck" },
  { name: "Hospitality & Tourism", slug: "hospitality", icon: "ConciergeBell" },
  { name: "Customer Service", slug: "customer-service", icon: "Headset" },
  { name: "Design & Creative", slug: "design-creative", icon: "Palette" },
  { name: "Data & Analytics", slug: "data-analytics", icon: "ChartNoAxesCombined" },
  { name: "Human Resources", slug: "human-resources", icon: "Users" },
  { name: "Administration", slug: "administration", icon: "ClipboardList" },
  { name: "Legal & Compliance", slug: "legal", icon: "Scale" },
];

export const INDUSTRIES = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Energy",
  "Agriculture",
  "Logistics",
  "Education",
  "Non-profit",
  "Hospitality",
  "Media & Marketing",
  "Telecommunications",
  "Retail",
  "Recruitment",
  "Manufacturing",
];

export const LOCATIONS = [
  { city: "Kampala", region: "Central", country: "Uganda", featured: true },
  { city: "Entebbe", region: "Central", country: "Uganda", featured: true },
  { city: "Jinja", region: "Eastern", country: "Uganda", featured: true },
  { city: "Mbarara", region: "Western", country: "Uganda", featured: true },
  { city: "Gulu", region: "Northern", country: "Uganda", featured: true },
  { city: "Mbale", region: "Eastern", country: "Uganda", featured: false },
  { city: "Fort Portal", region: "Western", country: "Uganda", featured: false },
  { city: "Arua", region: "West Nile", country: "Uganda", featured: false },
  { city: "Masaka", region: "Central", country: "Uganda", featured: false },
  { city: "Lira", region: "Northern", country: "Uganda", featured: false },
  { city: "Nairobi", region: "Nairobi County", country: "Kenya", featured: true },
  { city: "Kigali", region: "Kigali City", country: "Rwanda", featured: true },
  { city: "Dar es Salaam", region: "Dar es Salaam", country: "Tanzania", featured: false },
];

export type SeedCompany = {
  key: string;
  name: string;
  type?: "EMPLOYER" | "AGENCY";
  industry: string;
  city: string;
  size: "S1_10" | "S11_50" | "S51_200" | "S201_500" | "S501_1000" | "S1000_PLUS";
  founded: number;
  tagline: string;
  description: string;
  brandColor: string;
  verified: "VERIFIED" | "PENDING" | "UNVERIFIED";
  featured?: boolean;
  owner: { name: string; email: string; title: string };
  benefits: string[];
};

export const COMPANIES: SeedCompany[] = [
  {
    key: "mwezi",
    name: "Mwezi Software Labs",
    industry: "Technology",
    city: "Kampala",
    size: "S51_200",
    founded: 2016,
    tagline: "Building payment and logistics software for African businesses.",
    description:
      "Mwezi Software Labs designs and runs software that helps East African merchants get paid, track stock and deliver goods. Our product and engineering teams work from Kampala with colleagues across Nairobi and Kigali, and we invest heavily in growing local engineering talent through mentorship and paid learning time.",
    brandColor: "#3B5BDB",
    verified: "VERIFIED",
    featured: true,
    owner: { name: "Grace Nakato", email: "employer@kazi.test", title: "Head of Talent" },
    benefits: ["Private medical cover for you and two dependants", "Annual learning budget of UGX 3,000,000", "Flexible hybrid schedule", "Laptop and monthly internet stipend"],
  },
  {
    key: "nile-ledger",
    name: "Nile Ledger Partners",
    industry: "Financial Services",
    city: "Kampala",
    size: "S201_500",
    founded: 2004,
    tagline: "Audit, tax and advisory for growing East African organisations.",
    description:
      "Nile Ledger Partners provides audit, tax, accounting and advisory services to companies, NGOs and public bodies across Uganda and the region. We train professionals toward ACCA and CPA qualifications and support exam leave and fees for staff.",
    brandColor: "#0B7285",
    verified: "VERIFIED",
    featured: true,
    owner: { name: "Daniel Okello", email: "hr@nileledger.test", title: "HR Manager" },
    benefits: ["ACCA/CPA exam sponsorship", "Medical insurance", "Performance bonus", "Structured mentorship"],
  },
  {
    key: "kivu-health",
    name: "Kivu Health Network",
    industry: "Healthcare",
    city: "Mbarara",
    size: "S501_1000",
    founded: 2010,
    tagline: "Community hospitals and clinics across Western Uganda.",
    description:
      "Kivu Health Network operates two hospitals and eleven community clinics in Western Uganda, focused on maternal health, chronic disease care and outreach. We are expanding diagnostics and digital health records across our facilities.",
    brandColor: "#C2255C",
    verified: "VERIFIED",
    featured: true,
    owner: { name: "Dr. Sarah Kemigisha", email: "careers@kivuhealth.test", title: "Director of Human Resources" },
    benefits: ["Staff housing allowance for upcountry postings", "Continuing medical education", "Medical cover", "Night-shift allowances"],
  },
  {
    key: "pearl-grid",
    name: "Pearl Grid Energy",
    industry: "Energy",
    city: "Jinja",
    size: "S201_500",
    founded: 2014,
    tagline: "Solar home systems and mini-grids for rural communities.",
    description:
      "Pearl Grid Energy installs and maintains solar home systems and village mini-grids in Eastern and Northern Uganda. Our field teams, engineers and customer agents bring reliable power to more than 120,000 households.",
    brandColor: "#E8590C",
    verified: "VERIFIED",
    featured: true,
    owner: { name: "Brian Wafula", email: "people@pearlgrid.test", title: "People Partner" },
    benefits: ["Motorcycle and fuel allowance for field roles", "Medical insurance", "Paid technical certifications", "Quarterly team retreats"],
  },
  {
    key: "rwenzori-agro",
    name: "Rwenzori Agro Exports",
    industry: "Agriculture",
    city: "Fort Portal",
    size: "S51_200",
    founded: 2012,
    tagline: "Specialty coffee and tea sourced from smallholder farmers.",
    description:
      "Rwenzori Agro Exports works with over 6,000 smallholder farmers to process and export specialty coffee and tea. We run farmer training, quality labs and traceability systems from our Fort Portal hub.",
    brandColor: "#2B8A3E",
    verified: "VERIFIED",
    owner: { name: "Esther Kabasinguzi", email: "jobs@rwenzoriagro.test", title: "Operations Manager" },
    benefits: ["Transport allowance", "Medical cover", "Meals at the processing site", "Annual harvest bonus"],
  },
  {
    key: "lakeside",
    name: "Lakeside Logistics EA",
    industry: "Logistics",
    city: "Kampala",
    size: "S201_500",
    founded: 2009,
    tagline: "Freight, warehousing and last-mile delivery across the Northern Corridor.",
    description:
      "Lakeside Logistics EA moves cargo between Mombasa, Kampala, Kigali and Juba, and runs bonded warehouses in Kampala and Nairobi. We are digitising fleet tracking and customer billing.",
    brandColor: "#1971C2",
    verified: "VERIFIED",
    owner: { name: "Peter Mugisha", email: "recruit@lakesidelogistics.test", title: "Talent Acquisition Lead" },
    benefits: ["Medical cover", "Pension top-up", "Overtime pay", "Safety training"],
  },
  {
    key: "tusome",
    name: "Tusome Learning Trust",
    type: "EMPLOYER",
    industry: "Non-profit",
    city: "Gulu",
    size: "S51_200",
    founded: 2013,
    tagline: "Improving early-grade literacy in Northern Uganda.",
    description:
      "Tusome Learning Trust partners with public primary schools to improve reading outcomes through teacher coaching, reading materials in local languages, and community reading clubs.",
    brandColor: "#9C36B5",
    verified: "VERIFIED",
    owner: { name: "Joseph Ocen", email: "hr@tusome.test", title: "Programme Manager" },
    benefits: ["Medical cover", "Field allowances", "Professional development", "25 days annual leave"],
  },
  {
    key: "shilling-pay",
    name: "ShillingPay",
    industry: "Financial Services",
    city: "Kampala",
    size: "S11_50",
    founded: 2021,
    tagline: "Savings and credit tools for informal traders.",
    description:
      "ShillingPay builds mobile savings groups and inventory credit for market traders. We are a small, fast-moving team backed by regional investors, focused on product quality and customer trust.",
    brandColor: "#5F3DC4",
    verified: "VERIFIED",
    featured: true,
    owner: { name: "Aisha Namuli", email: "team@shillingpay.test", title: "Co-founder & COO" },
    benefits: ["Equity options", "Remote-first", "Medical cover", "Home-office stipend"],
  },
  {
    key: "elgon",
    name: "Elgon Hospitality Group",
    industry: "Hospitality",
    city: "Mbale",
    size: "S201_500",
    founded: 2007,
    tagline: "Hotels and lodges around Mount Elgon and Sipi Falls.",
    description:
      "Elgon Hospitality Group runs three hotels and two eco-lodges in Eastern Uganda, hosting business travellers, conference groups and tourists visiting Mount Elgon.",
    brandColor: "#A61E4D",
    verified: "VERIFIED",
    owner: { name: "Ruth Nabwire", email: "hr@elgonhospitality.test", title: "HR Officer" },
    benefits: ["Staff meals", "Accommodation for lodge staff", "Service charge share", "Uniforms provided"],
  },
  {
    key: "bunyoro-talent",
    name: "Bunyoro Talent Partners",
    type: "AGENCY",
    industry: "Recruitment",
    city: "Kampala",
    size: "S11_50",
    founded: 2015,
    tagline: "Licensed recruitment agency for finance, operations and technical roles.",
    description:
      "Bunyoro Talent Partners is a licensed recruitment agency placing finance, operations and technical professionals with employers across Uganda. We never charge candidates any fees.",
    brandColor: "#087F5B",
    verified: "VERIFIED",
    owner: { name: "Moses Byaruhanga", email: "consult@bunyorotalent.test", title: "Principal Consultant" },
    benefits: ["Client benefits vary by role"],
  },
  {
    key: "savanna-creative",
    name: "Savanna Creative Studio",
    industry: "Media & Marketing",
    city: "Nairobi",
    size: "S11_50",
    founded: 2018,
    tagline: "Brand, content and campaigns for East African consumer brands.",
    description:
      "Savanna Creative Studio is a brand and content studio with teams in Nairobi and Kampala. We create campaigns, identities and social content for consumer brands across the region.",
    brandColor: "#F08C00",
    verified: "VERIFIED",
    owner: { name: "Wanjiru Kamau", email: "studio@savannacreative.test", title: "Studio Director" },
    benefits: ["Hybrid working", "Creative tools budget", "Medical cover", "Half-day Fridays in December"],
  },
  {
    key: "mpanga-retail",
    name: "Mpanga Retail Ltd",
    industry: "Retail",
    city: "Masaka",
    size: "S11_50",
    founded: 2023,
    tagline: "Neighbourhood supermarkets in Masaka and Mbarara.",
    description: "Mpanga Retail runs four neighbourhood supermarkets and is opening two more branches this year.",
    brandColor: "#495057",
    verified: "PENDING",
    owner: { name: "Henry Ssekandi", email: "owner@mpangaretail.test", title: "Managing Director" },
    benefits: ["Staff discount", "Transport allowance"],
  },
  {
    key: "quick-placements",
    name: "Quick Overseas Placements",
    type: "AGENCY",
    industry: "Recruitment",
    city: "Kampala",
    size: "S1_10",
    founded: 2025,
    tagline: "Jobs abroad.",
    description: "We connect workers with jobs in the Gulf.",
    brandColor: "#868E96",
    verified: "UNVERIFIED",
    owner: { name: "Tom K.", email: "agent@quickplacements.test", title: "Agent" },
    benefits: [],
  },
];

type CategoryTemplate = { responsibilities: string[]; requirements: string[]; preferred: string[] };

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  "software-it": {
    responsibilities: [
      "Design, build and maintain reliable features with your product team",
      "Write clear, tested code and review pull requests from teammates",
      "Monitor production systems and help resolve incidents",
      "Break down product requirements into well-scoped technical tasks",
      "Document decisions so the rest of the team can build on your work",
    ],
    requirements: [
      "Professional experience building and shipping software",
      "Comfort with Git, code review and automated testing",
      "Ability to explain technical trade-offs to non-engineers",
      "Good written English for asynchronous collaboration",
    ],
    preferred: ["Experience with payments, logistics or mobile money integrations", "Contributions to open-source projects"],
  },
  "accounting-finance": {
    responsibilities: [
      "Prepare monthly management accounts and reconciliations",
      "Support statutory audits and respond to auditor queries",
      "Prepare and file VAT, PAYE and withholding tax returns with URA",
      "Maintain accurate records in the accounting system",
      "Analyse variances and explain them to budget holders",
    ],
    requirements: [
      "Degree in Accounting, Finance or Commerce",
      "Part or full ACCA/CPA qualification",
      "Working knowledge of Ugandan tax legislation",
      "Strong Excel skills and attention to detail",
    ],
    preferred: ["Experience with QuickBooks, Sage or SAP", "Audit firm background"],
  },
  healthcare: {
    responsibilities: [
      "Provide safe, respectful patient care in line with clinical guidelines",
      "Maintain accurate patient records in the electronic health record",
      "Participate in community outreach and health education",
      "Work with the multidisciplinary team on ward rounds and handovers",
      "Support infection prevention and quality improvement activities",
    ],
    requirements: [
      "Relevant qualification and valid practising licence from the appropriate Ugandan council",
      "Experience in a hospital or clinic setting",
      "Willingness to work shifts, including nights and weekends",
      "Fluency in English; Runyankole or Rukiga is an advantage",
    ],
    preferred: ["Experience with digital health records", "Maternal and child health experience"],
  },
  "sales-marketing": {
    responsibilities: [
      "Meet monthly sales targets in your assigned territory",
      "Build relationships with customers, agents and partners",
      "Report pipeline and market feedback every week",
      "Plan and run campaigns and product activations",
      "Track results and recommend improvements",
    ],
    requirements: [
      "Proven sales or marketing experience",
      "Excellent communication in English and at least one local language",
      "Comfort with targets and field work",
      "Basic computer and smartphone skills",
    ],
    preferred: ["Valid motorcycle or driving permit", "Experience in FMCG, telecoms or fintech"],
  },
  engineering: {
    responsibilities: [
      "Plan, install and commission equipment to specification",
      "Carry out preventive maintenance and fault-finding",
      "Supervise technicians and contractors on site",
      "Ensure work meets safety and quality standards",
      "Prepare technical reports and bills of materials",
    ],
    requirements: [
      "Degree or diploma in Electrical, Mechanical or Civil Engineering",
      "Hands-on field experience",
      "Knowledge of relevant safety standards",
      "Willingness to travel to project sites",
    ],
    preferred: ["Registration with the Engineers Registration Board", "Solar PV certification"],
  },
  education: {
    responsibilities: [
      "Coach teachers on structured literacy lessons",
      "Observe classrooms and give practical feedback",
      "Organise community reading clubs with parents",
      "Collect and report learning assessment data",
      "Work with district education offices and head teachers",
    ],
    requirements: [
      "Diploma or degree in Education",
      "Classroom teaching experience",
      "Fluency in English and Acholi or Lango",
      "Ability to ride a motorcycle for school visits",
    ],
    preferred: ["Experience on donor-funded education programmes", "Data collection using tablets"],
  },
  "ngo-development": {
    responsibilities: [
      "Coordinate programme activities with partners and communities",
      "Track indicators and prepare donor reports",
      "Manage budgets and activity plans",
      "Build relationships with local government and stakeholders",
    ],
    requirements: [
      "Degree in Social Sciences, Development Studies or related field",
      "Experience on community-based programmes",
      "Strong report writing",
    ],
    preferred: ["Monitoring and evaluation experience", "Experience in Northern Uganda"],
  },
  agriculture: {
    responsibilities: [
      "Train farmer groups on good agricultural practices",
      "Monitor quality from harvest to processing",
      "Maintain traceability records for certified produce",
      "Coordinate collection logistics with farmer groups",
    ],
    requirements: [
      "Diploma or degree in Agriculture or related field",
      "Field experience with smallholder farmers",
      "Fluency in Rutooro or Rukiga is an advantage",
    ],
    preferred: ["Coffee quality (Q grader) training", "Experience with certification standards"],
  },
  logistics: {
    responsibilities: [
      "Plan and track shipments across the Northern Corridor",
      "Coordinate with drivers, customs agents and customers",
      "Maintain warehouse and inventory records",
      "Resolve delays and report on delivery performance",
    ],
    requirements: [
      "Diploma or degree in Logistics, Procurement or Business",
      "Experience in freight, warehousing or distribution",
      "Strong Excel skills",
    ],
    preferred: ["Knowledge of customs procedures and ASYCUDA", "CIPS qualification"],
  },
  hospitality: {
    responsibilities: [
      "Deliver warm, efficient service to guests",
      "Handle reservations, check-ins and guest requests",
      "Maintain cleanliness and presentation standards",
      "Work with other departments to resolve guest issues",
    ],
    requirements: [
      "Certificate or diploma in Hospitality or Tourism",
      "Experience in a hotel or lodge",
      "Excellent spoken English",
    ],
    preferred: ["Knowledge of a second foreign language", "Experience with hotel management software"],
  },
  "customer-service": {
    responsibilities: [
      "Answer customer calls, chats and messages quickly and accurately",
      "Resolve issues or escalate them with clear notes",
      "Record every interaction in the CRM",
      "Share recurring customer feedback with the product team",
    ],
    requirements: ["Diploma or degree in any field", "Clear spoken and written English and Luganda", "Patience and problem-solving skills"],
    preferred: ["Call-centre or mobile money support experience"],
  },
  "design-creative": {
    responsibilities: [
      "Create brand, campaign and social content from brief to delivery",
      "Present concepts to clients and refine them with feedback",
      "Prepare production-ready files for print and digital",
      "Keep work consistent with each client's brand guidelines",
    ],
    requirements: ["A portfolio showing strong craft", "Proficiency with Figma and Adobe Creative Cloud", "Good time management across multiple projects"],
    preferred: ["Motion design skills", "Agency experience"],
  },
  "data-analytics": {
    responsibilities: [
      "Build dashboards and reports used by leadership",
      "Clean, model and document data from multiple sources",
      "Answer business questions with clear analysis",
      "Set up data quality checks",
    ],
    requirements: ["Strong SQL", "Experience with Python or R", "Ability to explain findings simply"],
    preferred: ["Experience with dbt, Metabase or Power BI", "Statistics background"],
  },
  "human-resources": {
    responsibilities: [
      "Coordinate recruitment from job posting to onboarding",
      "Maintain accurate staff records and contracts",
      "Support payroll inputs and leave management",
      "Advise managers on HR policy and labour law",
    ],
    requirements: ["Degree in Human Resource Management or related field", "Knowledge of the Uganda Employment Act", "Discretion with confidential information"],
    preferred: ["HR software experience", "Membership of HRMAU"],
  },
  administration: {
    responsibilities: ["Manage office schedules, records and correspondence", "Coordinate travel, meetings and procurement requests", "Support the team with ad-hoc administrative tasks"],
    requirements: ["Diploma in Secretarial Studies, Business Administration or related", "Strong organisation skills", "Proficiency with Microsoft Office"],
    preferred: ["Experience in a busy office environment"],
  },
  legal: {
    responsibilities: ["Draft and review contracts", "Track regulatory changes and advise the business", "Support licensing and compliance filings"],
    requirements: ["Bachelor of Laws and Diploma in Legal Practice", "Enrolled as an Advocate of the High Court of Uganda"],
    preferred: ["Financial services regulation experience"],
  },
};

export type SeedJob = {
  title: string;
  company: string;
  category: string;
  city: string;
  workplace: "ONSITE" | "REMOTE" | "HYBRID";
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "FREELANCE";
  exp: "ENTRY" | "JUNIOR" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
  edu: "NONE" | "CERTIFICATE" | "DIPLOMA" | "BACHELORS" | "MASTERS" | "DOCTORATE";
  salary?: [number, number];
  currency?: string;
  skills: string[];
  summary: string;
  daysAgo: number;
  deadlineIn?: number;
  featured?: boolean;
  questions?: { label: string; type: "text" | "yesno"; required: boolean }[];
  status?: "PUBLISHED" | "DRAFT" | "PENDING_REVIEW" | "CLOSED" | "PAUSED";
  extraDescription?: string;
};

export const JOBS: SeedJob[] = [
  // Mwezi Software Labs
  { title: "Senior Backend Engineer", company: "mwezi", category: "software-it", city: "Kampala", workplace: "HYBRID", type: "FULL_TIME", exp: "SENIOR", edu: "BACHELORS", salary: [9_000_000, 13_000_000], skills: ["Node.js", "PostgreSQL", "TypeScript", "AWS"], summary: "Own core payment services that process millions of mobile money transactions each month.", daysAgo: 1, deadlineIn: 28, featured: true, questions: [{ label: "Describe a production incident you helped resolve.", type: "text", required: true }, { label: "Are you able to work from our Kampala office two days a week?", type: "yesno", required: true }] },
  { title: "Frontend Developer (React)", company: "mwezi", category: "software-it", city: "Kampala", workplace: "HYBRID", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [5_500_000, 8_000_000], skills: ["React", "TypeScript", "Tailwind CSS", "Accessibility"], summary: "Build fast, accessible merchant dashboards used by thousands of shops.", daysAgo: 2, deadlineIn: 30, featured: true },
  { title: "Mobile Engineer (Flutter)", company: "mwezi", category: "software-it", city: "Kampala", workplace: "REMOTE", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [6_000_000, 9_000_000], skills: ["Flutter", "Dart", "REST APIs", "Offline-first"], summary: "Ship our merchant app to Android devices that work on patchy networks.", daysAgo: 4, deadlineIn: 21 },
  { title: "Software Engineering Intern", company: "mwezi", category: "software-it", city: "Kampala", workplace: "ONSITE", type: "INTERNSHIP", exp: "ENTRY", edu: "BACHELORS", salary: [800_000, 800_000], skills: ["JavaScript", "Git", "SQL"], summary: "A paid six-month internship pairing you with a senior engineer on real product work.", daysAgo: 3, deadlineIn: 14, featured: true },
  { title: "DevOps Engineer", company: "mwezi", category: "software-it", city: "Nairobi", workplace: "REMOTE", type: "CONTRACT", exp: "SENIOR", edu: "BACHELORS", salary: [10_000_000, 14_000_000], skills: ["Kubernetes", "Terraform", "AWS", "Observability"], summary: "Harden and automate our cloud infrastructure across two regions.", daysAgo: 9, deadlineIn: 20 },
  { title: "Product Designer", company: "mwezi", category: "design-creative", city: "Kampala", workplace: "HYBRID", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [5_000_000, 7_500_000], skills: ["Figma", "User research", "Prototyping", "Design systems"], summary: "Shape how small businesses manage money, from research to shipped UI.", daysAgo: 6, deadlineIn: 25 },
  { title: "QA Engineer", company: "mwezi", category: "software-it", city: "Kampala", workplace: "ONSITE", type: "FULL_TIME", exp: "JUNIOR", edu: "DIPLOMA", salary: [2_800_000, 4_000_000], skills: ["Test automation", "Playwright", "Manual testing"], summary: "Keep releases safe with automated and exploratory testing.", daysAgo: 0, deadlineIn: 30, status: "DRAFT" },

  // Nile Ledger Partners
  { title: "Audit Associate", company: "nile-ledger", category: "accounting-finance", city: "Kampala", workplace: "ONSITE", type: "FULL_TIME", exp: "JUNIOR", edu: "BACHELORS", salary: [2_500_000, 3_500_000], skills: ["Auditing", "IFRS", "Excel"], summary: "Join audit engagements for banks, manufacturers and NGOs with structured ACCA support.", daysAgo: 2, deadlineIn: 18, featured: true },
  { title: "Tax Consultant", company: "nile-ledger", category: "accounting-finance", city: "Kampala", workplace: "HYBRID", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [4_500_000, 6_500_000], skills: ["Tax compliance", "URA EFRIS", "Advisory"], summary: "Advise clients on corporate tax, VAT and transfer pricing.", daysAgo: 5, deadlineIn: 22 },
  { title: "Graduate Trainee — Accounting", company: "nile-ledger", category: "accounting-finance", city: "Kampala", workplace: "ONSITE", type: "INTERNSHIP", exp: "ENTRY", edu: "BACHELORS", salary: [1_200_000, 1_200_000], skills: ["Bookkeeping", "Excel", "Communication"], summary: "A 12-month graduate programme rotating through audit, tax and advisory.", daysAgo: 7, deadlineIn: 10 },
  { title: "Finance Manager", company: "nile-ledger", category: "accounting-finance", city: "Entebbe", workplace: "ONSITE", type: "FULL_TIME", exp: "LEAD", edu: "MASTERS", salary: [12_000_000, 16_000_000], skills: ["Financial reporting", "Budgeting", "Team leadership"], summary: "Lead the finance function for an outsourced client in the aviation sector.", daysAgo: 12, deadlineIn: 15 },

  // Kivu Health Network
  { title: "Registered Nurse", company: "kivu-health", category: "healthcare", city: "Mbarara", workplace: "ONSITE", type: "FULL_TIME", exp: "JUNIOR", edu: "DIPLOMA", salary: [1_800_000, 2_400_000], skills: ["Patient care", "Maternal health", "Electronic health records"], summary: "Provide high-quality nursing care in our 180-bed regional hospital.", daysAgo: 1, deadlineIn: 21, featured: true },
  { title: "Medical Officer", company: "kivu-health", category: "healthcare", city: "Mbarara", workplace: "ONSITE", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [5_500_000, 7_000_000], skills: ["Clinical medicine", "Emergency care", "Mentorship"], summary: "Lead outpatient and ward care while mentoring clinical officers.", daysAgo: 4, deadlineIn: 30 },
  { title: "Laboratory Technologist", company: "kivu-health", category: "healthcare", city: "Fort Portal", workplace: "ONSITE", type: "FULL_TIME", exp: "JUNIOR", edu: "DIPLOMA", salary: [1_600_000, 2_200_000], skills: ["Microscopy", "Quality control", "LIMS"], summary: "Run accurate diagnostics in a newly upgraded district laboratory.", daysAgo: 8, deadlineIn: 12 },
  { title: "Health Data Analyst", company: "kivu-health", category: "data-analytics", city: "Mbarara", workplace: "HYBRID", type: "CONTRACT", exp: "MID", edu: "BACHELORS", salary: [3_500_000, 4_500_000], skills: ["DHIS2", "SQL", "Power BI"], summary: "Turn facility data into dashboards that improve patient outcomes.", daysAgo: 10, deadlineIn: 16 },

  // Pearl Grid Energy
  { title: "Solar Field Technician", company: "pearl-grid", category: "engineering", city: "Jinja", workplace: "ONSITE", type: "FULL_TIME", exp: "JUNIOR", edu: "CERTIFICATE", salary: [1_000_000, 1_500_000], skills: ["Solar PV installation", "Electrical wiring", "Customer service"], summary: "Install and maintain solar systems for households across Busoga.", daysAgo: 2, deadlineIn: 14 },
  { title: "Mini-Grid Project Engineer", company: "pearl-grid", category: "engineering", city: "Gulu", workplace: "ONSITE", type: "FULL_TIME", exp: "SENIOR", edu: "BACHELORS", salary: [7_000_000, 9_500_000], skills: ["Power systems", "Project management", "AutoCAD"], summary: "Lead design and construction of village mini-grids in Northern Uganda.", daysAgo: 5, deadlineIn: 26, featured: true },
  { title: "Sales Agent — Solar Home Systems", company: "pearl-grid", category: "sales-marketing", city: "Lira", workplace: "ONSITE", type: "PART_TIME", exp: "ENTRY", edu: "NONE", salary: [500_000, 900_000], skills: ["Field sales", "Lango", "Mobile money"], summary: "Earn a base plus commission helping families switch to solar.", daysAgo: 3, deadlineIn: 20 },
  { title: "Customer Support Agent", company: "pearl-grid", category: "customer-service", city: "Jinja", workplace: "ONSITE", type: "FULL_TIME", exp: "ENTRY", edu: "DIPLOMA", salary: [900_000, 1_200_000], skills: ["Call centre", "Luganda", "Lusoga", "CRM"], summary: "Help customers keep the lights on through calls and chat.", daysAgo: 11, deadlineIn: 9 },

  // Rwenzori Agro
  { title: "Agronomist", company: "rwenzori-agro", category: "agriculture", city: "Fort Portal", workplace: "ONSITE", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [2_500_000, 3_500_000], skills: ["Coffee agronomy", "Farmer training", "Rutooro"], summary: "Train farmer groups and improve yields across our coffee supply base.", daysAgo: 6, deadlineIn: 19 },
  { title: "Quality Control Officer", company: "rwenzori-agro", category: "agriculture", city: "Fort Portal", workplace: "ONSITE", type: "CONTRACT", exp: "JUNIOR", edu: "DIPLOMA", salary: [1_500_000, 2_000_000], skills: ["Cupping", "Moisture testing", "Record keeping"], summary: "Protect quality from cherry to export container.", daysAgo: 14, deadlineIn: 7 },

  // Lakeside Logistics
  { title: "Logistics Coordinator", company: "lakeside", category: "logistics", city: "Kampala", workplace: "ONSITE", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [2_800_000, 3_800_000], skills: ["Freight forwarding", "Customs", "Excel"], summary: "Keep cross-border shipments moving between Mombasa and Kampala.", daysAgo: 2, deadlineIn: 24 },
  { title: "Warehouse Supervisor", company: "lakeside", category: "logistics", city: "Nairobi", workplace: "ONSITE", type: "FULL_TIME", exp: "SENIOR", edu: "DIPLOMA", salary: [150_000, 220_000], currency: "KES", skills: ["Inventory control", "Team leadership", "WMS"], summary: "Run day-to-day operations in our bonded warehouse.", daysAgo: 9, deadlineIn: 18 },
  { title: "Fleet Data Analyst", company: "lakeside", category: "data-analytics", city: "Kampala", workplace: "HYBRID", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [4_000_000, 5_500_000], skills: ["SQL", "Python", "Telematics"], summary: "Use GPS and fuel data to cut costs and delivery times.", daysAgo: 1, deadlineIn: 27 },

  // Tusome
  { title: "Literacy Coach", company: "tusome", category: "education", city: "Gulu", workplace: "ONSITE", type: "CONTRACT", exp: "JUNIOR", edu: "DIPLOMA", salary: [1_600_000, 2_000_000], skills: ["Teacher coaching", "Acholi", "Classroom observation"], summary: "Coach primary teachers to deliver structured reading lessons.", daysAgo: 3, deadlineIn: 17 },
  { title: "Monitoring & Evaluation Officer", company: "tusome", category: "ngo-development", city: "Gulu", workplace: "HYBRID", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [3_500_000, 4_500_000], skills: ["M&E", "KoboToolbox", "Data analysis"], summary: "Measure learning outcomes across 140 partner schools.", daysAgo: 8, deadlineIn: 21 },
  { title: "Programme Intern", company: "tusome", category: "ngo-development", city: "Arua", workplace: "ONSITE", type: "INTERNSHIP", exp: "ENTRY", edu: "BACHELORS", salary: [600_000, 600_000], skills: ["Report writing", "Community engagement"], summary: "A three-month internship supporting reading clubs in West Nile.", daysAgo: 5, deadlineIn: 12 },

  // ShillingPay
  { title: "Growth Marketing Lead", company: "shilling-pay", category: "sales-marketing", city: "Kampala", workplace: "REMOTE", type: "FULL_TIME", exp: "LEAD", edu: "BACHELORS", salary: [8_000_000, 11_000_000], skills: ["Growth marketing", "Analytics", "Community building"], summary: "Grow our trader community across Kampala's markets and beyond.", daysAgo: 1, deadlineIn: 30, featured: true },
  { title: "Data Engineer", company: "shilling-pay", category: "data-analytics", city: "Kampala", workplace: "REMOTE", type: "FULL_TIME", exp: "SENIOR", edu: "BACHELORS", salary: [9_000_000, 12_000_000], skills: ["Python", "dbt", "PostgreSQL", "Airflow"], summary: "Build the data platform behind our credit scoring models.", daysAgo: 4, deadlineIn: 28 },
  { title: "Customer Success Associate", company: "shilling-pay", category: "customer-service", city: "Kampala", workplace: "HYBRID", type: "FULL_TIME", exp: "ENTRY", edu: "DIPLOMA", salary: [1_300_000, 1_700_000], skills: ["Luganda", "Customer support", "Mobile money"], summary: "Help traders get the most out of savings groups and credit.", daysAgo: 6, deadlineIn: 14 },
  { title: "Freelance Content Writer", company: "shilling-pay", category: "design-creative", city: "Kampala", workplace: "REMOTE", type: "FREELANCE", exp: "JUNIOR", edu: "NONE", skills: ["Copywriting", "Luganda", "Financial literacy"], summary: "Write short, practical money tips for our app and social channels.", daysAgo: 13, deadlineIn: 15 },

  // Elgon
  { title: "Front Office Supervisor", company: "elgon", category: "hospitality", city: "Mbale", workplace: "ONSITE", type: "FULL_TIME", exp: "MID", edu: "DIPLOMA", salary: [1_500_000, 2_000_000], skills: ["Guest relations", "Opera PMS", "Team leadership"], summary: "Lead the front desk at our flagship 90-room hotel.", daysAgo: 4, deadlineIn: 20 },
  { title: "Chef de Partie", company: "elgon", category: "hospitality", city: "Mbale", workplace: "ONSITE", type: "FULL_TIME", exp: "JUNIOR", edu: "CERTIFICATE", salary: [1_200_000, 1_600_000], skills: ["Food preparation", "Food safety", "Menu planning"], summary: "Run a section of our busy conference kitchen.", daysAgo: 15, deadlineIn: 10 },
  { title: "Tour Guide (Seasonal)", company: "elgon", category: "hospitality", city: "Mbale", workplace: "ONSITE", type: "CONTRACT", exp: "ENTRY", edu: "CERTIFICATE", salary: [900_000, 1_100_000], skills: ["Tour guiding", "First aid", "French"], summary: "Guide visitors on hikes to Sipi Falls and Mount Elgon.", daysAgo: 20, deadlineIn: 5 },

  // Bunyoro Talent Partners (agency)
  { title: "HR Business Partner (for client)", company: "bunyoro-talent", category: "human-resources", city: "Kampala", workplace: "ONSITE", type: "FULL_TIME", exp: "SENIOR", edu: "BACHELORS", salary: [7_000_000, 9_000_000], skills: ["Employee relations", "Uganda Employment Act", "HR strategy"], summary: "Recruiting on behalf of a manufacturing client with 600 staff.", daysAgo: 3, deadlineIn: 18 },
  { title: "Legal Officer (for client)", company: "bunyoro-talent", category: "legal", city: "Kampala", workplace: "HYBRID", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [5_000_000, 7_000_000], skills: ["Contract drafting", "Regulatory compliance"], summary: "Recruiting a legal officer for a regulated financial services client.", daysAgo: 7, deadlineIn: 21 },
  { title: "Office Administrator", company: "bunyoro-talent", category: "administration", city: "Entebbe", workplace: "ONSITE", type: "FULL_TIME", exp: "JUNIOR", edu: "DIPLOMA", salary: [1_200_000, 1_600_000], skills: ["Office management", "Microsoft Office", "Procurement"], summary: "Keep a busy international NGO office running smoothly.", daysAgo: 10, deadlineIn: 14 },

  // Savanna Creative
  { title: "Senior Graphic Designer", company: "savanna-creative", category: "design-creative", city: "Nairobi", workplace: "HYBRID", type: "FULL_TIME", exp: "SENIOR", edu: "BACHELORS", salary: [180_000, 250_000], currency: "KES", skills: ["Brand identity", "Adobe Illustrator", "Art direction"], summary: "Lead identity and campaign work for regional consumer brands.", daysAgo: 2, deadlineIn: 24 },
  { title: "Social Media Manager", company: "savanna-creative", category: "sales-marketing", city: "Kampala", workplace: "HYBRID", type: "FULL_TIME", exp: "MID", edu: "BACHELORS", salary: [3_000_000, 4_200_000], skills: ["Content strategy", "Meta Ads", "Community management"], summary: "Run social channels for three consumer brands in Uganda.", daysAgo: 5, deadlineIn: 19 },
  { title: "Motion Designer (Freelance)", company: "savanna-creative", category: "design-creative", city: "Kigali", workplace: "REMOTE", type: "FREELANCE", exp: "MID", edu: "NONE", skills: ["After Effects", "Animation", "Storyboarding"], summary: "Animate short campaign films on a per-project basis.", daysAgo: 18, deadlineIn: 12 },

  // Closed / review examples
  { title: "Store Manager", company: "mpanga-retail", category: "administration", city: "Masaka", workplace: "ONSITE", type: "FULL_TIME", exp: "MID", edu: "DIPLOMA", salary: [1_500_000, 2_000_000], skills: ["Retail operations", "Stock control"], summary: "Run day-to-day operations at our new Masaka branch.", daysAgo: 1, deadlineIn: 20, status: "PENDING_REVIEW" },
  {
    title: "URGENT!! Hotel Cleaners Needed in Dubai — Guaranteed Job",
    company: "quick-placements",
    category: "hospitality",
    city: "Kampala",
    workplace: "ONSITE",
    type: "CONTRACT",
    exp: "ENTRY",
    edu: "NONE",
    salary: [5_000_000, 8_000_000],
    skills: ["Cleaning"],
    summary: "Guaranteed job abroad. Visa and ticket processed by our agent.",
    extraDescription: "Pay a registration fee of UGX 450,000 via mobile money to secure your slot. Apply on WhatsApp only.",
    daysAgo: 0,
    deadlineIn: 3,
    status: "PENDING_REVIEW",
  },
  { title: "Accounts Assistant", company: "nile-ledger", category: "accounting-finance", city: "Kampala", workplace: "ONSITE", type: "FULL_TIME", exp: "ENTRY", edu: "DIPLOMA", salary: [1_200_000, 1_500_000], skills: ["Bookkeeping", "Excel"], summary: "Support the accounts team with payables and reconciliations.", daysAgo: 45, deadlineIn: -10, status: "CLOSED" },
];

export const SEEKER_NAMES = [
  "Amina Nansubuga", "Kato Ivan", "Brenda Achieng", "Collins Tumusiime", "Doreen Akello", "Emmanuel Ssali",
  "Faith Nyakato", "Geoffrey Opio", "Hellen Namutebi", "Isaac Mutebi", "Janet Atim", "Kenneth Arinaitwe",
  "Linda Auma", "Martin Kiggundu", "Norah Kansiime", "Oscar Lubega", "Patience Ainembabazi", "Ronald Odongo",
  "Shamim Nakimuli", "Timothy Byamugisha", "Vivian Adong", "Wilson Kasozi", "Yvonne Kyomuhendo", "Zainab Nalubega",
  "Allan Muwonge", "Beatrice Amongi", "Charles Ochieng", "Diana Mbabazi", "Edgar Twinomujuni", "Fiona Nakayiza",
];

export const ARTICLE_CATEGORIES = [
  { name: "CV writing", slug: "cv-writing" },
  { name: "Interview preparation", slug: "interviews" },
  { name: "Job search", slug: "job-search" },
  { name: "Internships & graduates", slug: "internships" },
  { name: "Career growth", slug: "career-growth" },
];

export const ARTICLES = [
  {
    title: "How to write a CV that gets shortlisted in Uganda",
    slug: "write-a-cv-that-gets-shortlisted",
    category: "cv-writing",
    excerpt: "Recruiters spend under a minute on a first read. Here's how to structure a two-page CV that survives it.",
    minutes: 6,
    featured: true,
    content: `Most recruiters in Kampala tell us the same thing: they read the top third of a CV first and decide quickly whether to keep going. A good CV makes that decision easy.

## Keep it to two pages

Unless you are applying for an academic or senior medical post, two pages is enough. Cut school-level details once you have a degree or diploma, and remove referees from the CV itself — write "Referees available on request" and keep a separate list ready.

## Start with a three-line profile

Write three short sentences under your name: what you do, the experience you bring, and what you're looking for next.

> Certified accountant with four years of audit experience across banking and NGO clients. Comfortable leading small audit teams and preparing URA filings. Looking for a finance role in a growing company.

## Show results, not duties

"Responsible for reconciliations" tells a recruiter what your job description said. "Cleared a six-month backlog of bank reconciliations in eight weeks" tells them what you did. For each role, aim for three to five bullet points that start with a verb and include a number where you can.

## Match the job's language

Read the job post and highlight the skills it asks for. If you have them, use the same words in your CV. Many employers scan for keywords before reading closely.

## Details that matter

- Use a simple layout with clear headings; avoid photos unless the employer asks for one.
- Save and send as PDF so the formatting doesn't break.
- Use a professional email address.
- Check spelling twice, then ask someone else to read it.

## Never pay to be considered

Genuine employers do not charge application or "processing" fees. If a listing asks you to pay, report it on KAZI so our team can review it.`,
  },
  {
    title: "Answering \"Tell me about yourself\" with confidence",
    slug: "answer-tell-me-about-yourself",
    category: "interviews",
    excerpt: "A simple present–past–future structure that keeps your answer under two minutes and relevant to the role.",
    minutes: 4,
    featured: true,
    content: `It's usually the first question, and it sets the tone for the whole interview. The trick is to treat it as a short summary of why you fit this job, not your life story.

## Use present, past, future

1. **Present** — your current role and one thing you're proud of.
2. **Past** — one or two experiences that prepared you for this job.
3. **Future** — why this role and this organisation are your next step.

## An example

"I'm a registered nurse at a district hospital, where I work on the maternity ward and helped introduce a new handover checklist that cut medication errors. Before that I did my internship at a regional referral hospital, where I learned to work under pressure in emergency care. I'm applying here because your network is expanding maternal health services, and I want to grow into a ward leadership role."

## Practise out loud

Time yourself. Aim for 60–90 seconds. Practise until it sounds natural rather than memorised.`,
  },
  {
    title: "Finding your first job after university",
    slug: "first-job-after-university",
    category: "internships",
    excerpt: "Graduate programmes, internships and volunteering — how to choose and how to stand out without experience.",
    minutes: 7,
    content: `Graduating without experience feels like a trap: jobs want experience, but you need a job to get it. Here's how graduates on KAZI break the cycle.

## Look for structured entry points

- **Graduate trainee programmes** at audit firms, banks and large companies usually open once a year. Set a job alert for "graduate" so you hear about them early.
- **Paid internships** are increasingly common in technology, NGOs and finance. Filter by *Internship* on the jobs page.
- **Volunteering** with a registered organisation can count as experience if you can describe real responsibilities.

## Turn coursework into evidence

Your final-year project, a student leadership role, or a part-time job in a family business are all evidence of skills. Describe them on your CV the same way you would a job: what you did and what changed because of it.

## Apply consistently

Set aside time each week. Quality beats volume: five tailored applications are better than thirty copies of the same letter.`,
  },
  {
    title: "Spotting fake job adverts before they cost you",
    slug: "spotting-fake-job-adverts",
    category: "job-search",
    excerpt: "Fees, WhatsApp-only contacts and \"guaranteed\" jobs abroad are the biggest warning signs.",
    minutes: 5,
    featured: true,
    content: `Job scams cost job seekers money and time, and some put people in real danger. Most of them share a few warning signs.

## Red flags

- **You're asked to pay.** Registration, training, medical or "processing" fees are the most common sign of a scam.
- **Contact is only through WhatsApp or Telegram.** Genuine employers have an address, a website or a verified profile.
- **The job is "guaranteed".** Especially for work abroad. Licensed agencies explain the process and never promise outcomes.
- **The salary is far above similar roles.**
- **You're asked for your national ID, bank details or passport before an interview.**

## What KAZI does

Every employer on KAZI goes through verification before their listings are marked as verified, and new listings are automatically screened for these warning signs. Listings that look risky are held for manual review.

## What you can do

If something feels wrong, use **Report this job** on the listing. Our moderation team reviews every report.`,
  },
  {
    title: "Negotiating your salary offer",
    slug: "negotiating-your-salary-offer",
    category: "career-growth",
    excerpt: "Research the range, anchor on value, and consider the whole package — not just the monthly figure.",
    minutes: 5,
    content: `Many people accept the first number they're offered. A short, respectful negotiation is normal and expected by most employers.

## Know the range

Look at similar roles on KAZI with salaries shown, and ask people in the same field. Use the salary filter on the jobs page to see what's typical for your level.

## Talk about value

Base your request on what you bring: certifications, results you've delivered, or skills that are hard to find.

## Consider the whole package

Medical cover, transport allowance, learning budgets and flexible working all have real value. If the salary can't move, one of these often can.

## Get it in writing

Once you agree, ask for the final offer in writing before you resign from your current job.`,
  },
  {
    title: "Writing a cover letter employers actually read",
    slug: "cover-letter-employers-read",
    category: "cv-writing",
    excerpt: "Three short paragraphs: why this role, why you, and what happens next.",
    minutes: 4,
    content: `A cover letter shouldn't repeat your CV. It should connect your experience to this specific job.

## Paragraph one — why this role

Name the role and say what drew you to it. Be specific about the organisation.

## Paragraph two — why you

Pick two pieces of evidence from your experience that match the job's main requirements.

## Paragraph three — next steps

Thank them and say you'd welcome the chance to discuss the role.

Keep it under 250 words. On KAZI you can write a different cover letter for each application in the apply step.`,
  },
];
