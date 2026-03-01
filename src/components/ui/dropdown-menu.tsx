"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => {} })

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ children, className = "" }: DropdownMenuTriggerProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  return (
    <button
      onClick={() => setOpen(!open)}
      className={className}
    >
      {children}
    </button>
  )
}

export function DropdownMenuContent({ 
  children, 
  className = "",
  align = "end"
}: DropdownMenuContentProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  
  if (!open) return null
  
  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => setOpen(false)} 
      />
      <div
        className={`absolute z-50 mt-2 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${
          align === "end" ? "right-0" : align === "start" ? "left-0" : "left-1/2 -translate-x-1/2"
        } ${className}`}
      >
        {children}
      </div>
    </>
  )
}

export function DropdownMenuItem({ 
  children, 
  className = "",
  onClick 
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
    setOpen(false)
  }
  
  return (
    <button
      onClick={handleClick}
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground w-full text-left ${className}`}
    >
      {children}
    </button>
  )
}

export function DropdownMenuLabel({ 
  children, 
  className = "",
  inset 
}: { 
  children: React.ReactNode
  className?: string
  inset?: boolean 
}) {
  return (
    <div className={`px-2 py-1.5 text-sm font-semibold ${inset ? "pl-8" : ""} ${className}`}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className = "" }: { className?: string }) {
  return <div className={`-mx-1 my-1 h-px bg-muted ${className}`} />
}
