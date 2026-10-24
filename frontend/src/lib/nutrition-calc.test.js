import { describe, it, expect } from 'vitest'
import { calculateMifflinStJeor, calculateMacros } from './nutrition-calc.js'

describe('calculateMifflinStJeor', () => {
  it('calculates BMR and TDEE accurately for male', () => {
    // 70kg, 175cm, 25yo male
    // BMR = 10 * 70 + 6.25 * 175 - 5 * 25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
    const res = calculateMifflinStJeor({
      weightKg: 70,
      heightCm: 175,
      age: 25,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'maintain'
    })
    expect(res.bmr).toBe(1674)
    expect(res.tdee).toBe(Math.round(1673.75 * 1.55)) // 2594
    expect(res.targetCalories).toBe(res.tdee)
  })

  it('calculates deficit for cut and surplus for bulk', () => {
    const cut = calculateMifflinStJeor({
      weightKg: 80, heightCm: 180, age: 30, gender: 'male', activityLevel: 'light', goal: 'cut'
    })
    const bulk = calculateMifflinStJeor({
      weightKg: 80, heightCm: 180, age: 30, gender: 'male', activityLevel: 'light', goal: 'bulk'
    })
    expect(cut.targetCalories).toBeLessThan(cut.tdee)
    expect(bulk.targetCalories).toBeGreaterThan(bulk.tdee)
  })

  it('calculates macros based on bodyweight and caloric target', () => {
    const macros = calculateMacros({ weightKg: 70, calories: 2400 })
    expect(macros.protein).toBe(140) // 2g/kg * 70
    expect(macros.fat).toBe(67)     // (2400 * 0.25) / 9 = 66.6 -> 67
    expect(macros.carbs).toBe(309)   // (2400 - (140 * 4 + 67 * 9)) / 4 = 1237 / 4 = 309.25 -> 309
  })
})
