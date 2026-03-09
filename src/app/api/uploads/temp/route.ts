import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { authenticateApiKeyRequest } from "@/lib/auth/apiKeyAuth";
import { env } from "@/lib/env";
import { getStorageProvider } from "@/lib/storage";

export async function POST(request: Request) {
  const auth = await authenticateApiKeyRequest(request);
  if (!auth.ok) {
    return auth.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing file upload.",
      },
      { status: 400 },
    );
  }

  const extension = path.extname(file.name) || ".bin";
  const tempId = randomUUID();
  const key = `temp/uploads/${tempId}/source${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const stored = await getStorageProvider().upload({
    key,
    body: buffer,
    contentType: file.type || "application/octet-stream",
  });

  const encodedKey = stored.key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const url = new URL(`/api/storage/${encodedKey}`, env.appUrl).toString();

  return NextResponse.json({
    ok: true,
    tempId,
    key: stored.key,
    url,
  });
}
