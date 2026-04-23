"use server";

import { requireUser } from "@/lib/rbac";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const fileSchema = z.object({
  // Next 的 File 在 server action 里是 Web File
  file: z.instanceof(File),
});

function extFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return null;
}

export async function uploadImage(formData: FormData) {
  const session = await requireUser();
  const parsed = fileSchema.safeParse({ file: formData.get("file") });
  if (!parsed.success) throw new Error("请选择图片文件");

  const file = parsed.data.file;

  const ext = extFromType(file.type);
  if (!ext) throw new Error("仅支持 png/jpg/webp/gif");

  // 2MB 限制（你可以调大）
  if (file.size > 2 * 1024 * 1024) throw new Error("图片过大（最大 2MB）");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const target = path.join(uploadDir, filename);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(target, buffer);

  const url = `/uploads/${filename}`;

  // ✅ 写入审计表
  await prisma.upload.create({
    data: {
      url,
      filename,
      mimeType: file.type,
      size: file.size,
      uploaderId: session.user.id,
    },
  });

  return { url };
}
