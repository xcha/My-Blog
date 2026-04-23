"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { batchModeratePosts } from "./actions";

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
        篇文章
      </div>

      <div className="flex gap-2">
        <Button
          disabled={disabled || pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await batchModeratePosts(selectedIds, "approve");
                toast.success("批量通过完成");
                clear();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "操作失败");
              }
            })
          }
        >
          批量通过
        </Button>

        <Button
          disabled={disabled || pending}
          variant="destructive"
          onClick={() =>
            startTransition(async () => {
              try {
                await batchModeratePosts(selectedIds, "reject");
                toast.success("批量驳回完成");
                clear();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "操作失败");
              }
            })
          }
        >
          批量驳回
        </Button>

        <Button
          disabled={disabled || pending}
          variant="outline"
          onClick={clear}
          type="button"
        >
          清空选择
        </Button>
      </div>
    </div>
  );
}
