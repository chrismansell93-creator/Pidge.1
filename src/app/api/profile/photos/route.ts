import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const MAX_BYTES = 6 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo" }, { status: 400 });
  }
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WEBP, or GIF" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo must be 6MB or smaller" }, { status: 400 });
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const objectKey = `uploads/${session.user.id}/${filename}`;

  // Prefer durable Blob storage whenever a token is present (prod and local).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(objectKey, buffer, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url });
  }

  // On Vercel the filesystem is ephemeral — refuse rather than silently lose photos.
  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "Photo storage is not configured. Add BLOB_READ_WRITE_TOKEN to the Vercel project.",
      },
      { status: 503 },
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", session.user.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);

  return NextResponse.json({
    url: `/uploads/${session.user.id}/${filename}`,
  });
}
