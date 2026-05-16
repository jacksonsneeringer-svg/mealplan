"use client";

import { useState } from "react";
import { Meal } from "@/lib/types";
import { scaleMealToCalories } from "@/lib/nutrition";

interface MealCardProps {
  mealType: string;
  meal: Meal;
  isRefreshing: boolean;
  onRefresh: () => void;
  onUpdate: (updated: Meal) => void;
}

export default function MealCard({ mealType, meal, isRefreshing, onRefresh, onUpdate }: MealCardProps) {
  const [editing, setEditing] = useState(false);
  const [editCalories, setEditCalories] = useState(String(meal.calories));
  const [showIngredients, setShowIngredients] = useState(false);

  function handleSaveCalories() {
    const newCal = parseInt(editCalories);
    if (!newCal || newCal < 50 || newCal > 2500) return;
    onUpdate(scaleMealToCalories(meal, newCal));
    setEditing(false);
  }

  function handleCancelEdit() {
    setEditCalories(String(meal.calories));
    setEditing(false);
  }

  const MEAL_ICONS: Record<string, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍎",
  };

  return (
    <div className="card p-5 relative overflow-hidden">
      {/* Refresh overlay */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-600">Finding a new meal...</span>
          </div>
        </div>
      )}

      {/* Meal type label */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {MEAL_ICONS[mealType]} {mealType}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => { setEditing(true); setEditCalories(String(meal.calories)); }}
            title="Edit calories"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <PencilIcon />
          </button>
          <button
            onClick={onRefresh}
            title="Get a different meal"
            disabled={isRefreshing}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      {/* Meal name & description */}
      <h3 className="font-bold text-gray-900 leading-tight">{meal.name}</h3>
      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{meal.description}</p>

      {/* Macros */}
      <div className="flex flex-wrap gap-2 mt-4">
        <span className="macro-pill bg-orange-50 text-orange-700">
          🔥 {meal.calories} cal
        </span>
        <span className="macro-pill bg-blue-50 text-blue-700">
          P {meal.protein}g
        </span>
        <span className="macro-pill bg-yellow-50 text-yellow-700">
          C {meal.carbs}g
        </span>
        <span className="macro-pill bg-red-50 text-red-700">
          F {meal.fat}g
        </span>
      </div>

      {/* Ingredients toggle */}
      {meal.ingredients && meal.ingredients.length > 0 && (
        <button
          onClick={() => setShowIngredients((v) => !v)}
          className="text-xs text-brand-600 hover:text-brand-700 mt-3 font-medium"
        >
          {showIngredients ? "Hide" : "Show"} ingredients
        </button>
      )}
      {showIngredients && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {meal.ingredients.map((ing, i) => (
            <li key={i} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full border border-gray-100">
              {ing}
            </li>
          ))}
        </ul>
      )}

      {/* Edit calories panel */}
      {editing && (
        <div className="mt-4 p-4 bg-brand-50 rounded-xl border border-brand-100">
          <p className="text-xs font-semibold text-brand-700 mb-2">Adjust calories</p>
          <p className="text-xs text-brand-600 mb-3">Macros will scale proportionally to maintain the same ratios.</p>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="number"
                min="50"
                max="2500"
                value={editCalories}
                onChange={(e) => setEditCalories(e.target.value)}
                className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">kcal</span>
            </div>
            <button
              onClick={handleSaveCalories}
              className="px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {/* Preview scaled macros */}
          {editCalories && parseInt(editCalories) > 0 && parseInt(editCalories) !== meal.calories && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(() => {
                const scaled = scaleMealToCalories(meal, parseInt(editCalories));
                return (
                  <>
                    <span className="macro-pill bg-blue-50 text-blue-700">P {scaled.protein}g</span>
                    <span className="macro-pill bg-yellow-50 text-yellow-700">C {scaled.carbs}g</span>
                    <span className="macro-pill bg-red-50 text-red-700">F {scaled.fat}g</span>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.93l-3.414 1.138 1.138-3.414A4 4 0 019 13z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
