import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { prefillNames } from "@/features/onboarding/steps";

export const metadata: Metadata = { title: "Set up your account" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, first_name, last_name, onboarded_at, age_confirmed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarded_at) redirect("/");

  return (
    <OnboardingForm
      initial={{
        ...prefillNames(profile, user.user_metadata),
        ageConfirmed: Boolean(profile?.age_confirmed_at),
      }}
    />
  );
}
