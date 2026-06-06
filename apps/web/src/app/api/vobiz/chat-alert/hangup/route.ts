import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  logHangup(req, null);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const body = await readBody(req);
  logHangup(req, body);
  return NextResponse.json({ ok: true });
}

async function readBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) return await req.json();
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      return Object.fromEntries(form.entries());
    }
    const text = await req.text();
    return text || null;
  } catch (err) {
    return { error: "Failed to parse Vobiz hangup payload", detail: String(err) };
  }
}

function logHangup(req: NextRequest, body: unknown) {
  console.log("[Vobiz] Chat alert hangup:", {
    sessionId: req.nextUrl.searchParams.get("sessionId"),
    payload: body,
  });
}
