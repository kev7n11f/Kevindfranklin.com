import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Keyboard shortcuts hook
 * Provides global keyboard shortcuts for navigation and actions
 *
 * Shortcuts:
 * - g + d: Go to Dashboard
 * - g + r: Go to Drafts
 * - g + a: Go to Analytics
 * - g + u: Go to Rules
 * - g + b: Go to Budget
 * - g + s: Go to Settings
 * - /: Focus search (if on dashboard)
 * - c: Compose new email
 * - r: Refresh/sync
 * - ?: Show shortcuts help
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate()

  useEffect(() => {
    let lastKey = null
    let lastKeyTime = 0

    const handleKeyPress = (event) => {
      const target = event.target
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Don't trigger shortcuts when typing in input fields (except for specific keys)
      if (isInput && event.key !== 'Escape') {
        return
      }

      const currentTime = Date.now()
      const timeSinceLastKey = currentTime - lastKeyTime

      // Escape key - always works to blur/cancel
      if (event.key === 'Escape') {
        if (document.activeElement) {
          document.activeElement.blur()
        }
        return
      }

      // Check for command sequences (like 'g' + 'd')
      if (lastKey === 'g' && timeSinceLastKey < 1000) {
        event.preventDefault()

        switch (event.key) {
          case 'd':
            navigate('/dashboard')
            break
          case 'r':
            navigate('/drafts')
            break
          case 'a':
            navigate('/analytics')
            break
          case 'u':
            navigate('/rules')
            break
          case 'b':
            navigate('/budget')
            break
          case 's':
            navigate('/settings')
            break
        }

        lastKey = null
        return
      }

      // Single key shortcuts (only when not in input)
      if (!isInput) {
        switch (event.key) {
          case 'g':
            lastKey = 'g'
            lastKeyTime = currentTime
            break

          case '/':
            event.preventDefault()
            // Focus search input if on dashboard
            const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]')
            if (searchInput) {
              searchInput.focus()
            }
            break

          case '?':
            event.preventDefault()
            showShortcutsHelp()
            break

          case 'r':
            // Only if not after 'g'
            if (lastKey !== 'g') {
              event.preventDefault()
              // Trigger sync
              let syncButton = document.querySelector('button:has(svg[class*="animate-spin"])');
              if (!syncButton) {
                syncButton = Array.from(document.querySelectorAll('button')).find(
                  btn => btn.textContent && btn.textContent.trim() === "Sync"
                );
              }
              if (syncButton && !syncButton.disabled) {
                syncButton.click()
              }
            }
            break

          default:
            lastKey = null
        }
      }

      // Reset lastKey after 1 second
      setTimeout(() => {
        if (lastKey === 'g') lastKey = null
      }, 1000)
    }

    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [navigate])
}

const showShortcutsHelp = () => {
  const helpText = `
Keyboard Shortcuts:

Navigation:
  g + d     Go to Dashboard
  g + r     Go to Drafts
  g + a     Go to Analytics
  g + u     Go to Rules
  g + b     Go to Budget
  g + s     Go to Settings

Actions:
  /         Focus search
  r         Refresh/sync emails
  Esc       Cancel/blur input
  ?         Show this help

Tips:
- Press 'g' followed by a letter to navigate
- Most shortcuts don't work when typing in input fields
- Press 'Esc' to cancel any input operation
  `.trim()

  alert(helpText)
}

export default useKeyboardShortcuts
