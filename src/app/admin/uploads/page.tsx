import Image from "next/image";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import DeleteUploadButton from "./DeleteUploadButton";
export default async function AdminUploadsPage() {
  await requireAdmin();

  const uploads = await prisma.upload.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      url: true,
      filename: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploader: { select: { email: true } },
    },
  });

  return (
    <div>
      <h1 className="text-xl font-bold">图片资源管理</h1>
      <p className="mt-2 text-sm text-gray-600">
        展示最近 100 张上传图片，支持管理员删除（数据库记录 + 文件）。
      </p>

      <div className="mt-6 space-y-3">
        {uploads.map((u) => (
          <div key={u.id} className="rounded border p-4">
            <div className="flex gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded border">
                {/* next/image 对本地 public 文件可用 */}
                <Image
                  src={u.url}
                  alt={u.filename}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{u.url}</div>
                <div className="mt-1 text-xs text-gray-600">
                  上传者：{u.uploader.email} · {u.mimeType} ·{" "}
                  {(u.size / 1024).toFixed(1)} KB ·{" "}
                  {u.createdAt.toLocaleString()}
                </div>

                <DeleteUploadButton uploadId={u.id} />
              </div>
            </div>
          </div>
        ))}

        {uploads.length === 0 && (
          <p className="text-sm text-gray-600">暂无上传记录。</p>
        )}
      </div>
    </div>
  );
}
