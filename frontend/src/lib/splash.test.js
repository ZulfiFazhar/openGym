// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dismissSplash } from './splash.js'

describe('dismissSplash', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const splash = document.createElement('div')
    splash.id = 'app-splash'
    document.body.appendChild(splash)
  })

  afterEach(() => {
    vi.useRealTimers()
    const el = document.getElementById('app-splash')
    if (el) el.remove()
  })

  it('adds splash-fade-out class after the initial delay', () => {
    dismissSplash(500)
    const el = document.getElementById('app-splash')
    expect(el.classList.contains('splash-fade-out')).toBe(false)

    vi.advanceTimersByTime(500)
    expect(el.classList.contains('splash-fade-out')).toBe(true)
  })

  it('removes the splash element from DOM after fade-out completes', () => {
    dismissSplash(500)
    expect(document.getElementById('app-splash')).toBeTruthy()

    vi.advanceTimersByTime(500 + 400)
    expect(document.getElementById('app-splash')).toBeNull()
  })

  it('handles missing splash element safely', () => {
    const el = document.getElementById('app-splash')
    el.remove()
    expect(() => dismissSplash(100)).not.toThrow()
  })
})
