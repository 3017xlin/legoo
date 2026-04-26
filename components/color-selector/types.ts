export interface ColorSelectorProps {
  colors: string[]
  selectedColor: string
  onSelectColor: (color: string) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  width: number
  depth: number
  onWidthChange: (width: number) => void
  onDepthChange: (depth: number) => void
  onClearSet: () => void
  onPlayToggle: () => void
  isPlaying: boolean
  onSave: () => void
  onLoad: () => void
  currentCreationId?: string
  currentCreationName?: string
  currentTheme: ColorTheme
  onThemeChange: (theme: ColorTheme) => void
  bricksCount: number
  floorOffset: number
  onFloorOffsetChange: (offset: number) => void
}

export type ColorTheme = "default" | "muted" | "monochrome"

export const COLOR_THEMES: Record<ColorTheme, string[]> = {
  default: [
    "#FF3333",
    "#FF9933",
    "#FFCC33",
    "#33CC66",
    "#33CCFF",
    "#3366CC",
    "#9933CC",
    "#222222",
  ],
  muted: [
    "#CC6666",
    "#CC9966",
    "#CCCC66",
    "#66CC99",
    "#66CCCC",
    "#6699CC",
    "#9966CC",
    "#444444",
  ],
  monochrome: [
    "#FFFFFF",
    "#DDDDDD",
    "#BBBBBB",
    "#999999",
    "#777777",
    "#555555",
    "#333333",
    "#111111",
  ],
}
