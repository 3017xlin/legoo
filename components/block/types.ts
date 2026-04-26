import type { BrickShape } from "@/components/blocks/events"

export interface BlockProps {
  color: string
  position: [number, number, number]
  width: number
  height: number
  shape?: BrickShape
  rotation?: [number, number, number]
  isPlacing?: boolean
  opacity?: number
  onClick?: () => void
}
