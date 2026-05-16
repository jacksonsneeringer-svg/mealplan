import { UserProfile, Goal, ActivityLevel, Meal } from "./types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose_weight: -500,
  maintain: 0,
  gain_weight: 300,
  build_muscle: 250,
};

// Macro calorie ratios per goal (protein/carbs/fat percentages)
const MACRO_RATIOS: Record<Goal, { protein: number; carbs: number; fat: number }> = {
  lose_weight:   { protein: 0.35, carbs: 0.35, fat: 0.30 },
  maintain:      { protein: 0.30, carbs: 0.40, fat: 0.30 },
  gain_weight:   { protein: 0.25, carbs: 0.50, fat: 0.25 },
  build_muscle:  { protein: 0.35, carbs: 0.40, fat: 0.25 },
};

export function calculateTargetCalories(profile: UserProfile): number {
  const { weightKg, heightCm, age, gender, activityLevel, goal } = profile;
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.max(1200, Math.round(tdee + GOAL_ADJUSTMENTS[goal]));
}

export function calculateMacros(calories: number, goal: Goal) {
  const r = MACRO_RATIOS[goal];
  return {
    protein: Math.round((calories * r.protein) / 4),
    carbs: Math.round((calories * r.carbs) / 4),
    fat: Math.round((calories * r.fat) / 9),
  };
}

export function scaleMealToCalories(meal: Meal, newCalories: number): Meal {
  const ratio = newCalories / meal.calories;
  return {
    ...meal,
    calories: Math.round(newCalories),
    protein: Math.round(meal.protein * ratio),
    carbs: Math.round(meal.carbs * ratio),
    fat: Math.round(meal.fat * ratio),
  };
}

export function dayTotals(meals: Meal[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
