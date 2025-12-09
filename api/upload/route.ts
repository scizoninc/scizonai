// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const HF_SPACE_URL = process.env.HF_SPACE_URL || "https://hf.space/embed/scizonai/hf_api-ref-scizonai";

async function tryPostForm(url: string, fd: FormData) {
  try {
    const res = await fetch(url, {
      method: "POST",
      body: fd,
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { ok: res.ok, status: res.status, body: json };
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message || String(err) };
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;
    if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

    // Build a FormData to forward
    const fd = new FormData();
    // Node's FormData accepts Blob-like - NextRequest formFile is a Blob-like
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer]);
    // include filename if provided
    const filename = (form.get("filename") as string) || ((file as any).name || `upload-${Date.now()}.bin`);
    fd.append("files", blob, filename);
    // also forward optional prompt or metadata
    const prompt = form.get("prompt") as string | null;
    if (prompt) fd.append("prompt", prompt);

    // Try candidate endpoints on the HF Space (order: /upload, /api/upload, /run/predict, /api/predict)
    const candidates = [
      `${HF_SPACE_URL.replace(/\/$/, "")}/upload`,
      `${HF_SPACE_URL.replace(/\/$/, "")}/api/upload`,
      `${HF_SPACE_URL.replace(/\/$/, "")}/run/predict`,
      `${HF_SPACE_URL.replace(/\/$/, "")}/api/predict`,
    ];

    for (const candidate of candidates) {
      const attempt = await tryPostForm(candidate, fd);
      if (attempt.ok) {
        return NextResponse.json({ ok: true, endpoint: candidate, response: attempt.body });
      }
      // if returned 404 or 405 continue to next
    }

    // If none worked, return last attempt info
    return NextResponse.json({ ok: false, message: "No HF Space upload endpoint accepted request. Adjust HF_SPACE_URL or endpoint paths." }, { status: 502 });
  } catch (err: any) {
    console.error("upload error", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
