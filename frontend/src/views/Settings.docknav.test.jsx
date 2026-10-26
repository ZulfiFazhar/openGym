// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Settings from './Settings.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => {
  const state = { S: null }
  state.snapshot = () => ({
    S: state.S,
    user: null,
    update: mut => {
      const next = structuredClone(state.S)
      mut(next)
      state.S = next
    },
    replaceState: vi.fn(), setUser: vi.fn(), pullState: vi.fn(), pushState: vi.fn(),
    signOut: vi.fn(), signOutAll: vi.fn(), resetDemo: vi.fn(), disconnectServer: vi.fn(),
  })
  return state
})
vi.mock('../store/useStore.js', () => {
  const useStore = selector => selector ? selector(mocks.snapshot()) : mocks.snapshot()
  useStore.getState = mocks.snapshot
  return {
    useStore,
    DEF: { reminder: { time: '17:30' }, dockLayout: 'classic', liquidGlass: false },
    hasData: () => false,
  }
})
vi.mock('../store/useUI.js', () => {
  const snap = () => ({ toast: vi.fn(), openSheet: vi.fn() })
  const useUI = selector => selector ? selector(snap()) : snap()
  useUI.getState = snap
  return { useUI }
})
vi.mock('react-router-dom', () => ({ useNavigate: () => () => {} }))
vi.mock('../lib/api.js', () => ({
  api: vi.fn(), webauthnOK: () => false, passkeyLogin: vi.fn(), passkeyRegister: vi.fn(), IS_ANDROID: false,
}))
vi.mock('../lib/push.js', () => ({ pushSupported: () => false, enablePush: vi.fn(), disablePush: vi.fn(), sendTestPush: vi.fn() }))
vi.mock('../lib/wakelock.js', () => ({ wakeLockSupported: () => false }))
vi.mock('../lib/mobile.js', () => ({ MOBILE: false, isAndroid: () => Promise.resolve(false), shareExport: vi.fn(), syncReminder: vi.fn() }))
vi.mock('./MobileOnboarding.jsx', () => ({ ConnectSheet: () => null }))
vi.mock('../sheets.jsx', () => ({
  loadStarterPlan: vi.fn(), starterPlanSheet: vi.fn(), confirmSheet: vi.fn(), importFromApp: vi.fn(),
  importFromHevy: vi.fn(), equipmentProfileSheet: vi.fn(),
}))

globalThis.__APP_VERSION__ ??= 'test'

let host, root
beforeEach(() => {
  mocks.S = {
    theme: 'dark', accent: 'lime', body: 'male',
    dockLayout: 'classic', liquidGlass: false,
    workouts: [], routines: [], exWeights: {},
  }
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})
afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

const mount = () => act(() => root.render(<Settings page="look" />))
const segButton = label => [...host.querySelectorAll('.seg button')].find(b => b.textContent === label)
const switchFor = label => {
  const rows = [...host.querySelectorAll('.lrow')]
  const row = rows.find(r => r.querySelector('.lrow-t')?.textContent?.includes(label))
  return row?.querySelector('input[type="checkbox"], [role="switch"], button.switch')
}

describe('Settings — navigation dock & liquid glass options', () => {
  it('offers Classic and Modern dock layouts, defaulting to Classic', () => {
    mount()
    expect(segButton('Classic')).toBeTruthy()
    expect(segButton('Modern')).toBeTruthy()
    expect(segButton('Classic').getAttribute('aria-pressed')).toBe('true')
    // Liquid glass switch is hidden when Classic layout is chosen
    expect(switchFor('Liquid glass effect')).toBeFalsy()

    act(() => { segButton('Modern').click() })
    expect(mocks.S.dockLayout).toBe('modern')

    mount()
    expect(segButton('Modern').getAttribute('aria-pressed')).toBe('true')
    // Liquid glass switch is visible when Modern layout is active
    expect(switchFor('Liquid glass effect')).toBeTruthy()
  })

  it('toggles liquid glass on and off when modern dock layout is selected', () => {
    mocks.S.dockLayout = 'modern'
    mocks.S.liquidGlass = false
    mount()
    const lgSwitch = switchFor('Liquid glass effect')
    expect(lgSwitch).toBeTruthy()
    expect(lgSwitch.getAttribute('aria-checked')).toBe('false')

    act(() => { lgSwitch.click() })
    expect(mocks.S.liquidGlass).toBe(true)

    mount()
    const activeSwitch = switchFor('Liquid glass effect')
    expect(activeSwitch.getAttribute('aria-checked')).toBe('true')
  })

  it('treats absent/legacy dockLayout as classic', () => {
    mocks.S.dockLayout = undefined
    mount()
    expect(segButton('Classic').getAttribute('aria-pressed')).toBe('true')
    expect(segButton('Modern').getAttribute('aria-pressed')).toBe('false')
    expect(switchFor('Liquid glass effect')).toBeFalsy()
  })
})
