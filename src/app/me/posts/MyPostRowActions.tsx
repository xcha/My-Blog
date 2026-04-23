"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import { deleteMyPost } from "./actions";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type State = { ok: boolean; message?: string };
const initialState: State = { ok: true };

export default function MyPostRowActions({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      try {
        await deleteMyPost(formData);
        return { ok: true, message: "已删除" };
      } catch (e) {
        return {
          ok: false,
          message: e instanceof Error ? e.message : "删除失败",
        };
      }
    },
    initialState,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            操作
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/me/posts/${postId}`}>编辑</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除？</DialogTitle>
            <DialogDescription>
              删除后不可恢复（当前为硬删除）。
            </DialogDescription>
          </DialogHeader>

          {state.ok === false && state.message && (
            <p className="text-sm text-red-600">{state.message}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              取消
            </Button>

            <form
              action={(fd) => {
                fd.set("postId", postId);
                action(fd);

                setTimeout(() => {
                  if (state.ok === false) {
                    toast.error(state.message ?? "删除失败");
                    return;
                  }
                  toast.success("已删除");
                  setOpen(false);
                }, 50);
              }}
            >
              <Button variant="destructive" type="submit" disabled={pending}>
                {pending ? "删除中..." : "确认删除"}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
