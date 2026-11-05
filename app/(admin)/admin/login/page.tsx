import type { Metadata } from "next";

import { LoginForm } from "@/app/(admin)/admin/login/login-form";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin login — sahaara",
};

export default function AdminLoginPage() {
  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <h1>Admin login</h1>
        <p className="text-base text-muted-foreground">
          Sign in to manage schemes and receipts.
        </p>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
