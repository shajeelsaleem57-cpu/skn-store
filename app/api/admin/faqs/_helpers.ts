export function parseFaqBody(body: Record<string, unknown>) {
  const question = String(body.question ?? "").trim();
  if (!question) return { error: "Question is required" } as const;
  const answer = String(body.answer ?? "").trim();
  if (!answer) return { error: "Answer is required" } as const;
  return {
    data: {
      question,
      answer,
      category: String(body.category ?? "").trim() || null,
      sortOrder: toInt(body.sortOrder, 0),
      isVisible: body.isVisible !== false,
    },
  } as const;
}


export function toInt(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? Math.trunc(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}
