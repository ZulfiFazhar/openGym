import React, { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'

export default function BarcodeScannerView({ onBarcode, onCaptureLabel, onCancel }) {
  const videoRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let stream = null
    let timer = null
    let done = false

    const stop = () => {
      done = true
      if (timer) clearTimeout(timer)
      if (stream) stream.getTracks().forEach(t => t.stop())
    }

    ;(async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported on this browser.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        })
      } catch (e) {
        setError('Camera access denied or unavailable.')
        return
      }

      if (done) {
        stream.getTracks().forEach(t => t.stop())
        return
      }

      const v = videoRef.current
      if (!v) return
      v.srcObject = stream
      try { await v.play() } catch (e) { /* ignore autoplay */ }

      // Check if BarcodeDetector is supported
      let detector = null
      if (typeof BarcodeDetector === 'function') {
        try {
          detector = new BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code']
          })
        } catch (e) {
          detector = null
        }
      }

      const scanTick = async () => {
        if (done) return
        if (detector && v.readyState >= 2) {
          try {
            const barcodes = await detector.detect(v)
            if (barcodes && barcodes.length && !done) {
              const val = barcodes[0].rawValue
              if (val) {
                stop()
                onBarcode(val)
                return
              }
            }
          } catch (e) {
            /* continue scanning */
          }
        }
        timer = setTimeout(scanTick, 200)
      }

      scanTick()
    })()

    return stop
  }, [onBarcode])

  const handleCaptureFrame = () => {
    const v = videoRef.current
    if (!v) return
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(800, v.videoWidth || 640)
    canvas.height = Math.min(800, v.videoHeight || 480)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
    const base64 = canvas.toDataURL('image/jpeg', 0.8)
    onCaptureLabel(base64)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onCaptureLabel(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="scanner-box">
        {error ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        ) : (
          <>
            <video ref={videoRef} className="scanner-video" playsInline muted />
            <div className="scanner-reticle" />
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button
          onClick={handleCaptureFrame}
          style={{
            background: 'var(--acc, #10b981)', color: '#000', border: 'none',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignSelf: 'center', alignItems: 'center', gap: 6
          }}
        >
          <Icon name="sparkles" size={16} />
          <span>Snap Nutrition Label</span>
        </button>

        <label
          style={{
            background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <span>Upload Photo</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        <button
          onClick={onCancel}
          style={{
            background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
        Point camera at a snack barcode or tap "Snap Nutrition Label"
      </p>
    </div>
  )
}
