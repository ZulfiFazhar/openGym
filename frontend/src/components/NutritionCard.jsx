import React from 'react'
import { useStore } from '../store/useStore.js'
import Icon from './Icon.jsx'
import { Button } from './ui.jsx'

export default function NutritionCard({ onOpenLog, onOpenWizard }) {
  const S = useStore(s => s.S)
  const today = new Date().toISOString().slice(0, 10)

  const target = S.nutritionTarget
  const todayLogs = (S.nutritionLogs || []).filter(e => e && e.d === today)

  const consumedCalories = todayLogs.reduce((sum, e) => sum + (Number(e.calories) || 0), 0)
  const consumedProtein = todayLogs.reduce((sum, e) => sum + (Number(e.protein) || 0), 0)
  const consumedCarbs = todayLogs.reduce((sum, e) => sum + (Number(e.carbs) || 0), 0)
  const consumedFat = todayLogs.reduce((sum, e) => sum + (Number(e.fat) || 0), 0)

  const targetCal = target ? Number(target.calories) || 2000 : null
  const targetP = target ? Number(target.protein) || 140 : null
  const targetC = target ? Number(target.carbs) || 220 : null
  const targetF = target ? Number(target.fat) || 60 : null

  const pct = targetCal ? Math.min(100, Math.round((consumedCalories / targetCal) * 100)) : 0
  const remainingCal = targetCal ? targetCal - consumedCalories : null

  const fmt = (n) => Number(n).toLocaleString()

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <Icon name="sparkles" size={20} style={{ color: 'var(--acc, #10b981)' }} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Today's Nutrition</h2>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button size="sm" variant="ghost" onClick={onOpenWizard}>
            {target ? 'Edit Target' : 'AI Target'}
          </Button>
          <Button size="sm" variant="primary" icon="plus" onClick={onOpenLog}>
            Log Food
          </Button>
        </div>
      </div>

      {targetCal ? (
        <>
          <div className="row between" style={{ alignItems: 'baseline', marginBottom: 6 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {fmt(consumedCalories)} <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>/ {fmt(targetCal)} kcal</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: remainingCal >= 0 ? 'var(--acc, #10b981)' : '#f87171' }}>
              {remainingCal >= 0 ? `${fmt(remainingCal)} kcal left` : `${fmt(Math.abs(remainingCal))} kcal over`}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 8, width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 9999, overflow: 'hidden', marginBottom: 14 }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: remainingCal < 0 ? '#f87171' : 'var(--acc, #10b981)',
                borderRadius: 9999,
                transition: 'width 0.4s ease'
              }}
            />
          </div>

          {/* Macro breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 10px', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Protein</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: '#38bdf8' }}>
                {Math.round(consumedProtein)}g <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/ {targetP}g</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 10px', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Carbs</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: '#fbbf24' }}>
                {Math.round(consumedCarbs)}g <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/ {targetC}g</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 10px', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Fat</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: '#f87171' }}>
                {Math.round(consumedFat)}g <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/ {targetF}g</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
            No daily calorie target set. Calculate your daily energy needs (TDEE/BMR) with the AI Wizard now.
          </div>
          <Button variant="primary" icon="sparkles" onClick={onOpenWizard}>
            Start AI Calorie Wizard
          </Button>
        </div>
      )}
    </div>
  )
}
