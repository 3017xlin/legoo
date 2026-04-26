"use client"

import { useEffect } from "react"
import { MIN_FLOOR_OFFSET, MAX_FLOOR_OFFSET } from "@/lib/constants"

function isInputElement(): boolean {
  const activeElement = document.activeElement
  if (!activeElement) return false
  const tagName = activeElement.tagName.toLowerCase()
  const isEditable =
    activeElement.hasAttribute("contenteditable") && activeElement.getAttribute("contenteditable") !== "false"
  return tagName === "input" || tagName === "textarea" || tagName === "select" || isEditable
}

interface KeyboardShortcutsProps {
  isPlaying: boolean
  width: number
  depth: number
  currentColors: string[]
  setWidth: (width: number | ((prev: number) => number)) => void
  setDepth: (depth: number | ((prev: number) => number)) => void
  setSelectedColor: (color: string) => void
  setInteractionMode: (mode: "build" | "move" | "erase") => void
  onUndo: () => void
  onRedo: () => void
  onPlayToggle: () => void
  handleClearWithConfirmation: () => void
  handleSave: () => void
  handleLoad: () => void
  currentTheme: string
  handleThemeChange: (theme: string) => void
  onRotate: (axis: "x" | "y" | "z") => void
  floorOffset: number
  setFloorOffset: (offset: number | ((prev: number) => number)) => void
}

export function useKeyboardShortcuts({
  isPlaying,
  width,
  depth,
  currentColors,
  setWidth,
  setDepth,
  setSelectedColor,
  setInteractionMode,
  onUndo,
  onRedo,
  onPlayToggle,
  handleClearWithConfirmation,
  handleSave,
  handleLoad,
  currentTheme,
  handleThemeChange,
  onRotate,
  floorOffset,
  setFloorOffset,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPlaying) return
      if (isInputElement()) return

      // Rotation: R (Y-axis), Shift+R (X-axis), Alt+R (Z-axis)
      if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        if (event.altKey) onRotate("z")
        else if (event.shiftKey) onRotate("x")
        else onRotate("y")
        return
      }

      // Swap dimensions with X (was S — now reserved for save shortcut + slope key)
      if (event.key === "x" && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        setWidth(() => depth)
        setDepth(() => width)
      }

      if (event.key === "B" || event.key === "b") {
        setInteractionMode("build")
      }
      if (event.key === "M" || event.key === "m") {
        setInteractionMode("move")
      }
      if (event.key === "E" || event.key === "e") {
        setInteractionMode("erase")
      }

      if (event.key === "C" || event.key === "c") {
        const themes = ["default", "muted", "monochrome"]
        const currentIndex = themes.indexOf(currentTheme)
        const nextIndex = (currentIndex + 1) % themes.length
        handleThemeChange(themes[nextIndex])
      }

      if (event.key === "[" && !event.shiftKey) {
        setWidth((prevWidth) => Math.max(1, prevWidth - 1))
      }
      if (event.key === "]" && !event.shiftKey) {
        setWidth((prevWidth) => Math.min(20, prevWidth + 1))
      }
      if (event.key === ";") {
        setDepth((prevDepth) => Math.max(1, prevDepth - 1))
      }
      if (event.key === "'") {
        setDepth((prevDepth) => Math.min(20, prevDepth + 1))
      }

      // Floor offset: , raises floor, . lowers it (room for underneath insertion)
      if (event.key === "," && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        setFloorOffset((prev) => Math.max(MIN_FLOOR_OFFSET, prev - 1))
      }
      if (event.key === "." && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        setFloorOffset((prev) => Math.min(MAX_FLOOR_OFFSET, prev + 1))
      }

      if (event.key >= "1" && event.key <= "8") {
        const colorIndex = Number.parseInt(event.key) - 1
        if (colorIndex >= 0 && colorIndex < currentColors.length) {
          setSelectedColor(currentColors[colorIndex])
        }
      }

      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault()
        onUndo()
      }
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault()
        onRedo()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault()
        onRedo()
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault()
        onPlayToggle()
      }
      if ((event.metaKey || event.ctrlKey) && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault()
        handleClearWithConfirmation()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        handleSave()
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "o") {
        event.preventDefault()
        handleLoad()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    isPlaying,
    width,
    depth,
    currentColors,
    setWidth,
    setDepth,
    setSelectedColor,
    setInteractionMode,
    onUndo,
    onRedo,
    onPlayToggle,
    handleClearWithConfirmation,
    handleSave,
    handleLoad,
    currentTheme,
    handleThemeChange,
    onRotate,
    floorOffset,
    setFloorOffset,
  ])
}
