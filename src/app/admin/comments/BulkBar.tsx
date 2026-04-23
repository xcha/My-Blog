"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { batchModerateComments } from "./actions";

export default function BulkBar({
  selectedIds,
  clear,
}: {
  selectedIds: string[];
  clear: () => void;
}) {
  const disabled = selectedIds.length === 0;
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="text-sm text-muted-foreground">
        已选择{" "}
        <span className="font-medium text-foreground">
          {selectedIds.length}
        </span>{" "}
        条评论
      </div>

      <div className="flex gap-2">
        <Button
          disabled={disabled || pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await batchModerateComments(selectedIds, "hide");
                toast.success("批量屏蔽完成");
                clear();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "操作失败");
              }
            })
          }
          variant="destructive"
        >
          批量屏蔽
        </Button>

        <Button
          disabled={disabled || pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await batchModerateComments(selectedIds, "unhide");
                toast.success("批量恢复完成");
                clear();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "操作失败");
              }
            })
          }
          variant="outline"
        >
          批量恢复
        </Button>

        <Button
          disabled={disabled || pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await batchModerateComments(selectedIds, "delete");
                toast.success("批量软删除完成");
                clear();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "操作失败");
              }
            })
          }
          variant="secondary"
        >
          批量软删除
        </Button>

        <Button
          disabled={disabled || pending}
          onClick={clear}
          variant="ghost"
          type="button"
        >
          清空选择
        </Button>
      </div>
    </div>
  );
}
