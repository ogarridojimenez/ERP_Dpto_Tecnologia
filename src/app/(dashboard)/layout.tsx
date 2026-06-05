import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </SupabaseProvider>
  );
}
