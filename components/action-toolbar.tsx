"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Hammer, Move, Eraser, Square, Layers, RotateCw, ChevronDown, Triangle, BoxSelect } from "lucide-react"
import { SimpleTooltip } from "./simple-tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { BrickShape } from "@/components/blocks/events"

interface ActionToolbarProps {
  onModeChange: (mode: "build" | "move" | "erase") => void
  currentMode: "build" | "move" | "erase"
  shape: BrickShape
  onShapeChange: (shape: BrickShape) => void
  rotation: [number, number, number]
  onRotate: (axis: "x" | "y" | "z") => void
}

const MAIN_SHAPES: { id: BrickShape; label: string; Icon: any }[] = [
  { id: "rect", label: "Brick", Icon: Square },
  { id: "flatTop", label: "Tile (flat top)", Icon: Layers },
]

const SPECIAL_SHAPES: { id: BrickShape; label: string; Icon: any }[] = [
  { id: "slope", label: "Slope / Trapezoid", Icon: Triangle },
  { id: "bracket", label: "Bracket (sideways studs)", Icon: BoxSelect },
]

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onModeChange,
  currentMode,
  shape,
  onShapeChange,
  rotation,
  onRotate,
}) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const MaybeTooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
    if (isMobile) return <>{children}</>
    return (
      <SimpleTooltip text={text} position="right">
        {children}
      </SimpleTooltip>
    )
  }

  const baseButtonClass =
    "w-12 h-12 rounded-full flex items-center justify-center transition-colors"

  return (
    <div className="fixed top-4 left-4 flex flex-col gap-3 z-20">
      <MaybeTooltip text="Build (b)">
        <button
          onClick={() => onModeChange("build")}
          className={`${baseButtonClass} ${
            currentMode === "build" ? "bg-black text-white" : "bg-black/30 text-white hover:bg-black/50"
          }`}
          aria-label="Build Mode (B)"
          aria-pressed={currentMode === "build"}
        >
          <Hammer className="w-5 h-5 stroke-[1.5]" />
        </button>
      </MaybeTooltip>

      <MaybeTooltip text="Move (m)">
        <button
          onClick={() => onModeChange("move")}
          className={`${baseButtonClass} ${
            currentMode === "move" ? "bg-black text-white" : "bg-black/30 text-white hover:bg-black/50"
          }`}
          aria-label="Move Mode (M)"
          aria-pressed={currentMode === "move"}
        >
          <Move className="w-5 h-5 stroke-[1.5]" />
        </button>
      </MaybeTooltip>

      <MaybeTooltip text="Erase (e)">
        <button
          onClick={() => onModeChange("erase")}
          className={`${baseButtonClass} ${
            currentMode === "erase" ? "bg-black text-white" : "bg-black/30 text-white hover:bg-black/50"
          }`}
          aria-label="Erase Mode (E)"
          aria-pressed={currentMode === "erase"}
        >
          <Eraser className="w-5 h-5 stroke-[1.5]" />
        </button>
      </MaybeTooltip>

      <div className="w-10 h-px bg-white/30 mx-auto" />

      {MAIN_SHAPES.map(({ id, label, Icon }) => (
        <MaybeTooltip key={id} text={label}>
          <button
            onClick={() => {
              onShapeChange(id)
              onModeChange("build")
            }}
            className={`${baseButtonClass} ${
              shape === id ? "bg-yellow-500 text-black" : "bg-black/30 text-white hover:bg-black/50"
            }`}
            aria-label={label}
            aria-pressed={shape === id}
          >
            <Icon className="w-5 h-5 stroke-[1.5]" />
          </button>
        </MaybeTooltip>
      ))}

      <DropdownMenu>
        <MaybeTooltip text="Import special pieces">
          <DropdownMenuTrigger
            className={`${baseButtonClass} ${
              SPECIAL_SHAPES.some((s) => s.id === shape)
                ? "bg-yellow-500 text-black"
                : "bg-black/30 text-white hover:bg-black/50"
            }`}
            aria-label="Import special pieces"
          >
            <ChevronDown className="w-5 h-5 stroke-[1.5]" />
          </DropdownMenuTrigger>
        </MaybeTooltip>
        <DropdownMenuContent side="right" align="start" sideOffset={8}>
          {SPECIAL_SHAPES.map(({ id, label, Icon }) => (
            <DropdownMenuItem
              key={id}
              onSelect={() => {
                onShapeChange(id)
                onModeChange("build")
              }}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4 stroke-[1.5]" />
              <span>{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-10 h-px bg-white/30 mx-auto" />

      <MaybeTooltip text="Rotate Y (r)">
        <button
          onClick={() => onRotate("y")}
          className={`${baseButtonClass} bg-black/30 text-white hover:bg-black/50`}
          aria-label="Rotate around Y axis"
        >
          <RotateCw className="w-5 h-5 stroke-[1.5]" />
        </button>
      </MaybeTooltip>

      <MaybeTooltip text="Rotate X (shift+r)">
        <button
          onClick={() => onRotate("x")}
          className={`${baseButtonClass} bg-black/30 text-white hover:bg-black/50`}
          aria-label="Rotate around X axis"
        >
          <span className="text-xs font-semibold">RX</span>
        </button>
      </MaybeTooltip>

      <MaybeTooltip text="Rotate Z (alt+r)">
        <button
          onClick={() => onRotate("z")}
          className={`${baseButtonClass} bg-black/30 text-white hover:bg-black/50`}
          aria-label="Rotate around Z axis"
        >
          <span className="text-xs font-semibold">RZ</span>
        </button>
      </MaybeTooltip>
    </div>
  )
}
