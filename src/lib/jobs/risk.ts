/**
 * Heuristic fraud screening for new and edited job listings. Produces a 0–100 score and readable flags.
 * Listings at or above the platform's risk threshold go to manual review instead of auto-publishing.
 */
export type RiskInput = {
  title: string;
  summary: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: "MONTH" | "YEAR";
  companyVerified: boolean;
  companyAgeDays: number;
};

const PATTERNS: { re: RegExp; flag: string; weight: number }[] = [
  { re: /\b(registration|application|processing|training|interview|medical)\s+fee\b/i, flag: "Mentions a fee charged to applicants", weight: 45 },
  { re: /\b(pay|send|deposit)\b.{0,30}\b(ugx|shs|money|mobile money|momo|airtel money|cash)\b/i, flag: "Asks applicants to send money", weight: 45 },
  { re: /\bwestern union|moneygram\b/i, flag: "Mentions money-transfer services", weight: 35 },
  { re: /\b(whats\s?app|telegram)\b.{0,40}\b(only|directly|apply)\b/i, flag: "Moves applicants to WhatsApp/Telegram", weight: 20 },
  { re: /\b(guaranteed|100%)\s+(job|employment|placement|visa)\b/i, flag: "Guarantees employment or visas", weight: 25 },
  { re: /\b(work abroad|overseas job|dubai|saudi|qatar)\b.{0,60}\b(visa|ticket|agent)\b/i, flag: "Overseas placement wording — verify agency licence", weight: 15 },
  { re: /\bno (experience|qualifications?) (needed|required)\b.{0,80}\b(earn|make)\b/i, flag: "Unrealistic earnings promise", weight: 20 },
  { re: /\b(bank account|national id|nin|passport)\b.{0,30}\b(number|details|copy)\b/i, flag: "Requests sensitive personal documents up front", weight: 20 },
];

export function scoreJobRisk(input: RiskInput) {
  const text = [input.title, input.summary, input.description, input.requirements, input.responsibilities, input.benefits ?? ""].join("\n");
  const flags: string[] = [];
  let score = 0;

  for (const p of PATTERNS) {
    if (p.re.test(text)) {
      flags.push(p.flag);
      score += p.weight;
    }
  }

  const monthlyMax = input.salaryMax ? (input.salaryPeriod === "YEAR" ? input.salaryMax / 12 : input.salaryMax) : 0;
  if (monthlyMax > 60_000_000) {
    flags.push("Salary is far above the market range");
    score += 20;
  }
  if (input.salaryMin && input.salaryMax && input.salaryMin > input.salaryMax) {
    flags.push("Salary minimum exceeds maximum");
    score += 5;
  }
  if (/[A-Z]{12,}/.test(input.title) || /!!+/.test(text)) {
    flags.push("Shouting or excessive punctuation");
    score += 5;
  }
  if (!input.companyVerified) {
    flags.push("Company is not yet verified");
    score += 15;
  }
  if (input.companyAgeDays < 3) {
    flags.push("Company account created in the last 3 days");
    score += 10;
  }

  return { score: Math.min(100, score), flags };
}
