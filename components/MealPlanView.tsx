"use client";

import { useState, useEffect, useCallback } from "react";
import { WeekPlan, UserProfile, DayPlan, Meal, MealType } from "@/lib/types";
import { dayTotals } from "@/lib/nutrition";
import MealCard from "./MealCard";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

interface RefreshState {
  dayIndex: number;
  mealType: MealType;
}

export default function MealPlanView({ profile }: { profile: UserProfile }) {
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [refreshing, setRefreshing] = useState<RefreshState | null>(null);

  const generatePlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to generate plan");
      const data: WeekPlan = await res.json();
      setPlan(data);
      localStorage.setItem("mealgen-plan", JSON.stringify(data));
    } catch {
      setError("Something went wrong generating your plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    const cached = localStorage.getItem("mealgen-plan");
    if (cached) {
      try {
        setPlan(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // ignore and re-generate
      }
    }
    generatePlan();
  }, [generatePlan]);

  async function handleRefreshMeal(dayIndex: number, mealType: MealType) {
    if (!plan) return;
    setRefreshing({ dayIndex, mealType });

    const currentMeal = plan.days[dayIndex][mealType] as Meal;
    const mealsInDay = MEAL_TYPES.map((mt) => plan.days[dayIndex][mt] as Meal);
    const dayTotal = dayTotals(mealsInDay);
    const share = currentMeal.calories / (dayTotal.calories || 1);

    try {
      const res = await fetch("/api/refresh-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          mealType,
          dayIndex,
          targetCalories: Math.round(plan.targetCalories * share),
          targetProtein: Math.round(plan.targetProtein * share),
          targetCarbs: Math.round(plan.targetCarbs * share),
          targetFat: Math.round(plan.targetFat * share),
          existingMealName: currentMeal.name,
        }),
      });
      if (!res.ok) throw new Error();
      const newMeal: Meal = await res.json();
      newMeal.id = `${dayIndex}-${mealType}-${Date.now()}`;

      setPlan((prev) => {
        if (!prev) return prev;
        const days = prev.days.map((day, di) => {
          if (di !== dayIndex) return day;
          return { ...day, [mealType]: newMeal };
        });
        const updated = { ...prev, days };
        localStorage.setItem("mealgen-plan", JSON.stringify(updated));
        return updated;
      });
    } catch {
      // silently fail — user can try again
    } finally {
      setRefreshing(null);
    }
  }

  function handleUpdateMeal(dayIndex: number, mealType: MealType, updated: Meal) {
    setPlan((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((day, di) => {
        if (di !== dayIndex) return day;
        return { ...day, [mealType]: updated };
      });
      const newPlan = { ...prev, days };
      localStorage.setItem("mealgen-plan", JSON.stringify(newPlan));
      return newPlan;
    });
  }

  function handleRestart() {
    localStorage.removeItem("mealgen-plan");
    localStorage.removeItem("mealgen-profile");
    window.location.href = "/";
  }

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={generatePlan} />;
  if (!plan) return null;

  const currentDay: DayPlan = plan.days[selectedDay];
  const mealsToday = MEAL_TYPES.map((mt) => currentDay[mt] as Meal);
  const totals = dayTotals(mealsToday);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <span className="font-bold text-lg text-gray-900">MealGen</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { localStorage.removeItem("mealgen-plan"); generatePlan(); }}
              className="btn-secondary text-sm py-2 px-4"
            >
              Regenerate Week
            </button>
            <button onClick={handleRestart} className="btn-secondary text-sm py-2 px-4">
              Start Over
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Targets summary */}
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-gray-700 text-sm mb-3">Your Daily Targets</h2>
          <div className="grid grid-cols-4 gap-4">
            <MacroStat label="Calories" value={plan.targetCalories} unit="kcal" color="orange" />
            <MacroStat label="Protein" value={plan.targetProtein} unit="g" color="blue" />
            <MacroStat label="Carbs" value={plan.targetCarbs} unit="g" color="yellow" />
            <MacroStat label="Fat" value={plan.targetFat} unit="g" color="red" />
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {DAYS.map((day, i) => (
            <button
              key={day}
              onClick={() => setSelectedDay(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                selectedDay === i
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-100 hover:border-gray-200"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Today's totals */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{DAYS[selectedDay]}</h2>
          <div className="flex gap-3 text-sm">
            <span className="text-orange-600 font-medium">{totals.calories} cal</span>
            <span className="text-blue-600">P {totals.protein}g</span>
            <span className="text-yellow-600">C {totals.carbs}g</span>
            <span className="text-red-600">F {totals.fat}g</span>
          </div>
        </div>

        {/* Meal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MEAL_TYPES.map((mt) => (
            <MealCard
              key={`${selectedDay}-${mt}`}
              mealType={mt}
              meal={currentDay[mt] as Meal}
              isRefreshing={refreshing?.dayIndex === selectedDay && refreshing?.mealType === mt}
              onRefresh={() => handleRefreshMeal(selectedDay, mt)}
              onUpdate={(updated) => handleUpdateMeal(selectedDay, mt, updated)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function MacroStat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    orange: "text-orange-600",
    blue: "text-blue-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };
  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="text-xs text-gray-400">{label} ({unit})</div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-5xl animate-bounce">🥗</div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Building your meal plan...</h2>
        <p className="text-gray-500 text-sm mt-1">Claude is crafting a week of personalized meals for you.</p>
      </div>
      <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-brand-500 rounded-full animate-pulse w-3/4" />
      </div>
    </div>
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-5xl">😕</div>
      <h2 className="text-xl font-bold text-gray-900">Oops!</h2>
      <p className="text-gray-500 text-sm text-center max-w-sm">{message}</p>
      <button className="btn-primary" onClick={onRetry}>Try Again</button>
    </div>
  );
}
