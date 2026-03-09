import path from "node:path";
import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/storage";

type StorageRouteProps = {
  params: Promise<{
    key: string[];
  }>;
};

export async function GET(_request: Request, { params }: StorageRouteProps) {
  const { key } = await params;
  const storageKey = key.join("/");

  try {
    const file = await getStorageProvider().get(storageKey);

    return new NextResponse(new Uint8Array(file.body), {
      status: 200,
      headers: {
        "Content-Type": guessContentType(storageKey),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}

function guessContentType(storageKey: string) {
  const extension = path.extname(storageKey).toLowerCase();

  switch (extension) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
