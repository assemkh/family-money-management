"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import type { AuthActionState } from "@/lib/auth/action-state";
import { rememberSessionCookie } from "@/lib/auth/cookies";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
} from "@/lib/auth/validation";
import { getPublicEnvironment } from "@/lib/env/public";
import { hasServerEnvironment } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function invalidFields(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}) {
  return {
    status: "error" as const,
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

async function resolveIdentifier(identifier: string) {
  const admin = createAdminClient();

  if (identifier.includes("@")) {
    return { email: identifier };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("username", identifier)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !profile) return null;

  const { data, error } = await admin.auth.admin.getUserById(profile.id);

  if (error || !data.user.email) return null;

  return {
    email: data.user.email,
  };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on",
  });

  if (!result.success) return invalidFields(result.error);

  if (!hasServerEnvironment()) {
    return {
      status: "error",
      message: "Secure login is not configured on the server yet.",
    };
  }

  let destination = "/dashboard";

  try {
    const identity = await resolveIdentifier(result.data.identifier);
    const supabase = await createClient({ rememberSession: result.data.remember });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identity?.email ?? `${result.data.identifier}@invalid.local`,
      password: result.data.password,
    });

    if (error || !identity || !data.user) {
      return {
        status: "error",
        message: "The username, email, or password is incorrect.",
      };
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("must_change_password, is_active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile || !profile.is_active) {
      await supabase.auth.signOut({ scope: "local" });
      return {
        status: "error",
        message: "The username, email, or password is incorrect.",
      };
    }

    await admin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.user.id);

    const cookieStore = await cookies();
    cookieStore.set(
      rememberSessionCookie,
      result.data.remember ? "persistent" : "session",
      {
        httpOnly: true,
        maxAge: result.data.remember ? 60 * 60 * 24 * 365 : undefined,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );

    destination = profile.must_change_password ? "/change-password" : "/dashboard";
  } catch {
    return {
      status: "error",
      message: "Secure login is temporarily unavailable. Please try again.",
    };
  }

  redirect(destination);
}

export async function changePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? "") || undefined,
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!result.success) return invalidFields(result.error);

  if (!hasServerEnvironment()) {
    return { status: "error", message: "Password management is not configured." };
  }

  try {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return { status: "error", message: "Your session expired. Sign in again." };
    }

    const passwordUpdate = result.data.currentPassword
      ? {
          password: result.data.password,
          current_password: result.data.currentPassword,
        }
      : { password: result.data.password };
    const { error: passwordError } = await supabase.auth.updateUser(passwordUpdate);

    if (passwordError) {
      return {
        status: "error",
        message: "The current password is incorrect or the new password was rejected.",
      };
    }

    const admin = createAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        must_change_password: false,
        last_login_at: new Date().toISOString(),
      })
      .eq("id", userData.user.id);

    if (profileError) {
      return {
        status: "error",
        message: "The password changed, but account setup could not finish. Try again.",
      };
    }

    await supabase.auth.signOut({ scope: "others" });
  } catch {
    return {
      status: "error",
      message: "Password management is temporarily unavailable. Please try again.",
    };
  }

  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = forgotPasswordSchema.safeParse({
    identifier: formData.get("identifier"),
  });

  if (!result.success) return invalidFields(result.error);

  const success: AuthActionState = {
    status: "success",
    message: "If that account exists, a password-reset link has been sent.",
  };

  if (!hasServerEnvironment()) return success;

  try {
    const identity = await resolveIdentifier(result.data.identifier);

    if (!identity) return success;

    const callbackUrl = new URL(
      "/auth/callback",
      getPublicEnvironment().NEXT_PUBLIC_SITE_URL,
    );
    callbackUrl.searchParams.set("next", "/change-password?recovery=1");
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(identity.email, {
      redirectTo: callbackUrl.toString(),
    });
  } catch {
    // Return the same response to prevent username enumeration.
  }

  return success;
}

export async function logoutAction(formData: FormData) {
  const scope = formData.get("scope") === "global" ? "global" : "local";
  const supabase = await createClient();
  await supabase.auth.signOut({ scope });
  const cookieStore = await cookies();
  cookieStore.delete(rememberSessionCookie);
  redirect("/login");
}
