/* Frontend Nutrition API client */
import { calculateMifflinStJeor } from './nutrition-calc.js';

export async function fetchBarcodeNutrition(code) {
  try {
    const res = await fetch(`/api/nutrition/barcode?code=${encodeURIComponent(code)}`);
    if (!res.ok) return { found: false, error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    console.warn('Barcode fetch network error:', err);
    return { found: false, error: err.message };
  }
}

export async function fetchWizardTarget(profile) {
  try {
    const res = await fetch('/api/nutrition/wizard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.ok && json.data) return json.data;
    }
  } catch (err) {
    console.warn('AI wizard fetch error, falling back locally:', err);
  }

  // Fallback to offline MSJ formula
  const local = calculateMifflinStJeor(profile);
  let reasoning = 'Recommendation calculated using the offline standard Mifflin-St Jeor formula.';
  if (local.timeline) {
    reasoning += ` Target: ${profile.targetWeightKg} kg (~${local.timeline.estimatedWeeks} weeks projected).`;
  }
  return {
    bmr: local.bmr,
    tdee: local.tdee,
    calories: local.targetCalories,
    protein: local.protein,
    carbs: local.carbs,
    fat: local.fat,
    timeline: local.timeline,
    reasoning
  };
}

export async function analyzeFood({ query, imageBase64, mode = 'food' }) {
  try {
    const res = await fetch('/api/nutrition/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, imageBase64, mode })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { ok: false, error: err.error || `HTTP ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    console.error('Food analysis error:', err);
    return { ok: false, error: err.message };
  }
}
