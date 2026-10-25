import React, { useState, useMemo } from 'react'
import LineChart from '../components/LineChart.jsx'
import Icon from '../components/Icon.jsx'
import { Button, Segmented } from '../components/ui.jsx'
import { t } from '../lib/i18n.js'
import { fmtNum, fmtDate } from '../lib/format.js'

const rangeOptions = () => [
  { value: 30, label: '1M' },
  { value: 90, label: '3M' },
  { value: 365, label: '1Y' },
  { value: 0, label: t('All') },
]

export default function StatsNutrition({ S, onOpenWizard, onOpenLog }) {
  const [range, setRange] = useState(30)
  const target = S?.nutritionTarget
  const targetCal = target ? Number(target.calories) || 0 : null
  const logs = S?.nutritionLogs || []
  const bw = S?.bodyweight || []

  const now = Date.now()
  const rangeStart = range ? now - range * 86400000 : 0

  // Group logs by date
  const dailyData = useMemo(() => {
    const grouped = {}
    logs.forEach(log => {
      if (!log || !log.d) return
      const tstamp = new Date(log.d).getTime()
      if (rangeStart && tstamp < rangeStart) return
      if (!grouped[log.d]) {
        grouped[log.d] = { d: log.d, t: tstamp, calories: 0, protein: 0, carbs: 0, fat: 0, items: [] }
      }
      grouped[log.d].calories += (Number(log.calories) || 0)
      grouped[log.d].protein += (Number(log.protein) || 0)
      grouped[log.d].carbs += (Number(log.carbs) || 0)
      grouped[log.d].fat += (Number(log.fat) || 0)
      grouped[log.d].items.push(log)
    })
    return Object.values(grouped).sort((a, b) => a.d.localeCompare(b.d))
  }, [logs, rangeStart])

  // Chart points for LineChart
  const chartPoints = useMemo(() => {
    return dailyData.map(d => ({
      t: d.t,
      y: d.calories,
      d: d.d,
    }))
  }, [dailyData])

  // Summary Metrics
  const totalDays = dailyData.length
  const avgCalories = totalDays > 0 ? Math.round(dailyData.reduce((acc, d) => acc + d.calories, 0) / totalDays) : 0
  const avgProtein = totalDays > 0 ? Math.round(dailyData.reduce((acc, d) => acc + d.protein, 0) / totalDays) : 0
  const avgCarbs = totalDays > 0 ? Math.round(dailyData.reduce((acc, d) => acc + d.carbs, 0) / totalDays) : 0
  const avgFat = totalDays > 0 ? Math.round(dailyData.reduce((acc, d) => acc + d.fat, 0) / totalDays) : 0

  // Compliance: % of days within ±15% of target
  const compliantDays = targetCal > 0
    ? dailyData.filter(d => Math.abs(d.calories - targetCal) <= targetCal * 0.15).length
    : 0
  const compliancePct = totalDays > 0 && targetCal > 0 ? Math.round((compliantDays / totalDays) * 100) : 0

  // Bodyweight correlation in the same timeframe
  const bwInPeriod = useMemo(() => {
    return bw.filter(b => {
      const tstamp = b.t || new Date(b.d).getTime()
      return !rangeStart || tstamp >= rangeStart
    }).sort((a, b) => (a.t || new Date(a.d).getTime()) - (b.t || new Date(b.d).getTime()))
  }, [bw, rangeStart])

  const bwDelta = bwInPeriod.length >= 2
    ? Number((bwInPeriod[bwInPeriod.length - 1].w - bwInPeriod[0].w).toFixed(1))
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Calorie Trend Card */}
      <div className="card">
        <div className="row between" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>{t('Calorie Intake')}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button size="xs" variant="tinted" icon="sparkles" onClick={onOpenWizard}>
              {target ? `${fmtNum(targetCal)} kcal` : t('Set Target')}
            </Button>
            <Button size="xs" variant="primary" icon="plus" onClick={onOpenLog}>
              {t('Log')}
            </Button>
          </div>
        </div>

        <Segmented className="seg-range" value={range} onChange={setRange} options={rangeOptions()} />

        <div className="chart" style={{ marginTop: 8 }}>
          {chartPoints.length > 0 ? (
            <LineChart points={chartPoints} h={160} unit="kcal" goal={targetCal} color="var(--acc)" />
          ) : (
            <div className="empty small" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--label-2)' }}>
              {t('No nutrition logs in this period. Log your food to see the trend.')}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--label-2)' }}>{t('Average Daily Intake')}</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: 'var(--acc)' }}>
            {avgCalories} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--label-2)' }}>kcal</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--label-2)', marginTop: 4 }}>
            {targetCal ? `${avgCalories >= targetCal ? '+' : ''}${avgCalories - targetCal} kcal ${t('vs target')}` : t('No target set')}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--label-2)' }}>{t('Target Compliance')}</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: compliancePct >= 70 ? 'var(--acc)' : '#fbbf24' }}>
            {compliancePct}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--label-2)', marginTop: 4 }}>
            {compliantDays} / {totalDays} {t('days on target')}
          </div>
        </div>
      </div>

      {/* Average Daily Macros */}
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>{t('Average Macronutrient Intake')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--label-2)' }}>Protein</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>{avgProtein}g</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--label-2)' }}>Carbs</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24', marginTop: 2 }}>{avgCarbs}g</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--label-2)' }}>Fat</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171', marginTop: 2 }}>{avgFat}g</div>
          </div>
        </div>
      </div>

      {/* Weight & Energy Correlation (if weight data exists) */}
      {bwInPeriod.length >= 2 && (
        <div className="card">
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700 }}>{t('Weight & Calorie Correlation')}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 19,
              background: bwDelta <= 0 ? 'var(--acc-soft)' : 'rgba(248, 113, 113, 0.15)',
              color: bwDelta <= 0 ? 'var(--acc)' : '#f87171',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="target" size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {bwDelta > 0 ? `+${bwDelta}` : bwDelta} {S?.unit || 'kg'} in this period
              </div>
              <div style={{ fontSize: 12, color: 'var(--label-2)', marginTop: 2 }}>
                {targetCal && avgCalories > targetCal
                  ? t('Average intake was in surplus relative to your target.')
                  : targetCal && avgCalories < targetCal
                  ? t('Average intake was in deficit relative to your target.')
                  : t('Intake aligns closely with your energy expenditure.')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Food Log History */}
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>{t('Food Log History')}</h3>
        {dailyData.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dailyData.slice().reverse().map(day => (
              <div key={day.d} style={{ borderBottom: '1px solid var(--sep, rgba(255,255,255,0.08))', paddingBottom: 10 }}>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtDate(day.d, true)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--acc)' }}>{day.calories} kcal</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {day.items.map(it => (
                    <div key={it.id || it.name} className="row between" style={{ fontSize: 12, color: 'var(--label-2)' }}>
                      <span>{it.name} <span style={{ opacity: 0.6 }}>({it.meal || 'food'})</span></span>
                      <span>{it.calories} kcal · P:{Math.round(it.protein || 0)}g</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--label-2)', fontSize: 13 }}>{t('No food items logged yet.')}</div>
        )}
      </div>
    </div>
  )
}
