/* Offline Mifflin-St Jeor BMR, TDEE and Macro calculations */

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,       // Little to no exercise, desk job
  light: 1.375,         // Light exercise 1-3 days/week
  moderate: 1.55,       // Moderate exercise 3-5 days/week
  very_active: 1.725    // Heavy exercise 6-7 days/week
}

export function calculateMacros({ weightKg, calories, proteinMultiplier = 2.0, fatPercent = 0.25 }) {
  const w = Number(weightKg) || 70;
  const cal = Number(calories) || 2000;
  const protein = Math.round(w * proteinMultiplier);
  const fat = Math.round((cal * fatPercent) / 9);
  const remainingCal = Math.max(0, cal - (protein * 4 + fat * 9));
  const carbs = Math.round(remainingCal / 4);
  return { protein, carbs, fat };
}

export function calculateMifflinStJeor({
  weightKg = 70,
  heightCm = 170,
  age = 25,
  gender = 'male',
  activityLevel = 'moderate',
  goal = 'maintain'
}) {
  const w = Math.max(30, Math.min(300, Number(weightKg) || 70));
  const h = Math.max(100, Math.min(250, Number(heightCm) || 170));
  const a = Math.max(12, Math.min(100, Number(age) || 25));
  const isMale = String(gender).toLowerCase() === 'male';

  // Mifflin-St Jeor equation:
  // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + (5 for male, -161 for female)
  const exactBmr = 10 * w + 6.25 * h - 5 * a + (isMale ? 5 : -161);
  const bmr = Math.round(exactBmr);

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  const tdee = Math.round(exactBmr * multiplier);

  let adjustment = 0;
  if (goal === 'cut') adjustment = -400; // ~400 kcal deficit
  else if (goal === 'bulk') adjustment = 300; // ~300 kcal surplus

  const targetCalories = Math.max(1200, tdee + adjustment);
  const macros = calculateMacros({ weightKg: w, calories: targetCalories });

  return {
    bmr,
    tdee,
    targetCalories,
    ...macros
  };
}
