"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { setPinned } from "./actions";
import { Switch } from "@/components/ui/switch";

export default function PinSwitch({
  postId,
  checked,
}: {
  postId: string;
  checked: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={checked}
      disabled={pending}
      onCheckedChange={(next) => {
        startTransition(async () => {
          try {
            const fd = new FormData();
            fd.set("postId", postId);
            fd.set("pinned", String(next));
            await setPinned(fd);

            toast.success(next ? "已置顶" : "已取消置顶");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "操作失败");
          }
        });
      }}
    />
  );
}
