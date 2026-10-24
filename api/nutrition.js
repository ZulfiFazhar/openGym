/* Nutrition API - Open Food Facts barcode lookup & AI food analysis */

function round(num) {
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function round1(num) {
  return Number.isFinite(num) ? Math.round(num * 10) / 10 : 0;
}

export function parseServingGrams(servingStr) {
  if (!servingStr || typeof servingStr !== 'string') return 100;
  const m = servingStr.match(/(\d+(?:\.\d+)?)\s*g/i);
  return m ? parseFloat(m[1]) : 100;
}

export function parseOpenFoodFacts(data) {
  if (!data || data.status !== 1 || !data.product) {
    return { found: false };
  }
  const p = data.product;
  const n = p.nutriments || {};
  const servingSize = p.serving_size || p.serving_quantity || '100g';
  const grams = parseServingGrams(String(servingSize));
  const scale = grams / 100;

  let calories = 0, protein = 0, carbs = 0, fat = 0;

  if (n['energy-kcal_serving'] != null) {
    calories = round(Number(n['energy-kcal_serving']));
    protein = round1(Number(n.proteins_serving || 0));
    carbs = round1(Number(n.carbohydrates_serving || 0));
    fat = round1(Number(n.fat_serving || 0));
  } else {
    const kcal100 = Number(n['energy-kcal_100g'] ?? (n['energy_100g'] ? Number(n['energy_100g']) / 4.184 : 0));
    calories = round(kcal100 * scale);
    protein = round1(Number(n.proteins_100g || 0) * scale);
    carbs = round1(Number(n.carbohydrates_100g || 0) * scale);
    fat = round1(Number(n.fat_100g || 0) * scale);
  }

  const name = p.product_name_id || p.product_name_en || p.product_name || 'Unknown Snack';

  return {
    found: true,
    item: {
      name,
      calories,
      protein,
      carbs,
      fat,
      serving: String(servingSize)
    }
  };
}

export async function fetchBarcodeFromOpenFoodFacts(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'openGym-NutritionTracker/1.4.1 (gym.zulfifazhar.dev)' }
    });
    if (!res.ok) return { found: false };
    const data = await res.json();
    return parseOpenFoodFacts(data);
  } catch (err) {
    console.error('OpenFoodFacts fetch error:', err);
    return { found: false, error: err.message };
  }
}

export function nutritionRoutes({ json, readBody, readSession }) {
  return {
    'GET /api/nutrition/barcode': async (req, res) => {
      const user = readSession(req);
      if (!user) return json(res, 401, { error: 'not signed in' });
      const url = new URL(req.url, 'http://x');
      const code = url.searchParams.get('code') || '';
      if (!code) return json(res, 400, { error: 'missing barcode' });
      const result = await fetchBarcodeFromOpenFoodFacts(code);
      return json(res, 200, result);
    }
  };
}
