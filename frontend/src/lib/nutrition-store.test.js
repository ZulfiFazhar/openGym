// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mergeStates } from './sync-merge.js'
import { DEF } from '../store/useStore.js'

describe('nutrition state merge', () => {
  it('has nutrition defaults in DEF', () => {
    expect(DEF).toHaveProperty('nutritionTarget', null)
    expect(DEF).toHaveProperty('nutritionLogs')
    expect(Array.isArray(DEF.nutritionLogs)).toBe(true)
  })

  it('merges nutritionTarget favoring later timestamp', () => {
    const local = { nutritionTarget: { calories: 2000, t: 100 } }
    const server = { nutritionTarget: { calories: 2400, t: 200 } }
    const merged = mergeStates(local, server)
    expect(merged.nutritionTarget).toEqual({ calories: 2400, t: 200 })
  })

  it('merges nutritionTarget when one side is null', () => {
    const local = { nutritionTarget: { calories: 2100, t: 150 } }
    const server = { nutritionTarget: null }
    expect(mergeStates(local, server).nutritionTarget).toEqual({ calories: 2100, t: 150 })
    expect(mergeStates(server, local).nutritionTarget).toEqual({ calories: 2100, t: 150 })
  })

  it('unions nutritionLogs by entry id favoring newer timestamp for duplicate id', () => {
    const local = {
      nutritionLogs: [
        { id: 'n1', name: 'Eggs', calories: 280, t: 100 },
        { id: 'shared', name: 'Coffee', calories: 50, t: 120 }
      ]
    }
    const server = {
      nutritionLogs: [
        { id: 'n2', name: 'Rice', calories: 350, t: 150 },
        { id: 'shared', name: 'Coffee with milk', calories: 90, t: 200 }
      ]
    }
    const merged = mergeStates(local, server)
    expect(merged.nutritionLogs).toHaveLength(3)
    const shared = merged.nutritionLogs.find(e => e.id === 'shared')
    expect(shared.name).toBe('Coffee with milk')
    expect(shared.calories).toBe(90)
  })
})
