import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/app/auth/actions";
import UserMenu from "./UserMenu";
import OrganizationSwitcher from "./OrganizationSwitcher";
import { Button } from "@/components/ui/button";
import { db, userOrganizations } from "@workspace/drizzle";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export default async function Header() {
  const links = [{ to: "/", label: "Home" }] as const;
  const user = await getCurrentUser();

  // Get user's organizations if logged in
  let organizations: any[] = [];
  let currentOrganizationId: number | undefined;

  if (user) {
    const cookieStore = await cookies();
    const orgId = cookieStore.get("organization_id")?.value;
    currentOrganizationId = orgId ? parseInt(orgId) : undefined;

    const userOrgs = await db.query.userOrganizations.findMany({
      where: eq(userOrganizations.userId, user.id),
      with: {
        organization: true,
      },
    });

    organizations = userOrgs.map((uo) => ({
      id: uo.organization.id,
      name: uo.organization.name,
      role: uo.role,
    }));
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <nav className="flex gap-4 text-lg">
            {links.map(({ to, label }) => {
              return (
                <Link key={to} href={to}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {organizations.length > 0 && (
                <OrganizationSwitcher
                  organizations={organizations}
                  currentOrganizationId={currentOrganizationId}
                />
              )}
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/register">Sign Up</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </div>
      <hr />
    </div>
  );
}
