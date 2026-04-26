import type { Brick } from "@/components/blocks/events"

const LOCAL_STORAGE_KEY = "blocks-state"
const TABS_STORAGE_KEY = "blocks-tabs-state"

export interface LocalStorageState {
  bricks: Brick[]
  width: number
  height: number
  selectedColor: string
  currentTheme: string
  creationId?: string
  creationName?: string
  floorOffset?: number
  shape?: string
  rotation?: [number, number, number]
}

export function saveToLocalStorage(state: LocalStorageState): boolean {
  try {
    const serializedState = JSON.stringify(state)
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState)
    return true
  } catch (error) {
    console.error("Error saving to localStorage:", error)
    return false
  }
}

export function loadFromLocalStorage(): LocalStorageState | null {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!serializedState) return null
    return JSON.parse(serializedState) as LocalStorageState
  } catch (error) {
    console.error("Error loading from localStorage:", error)
    return null
  }
}

export function clearLocalStorage(): boolean {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error clearing localStorage:", error)
    return false
  }
}

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

export interface TabPersist {
  id: string
  name: string
  bricks: Brick[]
  floorOffset: number
}

export interface TabsPersistedState {
  tabs: TabPersist[]
  activeTabId: string
}

export function saveTabsToLocalStorage(state: TabsPersistedState): boolean {
  try {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (error) {
    console.error("Error saving tabs to localStorage:", error)
    return false
  }
}

export function loadTabsFromLocalStorage(): TabsPersistedState | null {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TabsPersistedState
  } catch (error) {
    console.error("Error loading tabs from localStorage:", error)
    return null
  }
}

export function clearTabsLocalStorage(): boolean {
  try {
    localStorage.removeItem(TABS_STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error clearing tabs localStorage:", error)
    return false
  }
}
