// ─────────────────────────────────────────────────────────────────────────────
// VitalSoft — Contact Form API Route
// POST /api/contact
//
// Receives form submissions from the pricing calculator.
// Stores to console (mock) — replace with DB / email / CRM as needed.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

export interface ContactPayload {
  name: string;
  email: string;
  social?: string;
  source?: string;
  notes?: string;
  videos: number;
  price: number;
}

// Simple in-memory store for demo purposes.
// Replace with: Supabase, Prisma, Airtable, Notion API, etc.
const submissions: ContactPayload[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ContactPayload>;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!body.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: "Valid email is required." },
        { status: 400 }
      );
    }
    if (!body.videos || body.videos < 1 || body.videos > 100) {
      return NextResponse.json(
        { error: "Videos must be between 1 and 100." },
        { status: 400 }
      );
    }

    const submission: ContactPayload = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      social: body.social?.trim() || undefined,
      source: body.source?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      videos: body.videos,
      price: body.price ?? 0,
    };

    // ── Store (mock) ─────────────────────────────────────────────────────────
    // TODO: Replace with real storage:
    //   - Supabase: await supabase.from('leads').insert(submission)
    //   - Prisma:   await prisma.lead.create({ data: submission })
    //   - Resend:   await resend.emails.send({ to: NOTIFICATION_EMAIL, ... })
    submissions.push(submission);
    console.log("[VitalSoft] New lead:", submission);

    // ── Optional: Send notification email ───────────────────────────────────
    // if (process.env.RESEND_API_KEY) {
    //   await resend.emails.send({
    //     from: "VitalSoft <no-reply@vitalsoft.com>",
    //     to: process.env.NOTIFICATION_EMAIL!,
    //     subject: `New lead: ${submission.name} — ${submission.videos} videos/month`,
    //     html: `<p>${JSON.stringify(submission, null, 2)}</p>`,
    //   });
    // }

    return NextResponse.json(
      { success: true, message: "Submission received." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[VitalSoft] Contact route error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// Optional: GET to retrieve submissions (protect with auth in production!)
export async function GET() {
  // TODO: Add authentication guard before deploying
  return NextResponse.json({ submissions, count: submissions.length });
}
