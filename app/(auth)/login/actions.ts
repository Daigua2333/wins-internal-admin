"use server";

import { redirect } from "next/navigation";

import { ensureCurrentUserProfile } from "@/lib/auth/session";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing_credentials");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[auth:login]", error.message);
    redirect(`/login?error=invalid_credentials&detail=${encodeURIComponent(error.message)}`);
  }

  await ensureCurrentUserProfile();

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const configuredInviteCode = process.env.WINS_SIGNUP_INVITE_CODE?.trim();

  if (!configuredInviteCode) {
    redirect("/login?mode=signup&error=signup_closed");
  }

  if (!fullName || !email || !inviteCode || !password || !confirmPassword) {
    redirect("/login?mode=signup&error=missing_signup_fields");
  }

  if (inviteCode !== configuredInviteCode) {
    redirect("/login?mode=signup&error=invalid_invite_code");
  }

  if (password.length < 8) {
    redirect("/login?mode=signup&error=weak_password");
  }

  if (password !== confirmPassword) {
    redirect("/login?mode=signup&error=password_mismatch");
  }

  const supabase = await createClient();
  const emailRedirectTo = `${getSiteUrl()}/login`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    console.error("[auth:signup]", error.message);
    redirect(`/login?mode=signup&error=signup_failed&detail=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect("/login?mode=signup&message=check_email");
  }

  await ensureCurrentUserProfile();

  redirect("/dashboard");
}
