import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  const session = await requireAdmin();

  return (
    <div className="flex flex-col gap-4">
      <h1>Admin</h1>
      <p className="text-muted-foreground">
        Signed in as {session.email}.
      </p>
    </div>
  );
}
