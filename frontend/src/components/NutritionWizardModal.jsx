import React, { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore.js'
import { calculateMifflinStJeor } from '../lib/nutrition-calc.js'
import { fetchWizardTarget } from '../lib/nutrition-api.js'
import Icon from './Icon.jsx'
import './NutritionWizardModal.css'

export default function NutritionWizardModal({ open, onClose }) {
  const S = useStore(s => s.S)
  const setNutritionTarget = useStore(s => s.setNutritionTarget)

  // Pre-fill from existing store data if present
  const latestWeight = S.bodyweight && S.bodyweight.length ? S.bodyweight[S.bodyweight.length - 1].w : 70

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    weightKg: latestWeight || 70,
    heightCm: 170,
    age: 25,
    gender: S.body === 'female' ? 'female' : 'male',
    activityLevel: 'moderate',
    weeklyWorkouts: 4,
    goal: 'maintain',
    diet: ''
  })

  const [result, setResult] = useState(null)

  const sheetRef = useRef(null)
  const drag = useRef({ startY: null, startX: null, delta: 0, lastY: 0, lastT: 0, vy: 0, axis: null })

  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onTouchStart = e => {
    const t = e.touches[0]
    if (e.target.closest('input, textarea, select, button, label')) return
    drag.current = { startY: t.clientY, startX: t.clientX, delta: 0, lastY: t.clientY, lastT: performance.now(), vy: 0, axis: null }
  }

  const onTouchMove = e => {
    const el = sheetRef.current, d = drag.current
    if (d.startY === null || !el) return
    const t = e.touches[0]
    const dx = t.clientX - d.startX, dy = t.clientY - d.startY
    if (d.axis === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      d.axis = Math.abs(dy) > Math.abs(dx) * 1.2 ? 'y' : 'x'
    }
    if (d.axis === 'x') return
    const now = performance.now()
    if (now > d.lastT) { d.vy = (t.clientY - d.lastY) / (now - d.lastT); d.lastY = t.clientY; d.lastT = now }
    if (dy > 0 && el.scrollTop <= 0) {
      d.delta = dy
      el.style.transition = 'none'
      el.style.transform = `translateY(${dy}px)`
    } else if (d.delta > 0) {
      d.delta = 0
      el.style.transform = 'translateY(0px)'
    }
  }

  const onTouchEnd = () => {
    const el = sheetRef.current, d = drag.current
    if (d.startY === null || !el) return
    el.style.transition = 'transform .2s'
    const flick = d.delta > 30 && d.vy > 0.6
    if (d.delta > 80 || flick) {
      el.style.transform = 'translateY(110%)'
      setTimeout(onClose, 180)
    } else {
      el.style.transform = ''
    }
    drag.current = { startY: null, startX: null, delta: 0, lastY: 0, lastT: 0, vy: 0, axis: null }
  }

  if (!open) return null

  const handleNext = async () => {
    if (step < 4) {
      setStep(s => s + 1)
      return
    }

    if (step === 4) {
      setStep(5)
      setLoading(true)
      try {
        const res = await fetchWizardTarget(profile)
        setResult(res)
      } catch (err) {
        console.warn('AI calculation failed, using local MSJ formula', err)
        const local = calculateMifflinStJeor(profile)
        setResult({
          bmr: local.bmr,
          tdee: local.tdee,
          calories: local.targetCalories,
          protein: local.protein,
          carbs: local.carbs,
          fat: local.fat,
          reasoning: 'Recommendation calculated using the offline standard Mifflin-St Jeor formula.'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1)
  }

  const handleApply = () => {
    if (!result) return
    setNutritionTarget({
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      source: 'wizard',
      profile: { ...profile }
    })
    onClose()
  }

  return (
    <div className="wiz-overlay">
      <div className="mback" onClick={onClose} />
      <div
        className="sheet wiz-sheet"
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="grab"
          onClick={onClose}
          role="button"
          tabIndex={0}
          aria-label="Close drawer"
        />
        <div className="wiz-header-title">
          <Icon name="sparkles" size={18} style={{ color: 'var(--acc, #10b981)' }} />
          <h3>AI Calorie Wizard</h3>
        </div>

        <div className="wiz-progress">
          <div className="wiz-progress-bar" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        <div className="wiz-body">
          {step === 1 && (
            <>
              <div className="wiz-step-badge">Step 1/5 • Physical Profile</div>
              <div className="wiz-step-desc">Enter basic physical metrics to calculate your Basal Metabolic Rate (BMR).</div>

              <div className="wiz-grid-2">
                <div className="wiz-field">
                  <label>Body Weight (kg)</label>
                  <input
                    type="number"
                    value={profile.weightKg}
                    onChange={e => setProfile({ ...profile, weightKg: Number(e.target.value) })}
                    min="30" max="300"
                  />
                </div>
                <div className="wiz-field">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    value={profile.heightCm}
                    onChange={e => setProfile({ ...profile, heightCm: Number(e.target.value) })}
                    min="100" max="250"
                  />
                </div>
              </div>

              <div className="wiz-grid-2">
                <div className="wiz-field">
                  <label>Age (years)</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={e => setProfile({ ...profile, age: Number(e.target.value) })}
                    min="12" max="100"
                  />
                </div>
                <div className="wiz-field">
                  <label>Biological Sex</label>
                  <select
                    value={profile.gender}
                    onChange={e => setProfile({ ...profile, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="wiz-step-badge">Step 2/5 • Activity & Exercise</div>
              <div className="wiz-step-desc">Select your daily physical activity level to calculate your Total Daily Energy Expenditure (TDEE).</div>

              <div
                className={`wiz-option-card ${profile.activityLevel === 'sedentary' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, activityLevel: 'sedentary' })}
              >
                <div>
                  <h4>Sedentary (Little or no exercise)</h4>
                  <p>Mostly sitting at a desk, minimal daily physical movement.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.activityLevel === 'light' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, activityLevel: 'light' })}
              >
                <div>
                  <h4>Lightly Active</h4>
                  <p>Light daily activity or workouts 1-3 days per week.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.activityLevel === 'moderate' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, activityLevel: 'moderate' })}
              >
                <div>
                  <h4>Moderately Active</h4>
                  <p>Moderate intensity training or cardio 3-5 days per week.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.activityLevel === 'very_active' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, activityLevel: 'very_active' })}
              >
                <div>
                  <h4>Very Active (Heavy / Athlete)</h4>
                  <p>Hard training almost every day or physical labor job.</p>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="wiz-step-badge">Step 3/5 • Fitness Goal</div>
              <div className="wiz-step-desc">Choose your fitness goal so AI can determine the right calorie deficit or surplus.</div>

              <div
                className={`wiz-option-card ${profile.goal === 'cut' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, goal: 'cut' })}
              >
                <div>
                  <h4>Fat Loss / Cutting</h4>
                  <p>Lose body fat with a controlled caloric deficit while preserving muscle mass.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.goal === 'maintain' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, goal: 'maintain' })}
              >
                <div>
                  <h4>Maintenance / Body Recomp</h4>
                  <p>Maintain stable weight while improving muscle definition and body composition.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.goal === 'bulk' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, goal: 'bulk' })}
              >
                <div>
                  <h4>Muscle Gain / Bulking</h4>
                  <p>Build muscle effectively with a clean caloric surplus (lean bulk).</p>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="wiz-step-badge">Step 4/5 • Dietary Preferences & Notes</div>
              <div className="wiz-step-desc">Let AI know about any dietary preferences or specific requirements (optional).</div>

              <div className="wiz-field">
                <label>Dietary Preference</label>
                <select
                  value={profile.diet}
                  onChange={e => setProfile({ ...profile, diet: e.target.value })}
                >
                  <option value="">Standard / Balanced</option>
                  <option value="high_protein">High Protein</option>
                  <option value="low_carb">Low Carb</option>
                  <option value="intermittent_fasting">Intermittent Fasting</option>
                  <option value="vegetarian">Vegetarian / Halal</option>
                </select>
              </div>

              <div className="wiz-field">
                <label>Additional Notes for AI</label>
                <textarea
                  rows="3"
                  placeholder="e.g., Focusing on cutting fat while preserving strength during workouts..."
                  value={profile.notes || ''}
                  onChange={e => setProfile({ ...profile, notes: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="wiz-step-badge">Step 5/5 • AI Recommended Target</div>

              {loading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Icon name="sparkles" size={32} />
                  <p style={{ marginTop: 14, color: 'rgba(255,255,255,0.8)' }}>
                    AI Coach is analyzing your profile and formulating a calorie strategy...
                  </p>
                </div>
              ) : result ? (
                <div className="wiz-result-card">
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Daily Calorie Target</div>
                  <div className="wiz-result-calories">{result.calories} kcal</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    BMR: {result.bmr} kcal • TDEE: {result.tdee} kcal
                  </div>

                  <div className="wiz-macro-grid">
                    <div className="wiz-macro-box">
                      <div className="wiz-macro-val" style={{ color: '#38bdf8' }}>{result.protein}g</div>
                      <div className="wiz-macro-lbl">Protein</div>
                    </div>
                    <div className="wiz-macro-box">
                      <div className="wiz-macro-val" style={{ color: '#fbbf24' }}>{result.carbs}g</div>
                      <div className="wiz-macro-lbl">Carbs</div>
                    </div>
                    <div className="wiz-macro-box">
                      <div className="wiz-macro-val" style={{ color: '#f87171' }}>{result.fat}g</div>
                      <div className="wiz-macro-lbl">Fat</div>
                    </div>
                  </div>

                  {result.reasoning && (
                    <div className="wiz-ai-note">
                      "{result.reasoning}"
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="wiz-footer">
          {step > 1 && step < 5 && (
            <button className="wiz-btn-back" onClick={handleBack}>
              Back
            </button>
          )}
          {step < 5 ? (
            <button className="wiz-btn-next" onClick={handleNext}>
              <span>{step === 4 ? 'Calculate with AI' : 'Next'}</span>
              <Icon name="chevronRight" size={16} />
            </button>
          ) : (
            <button className="wiz-btn-apply" onClick={handleApply} disabled={loading || !result}>
              <Icon name="check" size={16} />
              <span>Apply to My Target</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
