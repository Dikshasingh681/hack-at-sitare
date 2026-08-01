import { useCallback, useState } from 'react'
import { analyzeFeedback, getErrorMessage } from '../api/client'

/**
 * Encapsulates the full lifecycle of running an analysis: idle -> loading ->
 * success/error. Keeping this in a hook lets the Dashboard and Upload
 * components stay focused on presentation.
 */
export function useAnalysis() {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const runAnalysis = useCallback(async (reviews) => {
    setStatus('loading')
    setError(null)
    try {
      const result = await analyzeFeedback(reviews)
      setData(result)
      setStatus('success')
      return result
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      setStatus('error')
      throw err
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setData(null)
    setError(null)
  }, [])

  return { status, data, error, runAnalysis, reset }
}
