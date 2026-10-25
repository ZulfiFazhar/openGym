import React, { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { fetchBarcodeNutrition, analyzeFood } from '../lib/nutrition-api.js'
import Icon from './Icon.jsx'
import BarcodeScannerView from './BarcodeScannerView.jsx'
import './FoodLogger.css'

export default function FoodLoggerSheet({ open, onClose, date }) {
  const S = useStore(s => s.S)
  const addNutritionLog = useStore(s => s.addNutritionLog)
  const deleteNutritionLog = useStore(s => s.deleteNutritionLog)

  const today = date || new Date().toISOString().slice(0, 10)
  const logs = (S.nutritionLogs || []).filter(e => e && e.d === today)

  const totalCalories = logs.reduce((sum, item) => sum + (Number(item.calories) || 0), 0)
  const totalProtein = logs.reduce((sum, item) => sum + (Number(item.protein) || 0), 0)
  const totalCarbs = logs.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0)
  const totalFat = logs.reduce((sum, item) => sum + (Number(item.fat) || 0), 0)

  // Mode: null | 'text' | 'photo' | 'barcode'
  const [activeMode, setActiveMode] = useState(null)
  const [textQuery, setTextQuery] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [reviewItem, setReviewItem] = useState(null)
  const [selectedMeal, setSelectedMeal] = useState('lunch')
  const [statusMessage, setStatusMessage] = useState('')

  if (!open) return null

  const handleTextSubmit = async (e) => {
    e.preventDefault()
    if (!textQuery.trim()) return
    setAnalyzing(true)
    setStatusMessage('Analyzing food with AI...')
    try {
      const res = await analyzeFood({ query: textQuery, mode: 'food' })
      if (res && res.ok && res.item) {
        setReviewItem({
          name: res.item.name || textQuery,
          calories: res.item.calories || 0,
          protein: res.item.protein || 0,
          carbs: res.item.carbs || 0,
          fat: res.item.fat || 0,
          serving: res.item.serving || '1 portion',
          meal: selectedMeal,
          source: 'ai_text'
        })
        setActiveMode(null)
        setTextQuery('')
      } else {
        alert(res?.error || 'Failed to analyze food nutrition.')
      }
    } finally {
      setAnalyzing(false)
      setStatusMessage('')
    }
  }

  const handlePhotoCapture = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      setAnalyzing(true)
      setStatusMessage('AI is identifying the meal from photo...')
      try {
        const res = await analyzeFood({ imageBase64: reader.result, mode: 'food' })
        if (res && res.ok && res.item) {
          setReviewItem({
            name: res.item.name || 'Dish Photo',
            calories: res.item.calories || 0,
            protein: res.item.protein || 0,
            carbs: res.item.carbs || 0,
            fat: res.item.fat || 0,
            serving: res.item.serving || '1 portion',
            meal: selectedMeal,
            source: 'ai_photo'
          })
          setActiveMode(null)
        } else {
          alert('Failed to detect food in photo.')
        }
      } finally {
        setAnalyzing(false)
        setStatusMessage('')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleBarcodeFound = async (barcode) => {
    setActiveMode(null)
    setAnalyzing(true)
    setStatusMessage(`Looking up barcode ${barcode}...`)
    try {
      const res = await fetchBarcodeNutrition(barcode)
      if (res && res.found && res.item) {
        setReviewItem({
          name: res.item.name,
          calories: res.item.calories,
          protein: res.item.protein,
          carbs: res.item.carbs,
          fat: res.item.fat,
          serving: res.item.serving,
          meal: 'snack',
          source: 'barcode'
        })
      } else {
        alert(`Barcode ${barcode} not found in database. Please snap a photo of the nutrition label.`)
      }
    } finally {
      setAnalyzing(false)
      setStatusMessage('')
    }
  }

  const handleCaptureLabel = async (base64) => {
    setActiveMode(null)
    setAnalyzing(true)
    setStatusMessage('AI is reading the nutrition facts label...')
    try {
      const res = await analyzeFood({ imageBase64: base64, mode: 'label' })
      if (res && res.ok && res.item) {
        setReviewItem({
          name: res.item.name || 'Packaged Snack / Food',
          calories: res.item.calories || 0,
          protein: res.item.protein || 0,
          carbs: res.item.carbs || 0,
          fat: res.item.fat || 0,
          serving: res.item.serving || '1 serving',
          meal: 'snack',
          source: 'ai_label'
        })
      } else {
        alert('Could not detect nutrition label in the image.')
      }
    } finally {
      setAnalyzing(false)
      setStatusMessage('')
    }
  }

  const handleSaveReview = () => {
    if (!reviewItem) return
    addNutritionLog({
      ...reviewItem,
      d: today
    })
    setReviewItem(null)
  }

  return (
    <div className="food-sheet-overlay" onClick={onClose}>
      <div className="food-sheet" onClick={e => e.stopPropagation()}>
        <div className="food-sheet-header">
          <div className="food-sheet-title">Log Food • {today}</div>
          <button className="food-sheet-close" onClick={onClose}>×</button>
        </div>

        <div className="food-sheet-body">
          {/* Quick Stats Summary */}
          <div className="food-summary-bar">
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Total Consumed</div>
              <div className="food-sum-cal">{totalCalories} kcal</div>
            </div>
            <div className="food-sum-macros">
              <div>P: <b>{Math.round(totalProtein)}g</b></div>
              <div>C: <b>{Math.round(totalCarbs)}g</b></div>
              <div>F: <b>{Math.round(totalFat)}g</b></div>
            </div>
          </div>

          {/* Action Tabs for 3 Input Methods */}
          <div className="food-action-tabs">
            <button
              className={`food-action-btn ${activeMode === 'text' ? 'active' : ''}`}
              onClick={() => setActiveMode(m => m === 'text' ? null : 'text')}
            >
              <Icon name="sparkles" size={20} />
              <span>Text / Name</span>
            </button>

            <label className={`food-action-btn ${activeMode === 'photo' ? 'active' : ''}`}>
              <Icon name="flame" size={20} />
              <span>Food Photo</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} />
            </label>

            <button
              className={`food-action-btn ${activeMode === 'barcode' ? 'active' : ''}`}
              onClick={() => setActiveMode(m => m === 'barcode' ? null : 'barcode')}
            >
              <Icon name="heart" size={20} />
              <span>Barcode / Label</span>
            </button>
          </div>

          {/* Status / Loading */}
          {analyzing && (
            <div style={{ padding: '16px', background: 'rgba(16,185,129,0.1)', borderRadius: 12, textAlign: 'center', color: 'var(--acc, #10b981)' }}>
              {statusMessage}
            </div>
          )}

          {/* Mode: Text Input Form */}
          {activeMode === 'text' && (
            <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="e.g. 1 bowl of chicken rice with scrambled eggs"
                value={textQuery}
                onChange={e => setTextQuery(e.target.value)}
                autoFocus
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12, padding: 12, color: '#fff', fontSize: 14
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--acc, #10b981)', color: '#000', border: 'none',
                  borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Analyze with AI
              </button>
            </form>
          )}

          {/* Mode: Barcode Scanner View */}
          {activeMode === 'barcode' && (
            <BarcodeScannerView
              onBarcode={handleBarcodeFound}
              onCaptureLabel={handleCaptureLabel}
              onCancel={() => setActiveMode(null)}
            />
          )}

          {/* Review & Confirm Card */}
          {reviewItem && (
            <div className="food-review-modal">
              <div className="food-review-title">Confirm Food Item</div>
              <input
                type="text"
                value={reviewItem.name}
                onChange={e => setReviewItem({ ...reviewItem, name: e.target.value })}
                style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: 8, color: '#fff', fontSize: 14
                }}
              />

              <div className="food-review-grid">
                <div className="food-review-field">
                  <label>Calories</label>
                  <input
                    type="number"
                    value={reviewItem.calories}
                    onChange={e => setReviewItem({ ...reviewItem, calories: Number(e.target.value) })}
                  />
                </div>
                <div className="food-review-field">
                  <label>Protein (g)</label>
                  <input
                    type="number"
                    value={reviewItem.protein}
                    onChange={e => setReviewItem({ ...reviewItem, protein: Number(e.target.value) })}
                  />
                </div>
                <div className="food-review-field">
                  <label>Carbs (g)</label>
                  <input
                    type="number"
                    value={reviewItem.carbs}
                    onChange={e => setReviewItem({ ...reviewItem, carbs: Number(e.target.value) })}
                  />
                </div>
                <div className="food-review-field">
                  <label>Fat (g)</label>
                  <input
                    type="number"
                    value={reviewItem.fat}
                    onChange={e => setReviewItem({ ...reviewItem, fat: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="food-review-actions">
                <button className="food-btn-cancel" onClick={() => setReviewItem(null)}>Cancel</button>
                <button className="food-btn-save" onClick={handleSaveReview}>Save Food</button>
              </div>
            </div>
          )}

          {/* List of Today's Foods */}
          <div className="food-list">
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              Today's Food Log ({logs.length})
            </div>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                No food logged today yet. Use the options above to track your meals.
              </div>
            ) : (
              logs.map(item => (
                <div key={item.id} className="food-item-row">
                  <div className="food-item-left">
                    <h5>{item.name}</h5>
                    <p>
                      P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                      {item.serving ? ` • ${item.serving}` : ''}
                    </p>
                  </div>
                  <div className="food-item-right">
                    <span className="food-item-cal">{item.calories} kcal</span>
                    <button
                      className="food-item-del"
                      onClick={() => deleteNutritionLog(item.id)}
                      aria-label="Delete food"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
