import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard-header";
import { ActivityOverview } from "@/components/activity-overview";
import { RecentUpdates } from "@/components/recent-updates";
import { QuickActions } from "@/components/quick-actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader user={user} profile={profile} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-8">
            <QuickActions />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <RecentUpdates />
          </div>
        </div>
        <div className="w-full mt-8">
          <ActivityOverview />
        </div>
      </main>
    </div>
  );
}
