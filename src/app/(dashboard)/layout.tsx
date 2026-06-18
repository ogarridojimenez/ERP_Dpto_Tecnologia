import { Toaster } from "sonner";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { DashboardChrome } from "@/components/dashboard-chrome";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <Toaster position="top-right" richColors closeButton />
      <DashboardChrome>{children}</DashboardChrome>
    </SupabaseProvider>
  );
}
