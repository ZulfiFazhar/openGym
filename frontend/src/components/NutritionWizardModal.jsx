import React, { useState } from 'react'
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
          reasoning: 'Rekomendasi dihitung menggunakan kalkulasi offline standar Mifflin-St Jeor.'
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
    <div className="wiz-overlay" onClick={onClose}>
      <div className="wiz-sheet" onClick={e => e.stopPropagation()}>
        <div className="wiz-header">
          <div className="wiz-title">
            <Icon name="sparkles" size={18} />
            <span>AI Calorie Wizard</span>
          </div>
          <button className="wiz-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="wiz-progress">
          <div className="wiz-progress-bar" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        <div className="wiz-body">
          {step === 1 && (
            <>
              <div className="wiz-step-badge">Langkah 1/5 • Profil Fisik</div>
              <div className="wiz-step-desc">Masukkan informasi fisik dasar untuk menghitung laju metabolisme dasar (BMR) Anda.</div>

              <div className="wiz-grid-2">
                <div className="wiz-field">
                  <label>Berat Badan (kg)</label>
                  <input
                    type="number"
                    value={profile.weightKg}
                    onChange={e => setProfile({ ...profile, weightKg: Number(e.target.value) })}
                    min="30" max="300"
                  />
                </div>
                <div className="wiz-field">
                  <label>Tinggi Badan (cm)</label>
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
                  <label>Umur (tahun)</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={e => setProfile({ ...profile, age: Number(e.target.value) })}
                    min="12" max="100"
                  />
                </div>
                <div className="wiz-field">
                  <label>Jenis Kelamin</label>
                  <select
                    value={profile.gender}
                    onChange={e => setProfile({ ...profile, gender: e.target.value })}
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="wiz-step-badge">Langkah 2/5 • Aktivitas & Olahraga</div>
              <div className="wiz-step-desc">Tentukan seberapa aktif aktivitas fisik Anda sehari-hari untuk menghitung Total Daily Energy Expenditure (TDEE).</div>

              <div
                className={`wiz-option-card ${profile.activityLevel === 'sedentary' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, activityLevel: 'sedentary' })}
              >
                <div>
                  <h4>Sedentary (Duduk & Santai)</h4>
                  <p>Banyak duduk di meja kerja, minim pergerakan fisik harian.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.activityLevel === 'light' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, activityLevel: 'light' })}
              >
                <div>
                  <h4>Ringan (Light Active)</h4>
                  <p>Aktivitas harian ringan atau latihan 1-3 hari per minggu.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.activityLevel === 'moderate' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, activityLevel: 'moderate' })}
              >
                <div>
                  <h4>Moderat (Moderate Active)</h4>
                  <p>Latihan beban/kardio intensitas sedang 3-5 hari per minggu.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.activityLevel === 'very_active' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, activityLevel: 'very_active' })}
              >
                <div>
                  <h4>Sangat Aktif (Heavy / Athlete)</h4>
                  <p>Latihan keras hampir setiap hari atau pekerjaan fisik berat.</p>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="wiz-step-badge">Langkah 3/5 • Target Kebugaran</div>
              <div className="wiz-step-desc">Pilih target tubuh Anda agar AI dapat menentukan defisit atau surplus kalori yang tepat.</div>

              <div
                className={`wiz-option-card ${profile.goal === 'cut' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, goal: 'cut' })}
              >
                <div>
                  <h4>Fat Loss / Cutting</h4>
                  <p>Mengurangi lemak tubuh dengan defisit kalori terukur dan menjaga massa otot.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.goal === 'maintain' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, goal: 'maintain' })}
              >
                <div>
                  <h4>Maintenance / Body Recomp</h4>
                  <p>Menjaga berat badan tetap stabil sambil meningkatkan komposisi otot.</p>
                </div>
              </div>

              <div
                className={`wiz-option-card ${profile.goal === 'bulk' ? 'selected' : ''}`}
                onClick={() => setProfile({ ...profile, goal: 'bulk' })}
              >
                <div>
                  <h4>Muscle Gain / Bulking</h4>
                  <p>Menambah massa otot optimal dengan surplus kalori bersih (lean bulk).</p>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="wiz-step-badge">Langkah 4/5 • Preferensi & Catatan Diet</div>
              <div className="wiz-step-desc">Beri tahu AI jika ada preferensi makanan tertentu atau catatan khusus (opsional).</div>

              <div className="wiz-field">
                <label>Preferensi Pola Makan</label>
                <select
                  value={profile.diet}
                  onChange={e => setProfile({ ...profile, diet: e.target.value })}
                >
                  <option value="">Standar Seimbang</option>
                  <option value="high_protein">Tinggi Protein (High Protein)</option>
                  <option value="low_carb">Rendah Karbohidrat (Low Carb)</option>
                  <option value="intermittent_fasting">Intermittent Fasting</option>
                  <option value="vegetarian">Vegetarian / Halal</option>
                </select>
              </div>

              <div className="wiz-field">
                <label>Catatan Tambahan untuk AI</label>
                <textarea
                  rows="3"
                  placeholder="Misal: Saya ingin fokus mempercepat cutting di perut tanpa kehilangan tenaga latihan..."
                  value={profile.notes || ''}
                  onChange={e => setProfile({ ...profile, notes: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="wiz-step-badge">Langkah 5/5 • Hasil Rekomendasi AI</div>

              {loading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Icon name="sparkles" size={32} />
                  <p style={{ marginTop: 14, color: 'rgba(255,255,255,0.8)' }}>
                    AI Coach sedang menganalisis profil dan menghitung strategi kalori...
                  </p>
                </div>
              ) : result ? (
                <div className="wiz-result-card">
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Target Kalori Harian</div>
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
                      <div className="wiz-macro-lbl">Karbo</div>
                    </div>
                    <div className="wiz-macro-box">
                      <div className="wiz-macro-val" style={{ color: '#f87171' }}>{result.fat}g</div>
                      <div className="wiz-macro-lbl">Lemak</div>
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
              Kembali
            </button>
          )}
          {step < 5 ? (
            <button className="wiz-btn-next" onClick={handleNext}>
              <span>{step === 4 ? 'Hitung dengan AI' : 'Lanjut'}</span>
              <Icon name="chevronRight" size={16} />
            </button>
          ) : (
            <button className="wiz-btn-apply" onClick={handleApply} disabled={loading || !result}>
              <Icon name="check" size={16} />
              <span>Terapkan ke Target Saya</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
