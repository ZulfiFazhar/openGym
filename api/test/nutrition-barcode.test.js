import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOpenFoodFacts } from '../nutrition.js';

test('parseOpenFoodFacts normalizes product nutriments correctly', () => {
  const mockData = {
    status: 1,
    product: {
      product_name: 'Greek Yogurt',
      nutriments: {
        'energy-kcal_100g': 97,
        proteins_100g: 10,
        carbohydrates_100g: 3.5,
        fat_100g: 5
      },
      serving_size: '150g'
    }
  };
  const result = parseOpenFoodFacts(mockData);
  assert.equal(result.found, true);
  assert.equal(result.item.name, 'Greek Yogurt');
  assert.equal(result.item.calories, 146); // 97 * 1.5 = 145.5 -> 146
  assert.equal(result.item.protein, 15);   // 10 * 1.5 = 15
  assert.equal(result.item.carbs, 5.3);    // 3.5 * 1.5 = 5.25 -> 5.3
  assert.equal(result.item.fat, 7.5);      // 5 * 1.5 = 7.5
});

test('parseOpenFoodFacts handles product not found', () => {
  const mockData = { status: 0 };
  const result = parseOpenFoodFacts(mockData);
  assert.equal(result.found, false);
});

test('parseOpenFoodFacts handles direct serving fields', () => {
  const mockData = {
    status: 1,
    product: {
      product_name: 'Protein Bar',
      nutriments: {
        'energy-kcal_serving': 210,
        proteins_serving: 20,
        carbohydrates_serving: 22,
        fat_serving: 7
      },
      serving_size: '60g'
    }
  };
  const result = parseOpenFoodFacts(mockData);
  assert.equal(result.found, true);
  assert.equal(result.item.calories, 210);
  assert.equal(result.item.protein, 20);
});
