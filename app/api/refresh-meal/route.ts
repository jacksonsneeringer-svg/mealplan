import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { UserProfile, MealType } from "@/lib/types";

const client = new Anthropic();

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  snack: "snack",
};

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "lose weight",
  maintain: "maintain weight",
  gain_weight: "gain weight",
  build_muscle: "build muscle",
};

export async function POST(req: NextRequest) {
  try {
    const body: {
      profile: UserProfile;
      mealType: MealType;
      dayIndex: number;
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
      existingMealName: string;
    } = await req.json();

    const { profile, mealType, targetCalories, targetProtein, targetCarbs, targetFat, existingMealName } = body;

    const restrictions =
      profile.dietaryRestrictions.length > 0
        ? profile.dietaryRestrictions.join(", ")
        : "none";

    const prompt = `You are a professional nutritionist. Generate a single replacement ${MEAL_LABELS[mealType]} meal.

Person's goal: ${GOAL_LABELS[profile.goal]}
Dietary restrictions: ${restrictions}
Foods to avoid: ${profile.foodsToAvoid || "none"}

Targets for this meal:
- Calories: approximately ${targetCalories} kcal
- Protein: approximately ${targetProtein}g
- Carbs: approximately ${targetCarbs}g
- Fat: approximately ${targetFat}g

Important: Do NOT suggest "${existingMealName}" — generate something different and creative.
Make it practical to prepare and delicious.

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "name": "string",
  "description": "1-2 sentences about this dish",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "ingredients": ["ingredient1", "ingredient2"]
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const meal = JSON.parse(cleaned);

    return NextResponse.json(meal);
  } catch (err) {
    console.error("refresh-meal error:", err);
    return NextResponse.json({ error: "Failed to refresh meal" }, { status: 500 });
  }
}
