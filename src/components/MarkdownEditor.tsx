"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { uploadImage } from "@/app/me/uploads/actions";

export default function MarkdownEditor({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const remarkPlugins = useMemo(() => [remarkGfm], []);
  const rehypePlugins = useMemo(() => [rehypeSanitize], []);

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + text);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);

    // 恢复光标位置（体验加分）
    queueMicrotask(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="space-y-2">
      {/* ✅ 确保表单提交一定带上 content */}
      <input type="hidden" name={name} value={value} />

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Markdown 编辑器</div>

        <label className="cursor-pointer rounded border px-3 py-1 text-sm hover:bg-gray-50">
          {uploading ? "上传中..." : "上传图片并插入"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // 允许重复选择同一文件
              if (!file) return;

              setUploadErr(null);
              setUploading(true);
              try {
                const fd = new FormData();
                fd.set("file", file);

                const { url } = await uploadImage(fd);
                insertAtCursor(`\n\n![](${url})\n\n`);
              } catch (err) {
                setUploadErr(err instanceof Error ? err.message : "上传失败");
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
      </div>

      {uploadErr && <p className="text-sm text-red-600">{uploadErr}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-semibold">编辑</div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="h-[420px] w-full rounded border p-2 font-mono text-sm"
            onPaste={async (e) => {
              const items = e.clipboardData?.items;
              if (!items) return;

              // 找剪贴板里的图片
              const imageItem = Array.from(items).find((it) =>
                it.type.startsWith("image/"),
              );
              if (!imageItem) return;

              e.preventDefault();

              const file = imageItem.getAsFile();
              if (!file) return;

              setUploadErr(null);
              setUploading(true);
              try {
                const fd = new FormData();
                fd.set("file", file);
                const { url } = await uploadImage(fd);
                insertAtCursor(`\n\n![](${url})\n\n`);
              } catch (err) {
                setUploadErr(
                  err instanceof Error ? err.message : "粘贴上传失败",
                );
              } finally {
                setUploading(false);
              }
            }}
            onDragOver={(e) => {
              // 必须阻止默认，否则 drop 会触发浏览器打开图片
              e.preventDefault();
            }}
            onDrop={async (e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) {
                setUploadErr("只能拖拽图片文件");
                return;
              }

              setUploadErr(null);
              setUploading(true);
              try {
                const fd = new FormData();
                fd.set("file", file);
                const { url } = await uploadImage(fd);
                insertAtCursor(`\n\n![](${url})\n\n`);
              } catch (err) {
                setUploadErr(
                  err instanceof Error ? err.message : "拖拽上传失败",
                );
              } finally {
                setUploading(false);
              }
            }}
          />
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold">预览</div>
          <div className="h-[420px] overflow-auto rounded border p-3">
            <article className="prose max-w-none">
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
              >
                {value || "（预览区：开始输入 Markdown 吧）"}
              </ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
