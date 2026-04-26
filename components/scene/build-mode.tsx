"use client"

import type React from "react"
import { Block } from "../block"
import { HighlightSquare } from "../highlight-square"
import type { BrickShape } from "@/components/blocks/events"

interface BuildModeProps {
  showNewBrick: boolean
  isValid: boolean
  currentBrickPosition: [number, number, number]
  selectedColor: string
  width: number
  depth: number
  shape: BrickShape
  rotation: [number, number, number]
  floorY: number
}

export const BuildMode: React.FC<BuildModeProps> = ({
  showNewBrick,
  isValid,
  currentBrickPosition,
  selectedColor,
  width,
  depth,
  shape,
  rotation,
  floorY,
}) => {
  if (!showNewBrick) return null

  return (
    <>
      <Block
        color={selectedColor}
        position={currentBrickPosition}
        width={width}
        height={depth}
        shape={shape}
        rotation={rotation}
        isPlacing={true}
        opacity={0.6}
      />
      <HighlightSquare
        position={[currentBrickPosition[0], floorY, currentBrickPosition[2]]}
        isValid={isValid}
        width={width}
        height={depth}
      />
    </>
  )
}
