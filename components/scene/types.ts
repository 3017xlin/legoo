import type { Brick, BrickShape } from "@/components/blocks/events"

export interface SceneProps {
  bricks: Brick[]
  selectedColor: string
  width: number
  depth: number
  shape: BrickShape
  rotation: [number, number, number]
  floorOffset: number
  onAddBrick: (brick: Brick) => void
  onDeleteBrick?: (index: number) => void
  onUndo: () => void
  onRedo: () => void
  isPlaying: boolean
  interactionMode?: "build" | "move" | "erase"
}
