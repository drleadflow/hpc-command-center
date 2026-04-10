'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface SlashCommand {
  command: string
  description: string
  icon: string
}

const COMMANDS: SlashCommand[] = [
  { command: '/audit', description: 'Audit GHL conversations for unanswered leads', icon: '🔍' },
  { command: '/brief', description: 'Generate your morning briefing', icon: '☀️' },
  { command: '/scorecard', description: 'Show your current scorecard', icon: '📊' },
  { command: '/team', description: 'Show your active employees', icon: '👥' },
  { command: '/evolve', description: 'Run self-improvement cycle', icon: '🧬' },
  { command: '/report', description: 'Generate value report', icon: '📈' },
  { command: '/predict', description: 'Show predictions', icon: '🔮' },
  { command: '/speak', description: 'Read last response aloud', icon: '🔊' },
  { command: '/help', description: 'Show all commands', icon: '❓' },
]

interface SlashCommandsProps {
  visible: boolean
  filter: string
  onSelect: (command: string) => void
}

export function SlashCommands({ visible, filter, onSelect }: SlashCommandsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().includes(filter.toLowerCase())
  )

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIndex(0)
  }, [filter])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || filtered.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        onSelect(filtered[activeIndex].command)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onSelect('')
      }
    },
    [visible, filtered, activeIndex, onSelect]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined
    activeEl?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!visible || filtered.length === 0) return null

  return (
    <div
      ref={listRef}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: '4px',
        maxHeight: '280px',
        overflowY: 'auto',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.18)',
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: '8px 12px 4px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--muted)',
        }}
      >
        Commands
      </div>
      {filtered.map((cmd, idx) => (
        <button
          key={cmd.command}
          onClick={() => onSelect(cmd.command)}
          onMouseEnter={() => setActiveIndex(idx)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            textAlign: 'left',
            border: 'none',
            cursor: 'pointer',
            backgroundColor:
              idx === activeIndex ? 'var(--bg)' : 'transparent',
            color: 'var(--text)',
            transition: 'background-color 0.1s',
          }}
        >
          <span style={{ fontSize: '16px', flexShrink: 0 }}>{cmd.icon}</span>
          <span style={{ fontWeight: 500 }}>{cmd.command}</span>
          <span
            style={{
              color: 'var(--muted)',
              fontSize: '12px',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cmd.description}
          </span>
        </button>
      ))}
    </div>
  )
}
