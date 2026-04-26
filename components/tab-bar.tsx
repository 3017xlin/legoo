"use client"

import type React from "react"
import { Plus, X, Download } from "lucide-react"
import { SimpleTooltip } from "./simple-tooltip"

export interface BuildTab {
  id: string
  name: string
}

interface TabBarProps {
  tabs: BuildTab[]
  activeTabId: string
  onSelectTab: (id: string) => void
  onAddTab: () => void
  onCloseTab: (id: string) => void
  onRenameTab: (id: string, name: string) => void
  onImportFromTab: (id: string) => void
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onCloseTab,
  onRenameTab,
  onImportFromTab,
}) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-md px-2 py-1.5 rounded-2xl shadow-lg border border-gray-700">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={`flex items-center gap-1 rounded-xl pl-3 pr-1 py-1 text-sm transition-colors ${
              active
                ? "bg-yellow-500 text-black"
                : "bg-black/20 text-white hover:bg-black/40 cursor-pointer"
            }`}
            onClick={() => !active && onSelectTab(tab.id)}
          >
            {active ? (
              <input
                value={tab.name}
                onChange={(e) => onRenameTab(tab.id, e.target.value)}
                className="bg-transparent outline-none w-24 font-medium"
              />
            ) : (
              <span className="font-medium select-none max-w-[8rem] truncate">{tab.name}</span>
            )}
            {!active && tabs.length > 1 && (
              <SimpleTooltip text={`Import "${tab.name}" into current part`} position="bottom">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onImportFromTab(tab.id)
                  }}
                  className="rounded-full w-6 h-6 flex items-center justify-center hover:bg-white/20"
                  aria-label="Import this tab into current"
                >
                  <Download className="w-3 h-3 stroke-[2]" />
                </button>
              </SimpleTooltip>
            )}
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
                className={`rounded-full w-6 h-6 flex items-center justify-center ${
                  active ? "hover:bg-black/20" : "hover:bg-white/20"
                }`}
                aria-label="Close tab"
              >
                <X className="w-3 h-3 stroke-[2]" />
              </button>
            )}
          </div>
        )
      })}

      <SimpleTooltip text="New tab" position="bottom">
        <button
          onClick={onAddTab}
          className="rounded-xl w-8 h-8 flex items-center justify-center bg-black/20 text-white hover:bg-black/40"
          aria-label="New tab"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
        </button>
      </SimpleTooltip>
    </div>
  )
}
