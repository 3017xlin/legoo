"use client"

import type React from "react"
import { ArrowDownToLine, ArrowUpToLine } from "lucide-react"
import { SimpleTooltip } from "./simple-tooltip"
import { MIN_FLOOR_OFFSET, MAX_FLOOR_OFFSET } from "@/lib/constants"

interface FloorControlProps {
  floorOffset: number
  onChange: (offset: number) => void
}

export const FloorControl: React.FC<FloorControlProps> = ({ floorOffset, onChange }) => {
  const decrement = () => onChange(Math.max(MIN_FLOOR_OFFSET, floorOffset - 1))
  const increment = () => onChange(Math.min(MAX_FLOOR_OFFSET, floorOffset + 1))

  return (
    <div className="flex items-center gap-1">
      <SimpleTooltip text="Raise floor (less room below)" position="top">
        <button
          onClick={decrement}
          disabled={floorOffset <= MIN_FLOOR_OFFSET}
          className="text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:text-gray-300 transition-colors p-1"
          aria-label="Raise floor"
        >
          <ArrowUpToLine className="w-4 h-4 stroke-[1.5]" />
        </button>
      </SimpleTooltip>

      <span className="text-white text-xs font-mono w-8 text-center" title="Floor offset (units below default)">
        -{floorOffset}
      </span>

      <SimpleTooltip text="Lower floor (insert from underneath)" position="top">
        <button
          onClick={increment}
          disabled={floorOffset >= MAX_FLOOR_OFFSET}
          className="text-gray-300 hover:text-white disabled:opacity-30 disabled:hover:text-gray-300 transition-colors p-1"
          aria-label="Lower floor"
        >
          <ArrowDownToLine className="w-4 h-4 stroke-[1.5]" />
        </button>
      </SimpleTooltip>
    </div>
  )
}
