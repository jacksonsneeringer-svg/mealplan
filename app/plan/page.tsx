"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/types";
import MealPlanView from "@/components/MealPlanView";

export default function PlanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mealgen-profile");
    if (!stored) {
      router.replace("/");
      return;
    }
    try {
      setProfile(JSON.parse(stored));
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!profile) return null;

  return <MealPlanView profile={profile} />;
}
