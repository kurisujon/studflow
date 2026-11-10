import { redirect, unstable_rethrow } from "next/navigation";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import {
  fetchAdminUsersOverview,
  fetchUserAccessStatus,
} from "@/lib/server-api";

export const metadata = {
  title: "User Management",
};

export default async function AdminUsersPage() {
  const accessStatus = await fetchUserAccessStatus().catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });

  if (!accessStatus || !accessStatus.approved || accessStatus.suspended) {
    redirect("/access-restricted");
  }

  if (!accessStatus.is_admin) {
    redirect("/dashboard");
  }

  const overview = await fetchAdminUsersOverview().catch((error: unknown) => {
    unstable_rethrow(error);
    return {
      users: [],
      invitations: [],
      counts: {
        total_users: 0,
        active_users: 0,
        pending_users: 0,
        suspended_users: 0,
        admin_users: 0,
        pending_invitations: 0,
      },
    };
  });

  return (
    <AdminUsersClient
      initialOverview={overview}
      currentAdminId={accessStatus.clerk_user_id}
    />
  );
}
