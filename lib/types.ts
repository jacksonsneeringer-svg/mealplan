export type Goal = "lose_weight" | "maintain" | "gain_weight" | "build_muscle";
export type Gender = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Units = "metric" | "imperial";

export interface UserProfile {
  goal: Goal;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  dietaryRestrictions: string[];
  foodsToAvoid: string;
  units: Units;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface DayPlan {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack: Meal;
}

export interface WeekPlan {
  days: DayPlan[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}
