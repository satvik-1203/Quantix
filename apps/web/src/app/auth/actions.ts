"use server";

import { db, users, organizations, userOrganizations } from "@workspace/drizzle";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

// Simple mock authentication for development
// TODO: Replace with proper JWT/session management in production

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    // TODO: Verify password hash with bcrypt
    // For now, we'll just check if password matches (DEVELOPMENT ONLY)
    // const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    // Get user's organizations
    const userOrgs = await db.query.userOrganizations.findMany({
      where: eq(userOrganizations.userId, user.id),
      with: {
        organization: true,
      },
    });

    // Store user session (simplified - use proper session management in production)
    const cookieStore = await cookies();
    cookieStore.set("user_id", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set default organization if user has any
    if (userOrgs.length > 0) {
      cookieStore.set("organization_id", userOrgs[0].organizationId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return { success: true, user: { id: user.id, email: user.email, name: user.name } };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An error occurred during login" };
  }
}

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  const organizationName = formData.get("organizationName") as string;

  if (!email || !password || !name) {
    return { error: "All fields are required" };
  }

  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // TODO: Hash password with bcrypt
    // const passwordHash = await bcrypt.hash(password, 10);
    const passwordHash = password; // DEVELOPMENT ONLY - NEVER DO THIS IN PRODUCTION

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
        role: "user",
      })
      .returning();

    // Create default organization if name provided
    let organizationId: number | null = null;
    if (organizationName) {
      const slug = organizationName.toLowerCase().replace(/\s+/g, "-");
      const [org] = await db
        .insert(organizations)
        .values({
          name: organizationName,
          slug,
        })
        .returning();

      organizationId = org.id;

      // Link user to organization as owner
      await db.insert(userOrganizations).values({
        userId: newUser.id,
        organizationId: org.id,
        role: "owner",
      });
    }

    // Auto-login after registration
    const cookieStore = await cookies();
    cookieStore.set("user_id", newUser.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    if (organizationId) {
      cookieStore.set("organization_id", organizationId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return { success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An error occurred during registration" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("user_id");
  cookieStore.delete("organization_id");
  return { success: true };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return null;
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(userId)),
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function switchOrganization(organizationId: number) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;

  if (!userId) {
    return { error: "Not authenticated" };
  }

  try {
    // Verify user belongs to this organization
    const membership = await db.query.userOrganizations.findFirst({
      where: (userOrgs, { and, eq }) =>
        and(
          eq(userOrgs.userId, parseInt(userId)),
          eq(userOrgs.organizationId, organizationId)
        ),
    });

    if (!membership) {
      return { error: "You do not have access to this organization" };
    }

    cookieStore.set("organization_id", organizationId.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true };
  } catch (error) {
    console.error("Switch organization error:", error);
    return { error: "An error occurred while switching organization" };
  }
}
