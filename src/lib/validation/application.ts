import { z } from "zod";

export const screeningQuestionSchema = z.object({
  id: z.string(),
  label: z.string().min(3).max(200),
  type: z.enum(["text", "yesno"]),
  required: z.boolean(),
});
export type ScreeningQuestion = z.infer<typeof screeningQuestionSchema>;

export function parseQuestions(raw: unknown): ScreeningQuestion[] {
  const parsed = z.array(screeningQuestionSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  resumeId: z.string().optional(),
  coverLetter: z.string().trim().max(5000, "Keep your cover letter under 5,000 characters").optional(),
});

/** Validates answers against the job's questions. Returns field errors keyed `answer_<id>`. */
export function validateAnswers(questions: ScreeningQuestion[], fd: FormData) {
  const errors: Record<string, string[]> = {};
  const answers: { questionId: string; label: string; answer: string }[] = [];
  for (const q of questions) {
    const value = String(fd.get(`answer_${q.id}`) ?? "").trim().slice(0, 2000);
    if (q.required && !value) errors[`answer_${q.id}`] = ["Answer this question to continue"];
    if (q.type === "yesno" && value && !["Yes", "No"].includes(value)) errors[`answer_${q.id}`] = ["Choose Yes or No"];
    answers.push({ questionId: q.id, label: q.label, answer: value });
  }
  return { errors, answers };
}

export const reportSchema = z.object({
  jobId: z.string().min(1),
  reason: z.enum(["SCAM_OR_FRAUD", "ASKS_FOR_PAYMENT", "MISLEADING", "DISCRIMINATORY", "DUPLICATE", "OFFENSIVE", "OTHER"], {
    errorMap: () => ({ message: "Choose a reason" }),
  }),
  details: z.string().trim().max(1000).optional(),
});
