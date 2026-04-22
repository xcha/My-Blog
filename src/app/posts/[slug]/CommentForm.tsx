"use client";

import { useActionState } from "react";
import { createComment } from "./actions";

type State = { ok: boolean; message?: string };

const initialState: State = { ok: true };

export default function CommentForm({
  postId,
  slug,
}: {
  postId: string;
  slug: string;
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    createComment,
    initialState,
  );

  return (
    <form action={action} className="mt-4 space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />

      <textarea
        name="content"
        className="h-24 w-full rounded border p-2"
        placeholder="写下你的评论（最多 500 字）"
      />

      {state.ok === false && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button
        disabled={pending}
        className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-60"
      >
        {pending ? "发送中..." : "发表评论"}
      </button>
    </form>
  );
}
