import React from 'react'
import Icon from '../components/Icon.jsx'
import { Button } from '../components/ui.jsx'
import { t } from '../lib/i18n.js'

export default function PlanNutrition({ S, onOpenWizard, onOpenLog }) {
  const target = S?.nutritionTarget
  const targetCal = target ? Number(target.calories) || 0 : null
  const targetP = target ? Number(target.protein) || 0 : 0
  const targetC = target ? Number(target.carbs) || 0 : 0
  const targetF = target ? Number(target.fat) || 0 : 0

  const fmt = n => Number(n).toLocaleString()

  if (!targetCal) {
    return (
      <div className="card" style={{ padding: '24px 18px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24,
            background: 'var(--acc-soft)', color: 'var(--acc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="sparkles" size={24} />
          </div>
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>{t('No daily nutrition target set')}</h2>
        <p style={{ margin: '0 auto 18px', maxWidth: 420, color: 'var(--label-2, rgba(255,255,255,0.7))', fontSize: 14, lineHeight: 1.5 }}>
          {t('Set your personal energy goals, calculate BMR/TDEE, and establish macro splits designed for your workout routine.')}
        </p>
        <Button variant="primary" icon="sparkles" onClick={onOpenWizard} style={{ margin: '0 auto' }}>
          {t('Start AI Calorie Wizard')}
        </Button>
      </div>
    )
  }

  // Energy percentage calculation
  const totalMacroCals = (targetP * 4) + (targetC * 4) + (targetF * 9)
  const pctP = totalMacroCals > 0 ? Math.round(((targetP * 4) / totalMacroCals) * 100) : 0
  const pctC = totalMacroCals > 0 ? Math.round(((targetC * 4) / totalMacroCals) * 100) : 0
  const pctF = totalMacroCals > 0 ? Math.round(((targetF * 9) / totalMacroCals) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Target Overview Card */}
      <div className="card">
        <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Icon name="sparkles" size={16} style={{ color: 'var(--acc)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--acc)' }}>
                {target.strategy ? target.strategy.toUpperCase() : 'DAILY TARGET'}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>
              {fmt(targetCal)} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--label-2, rgba(255,255,255,0.6))' }}>kcal / day</span>
            </div>
          </div>
          <Button size="sm" variant="tinted" icon="sparkles" onClick={onOpenWizard}>
            {t('Adjust with AI Wizard')}
          </Button>
        </div>

        {/* Macro split breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 8 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-2, rgba(255,255,255,0.6))', textTransform: 'uppercase' }}>Protein</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>{targetP}g</div>
            <div style={{ fontSize: 11, color: 'var(--label-2, rgba(255,255,255,0.5))', marginTop: 2 }}>{pctP}% cal</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-2, rgba(255,255,255,0.6))', textTransform: 'uppercase' }}>Carbs</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24', marginTop: 2 }}>{targetC}g</div>
            <div style={{ fontSize: 11, color: 'var(--label-2, rgba(255,255,255,0.5))', marginTop: 2 }}>{pctC}% cal</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--label-2, rgba(255,255,255,0.6))', textTransform: 'uppercase' }}>Fat</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171', marginTop: 2 }}>{targetF}g</div>
            <div style={{ fontSize: 11, color: 'var(--label-2, rgba(255,255,255,0.5))', marginTop: 2 }}>{pctF}% cal</div>
          </div>
        </div>

        {target.reasoning && (
          <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid var(--acc)' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
              {target.reasoning}
            </div>
          </div>
        )}
      </div>

      {/* Training vs Rest Day Nutritional Strategy Card */}
      <div className="card">
        <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700 }}>{t('Training & Rest Day Strategy')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ padding: 6, borderRadius: 8, background: 'var(--acc-soft)', color: 'var(--acc)' }}>
              <Icon name="dumbbell" size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t('Workout Days')}</div>
              <div style={{ fontSize: 12, color: 'var(--label-2, rgba(255,255,255,0.65))', lineHeight: 1.4, marginTop: 2 }}>
                {t('Prioritize complex carbohydrates 1-2 hours before training and 25-30g protein immediately post-workout to fuel intensity and muscle recovery.')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: 'var(--label-2, rgba(255,255,255,0.8))' }}>
              <Icon name="moon" size={16} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t('Rest Days')}</div>
              <div style={{ fontSize: 12, color: 'var(--label-2, rgba(255,255,255,0.65))', lineHeight: 1.4, marginTop: 2 }}>
                {t('Keep protein intake high to support muscle protein synthesis, with slightly lower carbohydrates to match reduced energy expenditure.')}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--sep, rgba(255,255,255,0.1))', display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="sm" variant="primary" icon="plus" onClick={onOpenLog}>
            {t('Log Today’s Food')}
          </Button>
        </div>
      </div>
    </div>
  )
}
