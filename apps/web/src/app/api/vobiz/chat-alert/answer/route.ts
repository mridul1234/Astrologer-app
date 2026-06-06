import { NextResponse } from "next/server";
import { getAlertMessage } from "@/lib/vobiz";

export async function GET() {
  return buildAnswerXml();
}

export async function POST() {
  return buildAnswerXml();
}

function buildAnswerXml() {
  const message = getAlertMessage();

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Response>\n` +
    `  <Speak voice="WOMAN" language="en-US" loop="1">${escapeXml(message)}</Speak>\n` +
    `  <Hangup/>\n` +
    `</Response>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
