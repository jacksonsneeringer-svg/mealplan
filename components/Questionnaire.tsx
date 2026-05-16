"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, Goal, Gender, ActivityLevel, Units } from "@/lib/types";

const GOALS: { value: Goal; label: string; icon: string; description: string }[] = [
  { value: "lose_weight",  label: "Lose Weight",    icon: "🔥", description: "Calorie deficit to shed fat" },
  { value: "build_muscle", label: "Build Muscle",   icon: "💪", description: "High protein, strength focus" },
  { value: "gain_weight",  label: "Gain Weight",    icon: "📈", description: "Calorie surplus to bulk up" },
  { value: "maintain",     label: "Stay Balanced",  icon: "⚖️", description: "Maintain your current weight" },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary",  label: "Sedentary",          description: "Desk job, little to no exercise" },
  { value: "light",      label: "Lightly Active",     description: "Light exercise 1–3 days/week" },
  { value: "moderate",   label: "Moderately Active",  description: "Moderate exercise 3–5 days/week" },
  { value: "active",     label: "Very Active",        description: "Hard exercise 6–7 days/week" },
  { value: "very_active",label: "Extremely Active",   description: "Physical job + daily intense training" },
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", "Halal", "Kosher", "Pescatarian",
];

const TOTAL_STEPS = 5;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>Step {step} of {TOTAL_STEPS}</span>
        <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function Questionnaire() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [units, setUnits] = useState<Units>("imperial");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [foodsToAvoid, setFoodsToAvoid] = useState("");

  function toggleRestriction(r: string) {
    setRestrictions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  function toMetricHeight(): number {
    if (units === "metric") return parseFloat(heightCm) || 0;
    const ft = parseFloat(heightFt) || 0;
    const inch = parseFloat(heightIn) || 0;
    return Math.round((ft * 12 + inch) * 2.54);
  }

  function toMetricWeight(): number {
    if (units === "metric") return parseFloat(weightKg) || 0;
    return Math.round((parseFloat(weightLbs) || 0) * 0.453592);
  }

  function canAdvance(): boolean {
    if (step === 1) return goal !== null;
    if (step === 2) {
      const h = toMetricHeight();
      const w = toMetricWeight();
      return !!age && h > 0 && w > 0;
    }
    if (step === 3) return activityLevel !== null;
    return true;
  }

  function handleSubmit() {
    const profile: UserProfile = {
      goal: goal!,
      age: parseInt(age),
      gender,
      heightCm: toMetricHeight(),
      weightKg: toMetricWeight(),
      activityLevel: activityLevel!,
      dietaryRestrictions: restrictions,
      foodsToAvoid,
      units,
    };
    localStorage.setItem("mealgen-profile", JSON.stringify(profile));
    router.push("/plan");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-4xl">🥗</span>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">MealGen</h1>
          <p className="text-gray-500 mt-1">Your personal AI meal planner</p>
        </div>

        <div className="card p-8">
          <ProgressBar step={step} />

          {/* Step 1: Goal */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-1">What&apos;s your goal?</h2>
              <p className="text-gray-500 text-sm mb-6">We&apos;ll calculate your ideal calorie target.</p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                      goal === g.value
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div className="text-2xl mb-2">{g.icon}</div>
                    <div className="font-semibold text-sm">{g.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{g.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-1">Tell us about yourself</h2>
              <p className="text-gray-500 text-sm mb-6">Used to calculate your daily calorie needs.</p>

              {/* Units toggle */}
              <div className="flex gap-2 mb-5">
                {(["imperial", "metric"] as Units[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnits(u)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      units === u ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {u.charAt(0).toUpperCase() + u.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    min="13"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 28"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex (for BMR calculation)</label>
                  <div className="flex gap-2">
                    {(["male", "female", "other"] as Gender[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          gender === g
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  {units === "imperial" ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="3"
                          max="8"
                          value={heightFt}
                          onChange={(e) => setHeightFt(e.target.value)}
                          placeholder="5"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ft</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="11"
                          value={heightIn}
                          onChange={(e) => setHeightIn(e.target.value)}
                          placeholder="10"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">in</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="number"
                        min="100"
                        max="250"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="178"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">cm</span>
                    </div>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="50"
                      value={units === "imperial" ? weightLbs : weightKg}
                      onChange={(e) =>
                        units === "imperial" ? setWeightLbs(e.target.value) : setWeightKg(e.target.value)
                      }
                      placeholder={units === "imperial" ? "160" : "73"}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                      {units === "imperial" ? "lbs" : "kg"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-1">How active are you?</h2>
              <p className="text-gray-500 text-sm mb-6">Include work and exercise.</p>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((a) => (
                  <button
                    key={a.value}
                    onClick={() => setActivityLevel(a.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-150 ${
                      activityLevel === a.value
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div className="font-semibold text-sm">{a.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Dietary Restrictions */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-1">Any dietary restrictions?</h2>
              <p className="text-gray-500 text-sm mb-6">Select all that apply. Skip if none.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => toggleRestriction(opt)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150 ${
                      restrictions.includes(opt)
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Foods to Avoid */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold mb-1">Any foods you dislike?</h2>
              <p className="text-gray-500 text-sm mb-6">Optional — we&apos;ll make sure to leave these out.</p>
              <textarea
                value={foodsToAvoid}
                onChange={(e) => setFoodsToAvoid(e.target.value)}
                placeholder="e.g. mushrooms, cilantro, Brussels sprouts..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button className="btn-secondary flex-1" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                className="btn-primary flex-1"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
              >
                Continue
              </button>
            ) : (
              <button className="btn-primary flex-1" onClick={handleSubmit}>
                Generate My Meal Plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
