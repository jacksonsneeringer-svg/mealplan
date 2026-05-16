import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MealGen — AI Meal Planner",
  description: "Get a personalized week of meals generated just for you",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
