import { requireUser } from "@/lib/rbac";
import NewPostForm from "./NewPostForm";

export default async function NewPostPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <NewPostForm />
    </div>
  );
}
