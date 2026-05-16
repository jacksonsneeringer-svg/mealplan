import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { UserProfile } from "@/lib/types";
import { calculateTargetCalories, calculateMacros } from "@/lib/nutrition";

const client = new Anthropic();

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "lose weight",
  maintain: "maintain current weight",
  gain_weight: "gain weight",
  build_muscle: "build muscle",
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "sedentary (desk job, little exercise)",
  light: "lightly active (1-3 days/week exercise)",
  moderate: "moderately active (3-5 days/week exercise)",
  active: "very active (6-7 days/week hard exercise)",
  very_active: "extremely active (physical job + daily exercise)",
};

export async function POST(req: NextRequest) {
  try {
    const profile: UserProfile = await req.json();
    const targetCalories = calculateTargetCalories(profile);
    const macros = calculateMacros(targetCalories, profile.goal);

    const restrictions =
      profile.dietaryRestrictions.length > 0
        ? profile.dietaryRestrictions.join(", ")
        : "none";

    const prompt = `You are a professional nutritionist. Create a varied, delicious 7-day meal plan for this person:

Goal: ${GOAL_LABELS[profile.goal]}
Age: ${profile.age}, Gender: ${profile.gender}
Height: ${profile.heightCm}cm, Weight: ${profile.weightKg}kg
Activity: ${ACTIVITY_LABELS[profile.activityLevel]}
Dietary restrictions: ${restrictions}
Foods to avoid: ${profile.foodsToAvoid || "none"}

Daily targets:
- Calories: ${targetCalories} kcal
- Protein: ${macros.protein}g
- Carbs: ${macros.carbs}g
- Fat: ${macros.fat}g

Rules:
- Each day has breakfast, lunch, dinner, and a snack
- All four meals should roughly sum to the daily targets
- Meals should be realistic and practical to prepare
- Vary the cuisine and ingredients across the week
- Respect all dietary restrictions strictly

Respond with ONLY valid JSON in exactly this structure (no markdown, no explanation):
{
  "days": [
    {
      "day": "Monday",
      "breakfast": {
        "name": "string",
        "description": "1-2 sentences about this dish",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "ingredients": ["ingredient1", "ingredient2"]
      },
      "lunch": { same structure },
      "dinner": { same structure },
      "snack": { same structure }
    }
  ]
}
Include all 7 days: Monday through Sunday.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Strip any markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const planData = JSON.parse(cleaned);

    // Attach stable IDs to each meal
    const days = planData.days.map((day: Record<string, unknown>, di: number) => ({
      ...day,
      breakfast: { ...day.breakfast as Record<string, unknown>, id: `${di}-breakfast` },
      lunch: { ...day.lunch as Record<string, unknown>, id: `${di}-lunch` },
      dinner: { ...day.dinner as Record<string, unknown>, id: `${di}-dinner` },
      snack: { ...day.snack as Record<string, unknown>, id: `${di}-snack` },
    }));

    return NextResponse.json({
      days,
      targetCalories,
      targetProtein: macros.protein,
      targetCarbs: macros.carbs,
      targetFat: macros.fat,
    });
  } catch (err) {
    console.error("generate-plan error:", err);
    return NextResponse.json({ error: "Failed to generate meal plan" }, { status: 500 });
  }
}
