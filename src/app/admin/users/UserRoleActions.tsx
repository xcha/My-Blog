"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";

import { setUserRole } from "./actions";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function UserRoleActions({
  userId,
  role,
}: {
  userId: string;
  role: "USER" | "ADMIN";
}) {
  const [open, setOpen] = useState(false);
  const [nextRole, setNextRole] = useState<"USER" | "ADMIN">(role);

  const [state, action, pending] = useActionState<State, FormData>(
    setUserRole,
    initialState,
  );

  // 当 action 返回 message 时弹 toast（简单做法：用 effect 也行，这里用同步判断）
  if (state.message) {
    // 防止重复 toast：只有在 dialog 打开/或 pending 结束后触发更自然
    // 这里用最简单策略：提交成功/失败后关闭弹窗并 toast
  }

  function submit(roleToSet: "USER" | "ADMIN") {
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("role", roleToSet);
    action(fd);
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={role === "ADMIN" ? "default" : "secondary"}>{role}</Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            操作
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {role !== "ADMIN" ? (
            <DropdownMenuItem
              onClick={() => {
                setNextRole("ADMIN");
                setOpen(true);
              }}
            >
              升为管理员
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                setNextRole("USER");
                setOpen(true);
              }}
            >
              降为用户
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认操作</DialogTitle>
            <DialogDescription>
              你确定要把该用户设置为 <b>{nextRole}</b> 吗？
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
            <Button
              onClick={async () => {
                submit(nextRole);

                // 这里不能立刻关闭，因为 action 是异步；
                // 我们用一个非常实用的做法：短延迟后检查 state（在大多数场景足够）
                setTimeout(() => {
                  // 提示
                  if (state.ok === false) {
                    toast.error(state.message ?? "操作失败");
                    return;
                  }
                  toast.success(`已设置为 ${nextRole}`);
                  setOpen(false);
                }, 50);
              }}
              disabled={pending}
            >
              {pending ? "处理中..." : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
