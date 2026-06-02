import { useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook that detects user inactivity and triggers a callback
 * @param {Function} onIdle - Callback function to execute when user is idle
 * @param {number} timeout - Timeout duration in milliseconds (default: 15 minutes)
 */
export function useIdleTimeout(onIdle, timeout = 15 * 60 * 1000) {
  const timeoutRef = useRef(null)

  const resetTimer = useCallback(() => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timer
    timeoutRef.current = setTimeout(() => {
      onIdle()
    }, timeout)
  }, [onIdle, timeout])

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer()
    }

    // Start the timer initially
    resetTimer()

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [resetTimer])
}
