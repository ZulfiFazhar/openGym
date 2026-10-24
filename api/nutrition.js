/* Nutrition API - Open Food Facts barcode lookup & AI food analysis */
import * as coachConfig from './coach/config.js';

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

export function buildWizardPrompt(profile = {}) {
  const { weightKg, heightCm, age, gender, activityLevel, goal, diet, weeklyWorkouts } = profile;
  return `You are an elite sports nutritionist. Calculate daily caloric needs and macronutrient distribution for the following profile:
- Weight: ${weightKg || 70} kg
- Height: ${heightCm || 170} cm
- Age: ${age || 25} years
- Biological Sex: ${gender || 'male'}
- Daily Activity Level: ${activityLevel || 'moderate'}
- Weekly Strength Workouts: ${weeklyWorkouts || 3} sessions/week
- Primary Goal: ${goal || 'maintain'} (options: cut/fatloss, maintain, bulk/muscle)
- Dietary Preferences / Notes: ${diet || 'None'}

Return ONLY a valid JSON object in this exact schema without any markdown formatting or extra text:
{
  "bmr": <number, Basal Metabolic Rate in kcal>,
  "tdee": <number, Total Daily Energy Expenditure in kcal>,
  "calories": <number, recommended daily target in kcal>,
  "protein": <number, grams of protein per day>,
  "carbs": <number, grams of carbs per day>,
  "fat": <number, grams of fat per day>,
  "reasoning": "<short explanation in Indonesian of the strategy and macro split in 2-3 sentences>"
}`;
}

export function buildFoodAnalysisPrompt({ query, mode } = {}) {
  if (mode === 'label') {
    return `Analyze this nutrition facts label image. Extract serving size, calories (kcal), protein (g), carbohydrates (g), and fat (g).
Return ONLY a valid JSON object without any markdown formatting or extra text:
{
  "name": "Nutrition Label",
  "serving": "<serving size found, e.g. 1 portion (250ml)>",
  "calories": <number in kcal>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "confidence": 0.95
}`;
  }
  return `Analyze this food dish ${query ? `with description: "${query}"` : 'from the image'}. Identify the meal name, estimate reasonable serving portion, total calories (kcal), and macronutrients (protein, carbs, fat in grams).
Return ONLY a valid JSON object without any markdown formatting or extra text:
{
  "name": "<name of food/dish in Indonesian/English>",
  "serving": "<estimated portion, e.g. 1 porsi (300g)>",
  "calories": <number in kcal>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "confidence": 0.9
}`;
}

export function parseNutritionAiResponse(raw) {
  if (!raw || typeof raw !== 'string') return {};
  const trimmed = raw.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    const obj = JSON.parse(match[0]);
    return {
      name: obj.name || 'Food item',
      calories: Math.round(Number(obj.calories) || 0),
      protein: Math.round((Number(obj.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(obj.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(obj.fat) || 0) * 10) / 10,
      serving: obj.serving || '1 portion',
      confidence: typeof obj.confidence === 'number' ? obj.confidence : 0.9,
      ...(obj.bmr != null ? { bmr: Math.round(Number(obj.bmr)) } : {}),
      ...(obj.tdee != null ? { tdee: Math.round(Number(obj.tdee)) } : {}),
      ...(obj.reasoning ? { reasoning: String(obj.reasoning) } : {})
    };
  } catch (err) {
    console.error('Failed to parse AI nutrition response:', err);
    return {};
  }
}

export async function callAiCompletion({ prompt, imageBase64, uid }) {
  const cfg = coachConfig.load();
  const c = coachConfig.credentialFor(uid);
  const provider = cfg.provider || 'compatible';
  const token = c.ok && c.auth ? c.auth.token : null;
  const baseUrl = cfg.providerOptions?.[provider]?.baseUrl || 'https://ai.zulfifazhar.dev/v1';
  const model = cfg.models?.[provider] || 'oc/glm-5.3-flash-free';

  const userContent = [];
  if (prompt) userContent.push({ type: 'text', text: prompt });
  if (imageBase64) {
    const url = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    userContent.push({ type: 'image_url', image_url: { url } });
  }

  const messages = [
    { role: 'system', content: 'You are an expert sports nutritionist and dietitian. Respond ONLY with pure valid JSON matching the requested structure.' },
    { role: 'user', content: userContent.length === 1 && userContent[0].type === 'text' ? userContent[0].text : userContent }
  ];

  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI request failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return parseNutritionAiResponse(text);
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
    },

    'POST /api/nutrition/wizard': async (req, res) => {
      const user = readSession(req);
      if (!user) return json(res, 401, { error: 'not signed in' });
      const body = await readBody(req);
      const profile = body?.profile || {};
      const prompt = buildWizardPrompt(profile);
      try {
        const result = await callAiCompletion({ prompt, uid: user.id });
        if (result && result.calories) {
          return json(res, 200, { ok: true, data: result });
        }
        throw new Error('Incomplete AI response');
      } catch (err) {
        console.warn('AI wizard error, falling back to formula calculation:', err.message);
        // Fallback formula Mifflin-St Jeor
        const w = Number(profile.weightKg) || 70;
        const h = Number(profile.heightCm) || 170;
        const a = Number(profile.age) || 25;
        const isMale = (profile.gender || 'male') === 'male';
        const bmr = Math.round(10 * w + 6.25 * h - 5 * a + (isMale ? 5 : -161));
        const mult = profile.activityLevel === 'sedentary' ? 1.2
          : profile.activityLevel === 'light' ? 1.375
          : profile.activityLevel === 'very_active' ? 1.725 : 1.55;
        const tdee = Math.round(bmr * mult);
        const adjustment = profile.goal === 'cut' ? -400 : profile.goal === 'bulk' ? 300 : 0;
        const calories = tdee + adjustment;
        const protein = Math.round(w * 2.0);
        const fat = Math.round((calories * 0.25) / 9);
        const carbs = Math.max(0, Math.round((calories - (protein * 4 + fat * 9)) / 4));
        return json(res, 200, {
          ok: true,
          data: {
            bmr,
            tdee,
            calories,
            protein,
            carbs,
            fat,
            reasoning: `Target dihitung berbasis formula Mifflin-St Jeor dengan penyesuaian target ${profile.goal || 'maintain'} (${calories} kcal).`
          }
        });
      }
    },

    'POST /api/nutrition/analyze': async (req, res) => {
      const user = readSession(req);
      if (!user) return json(res, 401, { error: 'not signed in' });
      const body = await readBody(req);
      const query = body?.query || '';
      const imageBase64 = body?.imageBase64 || null;
      const mode = body?.mode || 'food';
      const prompt = buildFoodAnalysisPrompt({ query, mode });
      try {
        const result = await callAiCompletion({ prompt, imageBase64, uid: user.id });
        if (result && result.name && result.calories != null) {
          return json(res, 200, { ok: true, item: result });
        }
        throw new Error('Incomplete food analysis response');
      } catch (err) {
        console.error('AI food analysis error:', err.message);
        return json(res, 500, { ok: false, error: err.message });
      }
    }
  };
}
