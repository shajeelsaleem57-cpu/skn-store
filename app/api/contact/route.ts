import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name.").max(80),
  email: z.string().email("Please enter a valid email address."),
  message: z.string().min(10, "Please write a message of at least 10 characters.").max(2000),
});

/**
 * POST /api/contact — validate and accept a contact message.
 * Messages are logged server-side until a notification channel is wired up.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return NextResponse.json(
      { error: first ? first.message : "Invalid message." },
      { status: 400 }
    );
  }

  const { name, email, message } = parsed.data;
  console.log(`[contact] New message from ${name} <${email}>: ${message}`);

  return NextResponse.json({ ok: true });
}
