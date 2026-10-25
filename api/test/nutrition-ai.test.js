import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNutritionAiResponse, buildWizardPrompt, buildFoodAnalysisPrompt } from '../nutrition.js';

test('parseNutritionAiResponse parses JSON embedded in markdown fences', () => {
  const raw = '```json\n{"calories": 450, "protein": 35, "carbs": 40, "fat": 15, "name": "Steak and Potatoes", "serving": "1 plate"}\n```';
  const parsed = parseNutritionAiResponse(raw);
  assert.equal(parsed.calories, 450);
  assert.equal(parsed.protein, 35);
  assert.equal(parsed.carbs, 40);
  assert.equal(parsed.fat, 15);
  assert.equal(parsed.name, 'Steak and Potatoes');
});

test('parseNutritionAiResponse handles raw JSON string without fences', () => {
  const raw = '{"calories": 250, "protein": 20, "carbs": 30, "fat": 5, "name": "Chicken Rice"}';
  const parsed = parseNutritionAiResponse(raw);
  assert.equal(parsed.calories, 250);
  assert.equal(parsed.name, 'Chicken Rice');
});

test('buildWizardPrompt constructs structured prompt with profile details', () => {
  const profile = {
    weightKg: 75,
    heightCm: 178,
    age: 28,
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'cut',
    diet: 'high protein'
  };
  const prompt = buildWizardPrompt(profile);
  assert.match(prompt, /75/);
  assert.match(prompt, /178/);
  assert.match(prompt, /cut/);
  assert.match(prompt, /JSON/);
});

test('buildFoodAnalysisPrompt specifies mode instructions', () => {
  const foodPrompt = buildFoodAnalysisPrompt({ query: '1 bowl of ramen', mode: 'food' });
  assert.match(foodPrompt, /ramen/);

  const labelPrompt = buildFoodAnalysisPrompt({ mode: 'label' });
  assert.match(labelPrompt, /nutrition facts|label/i);
});

test('estimateFoodFallback provides sensible offline food estimates', async () => {
  const { estimateFoodFallback } = await import('../nutrition.js');
  const res = estimateFoodFallback('1 porsi ayam bakar');
  assert.equal(res.name, '1 porsi ayam bakar');
  assert.ok(res.calories > 300);
  assert.ok(res.protein >= 25);
  assert.match(res.serving, /portion/i);
});
