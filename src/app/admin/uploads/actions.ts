"use server";

import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { z } from "zod";
import { revalidatePath } from "next/cache";

type ActionState = { ok: boolean; message?: string };

const schema = z.object({
  uploadId: z.string().min(1),
  confirm: z.string().optional(),
});

export async function deleteUpload(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  const parsed = schema.safeParse({
    uploadId: formData.get("uploadId"),
    confirm: formData.get("confirm")?.toString() || undefined,
  });

  if (!parsed.success) return { ok: false, message: "参数不合法" };

  const upload = await prisma.upload.findUnique({
    where: { id: parsed.data.uploadId },
    select: { id: true, filename: true, url: true },
  });

  if (!upload) {
    revalidatePath("/admin/uploads");
    return { ok: true };
  }

  // 引用检测：被文章内容引用则需要 confirm
  const refCount = await prisma.post.count({
    where: { content: { contains: upload.url } },
  });

  if (refCount > 0 && parsed.data.confirm !== "YES") {
    return {
      ok: false,
      message: `该图片被 ${refCount} 篇文章引用。请点击“确认删除”再执行。`,
    };
  }

  // 先删 DB，再删文件
  await prisma.upload.delete({ where: { id: upload.id } });

  const filePath = path.join(
    process.cwd(),
    "public",
    "uploads",
    upload.filename,
  );
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }

  revalidatePath("/admin/uploads");
  return { ok: true, message: "删除成功" };
}
