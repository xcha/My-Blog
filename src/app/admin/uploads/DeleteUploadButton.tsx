"use client";

import { useActionState } from "react";
import { deleteUpload } from "./actions";

type State = { ok: boolean; message?: string };
const initialState: State = { ok: true };

export default function DeleteUploadButton({ uploadId }: { uploadId: string }) {
  const [state, action, pending] = useActionState<State, FormData>(
    deleteUpload,
    initialState,
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <form action={action}>
          <input type="hidden" name="uploadId" value={uploadId} />
          <button
            disabled={pending}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            删除
          </button>
        </form>

        {/* 二次确认按钮 */}
        <form action={action}>
          <input type="hidden" name="uploadId" value={uploadId} />
          <input type="hidden" name="confirm" value="YES" />
          <button
            disabled={pending}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-60"
          >
            确认删除
          </button>
        </form>
      </div>

      {state.message && (
        <p
          className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
