import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://agnidrav.onrender.com' : 'http://localhost:8000')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Extracts a human-readable message from an Axios/FastAPI error.
 */
export function getErrorMessage(error) {
  if (error?.response?.data?.detail) {
    return error.response.data.detail
  }
  if (error?.message) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

/**
 * POST /analyze - send raw reviews, get back the full structured analysis.
 */
export async function analyzeFeedback(reviews) {
  const response = await apiClient.post('/analyze', { reviews })
  return response.data
}

/**
 * Triggers a browser download for a blob response.
 */
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const EXPORT_CONFIG = {
  json: { path: '/export/json', filename: 'analysis.json' },
  csv: { path: '/export/csv', filename: 'analysis.csv' },
  xlsx: { path: '/export/xlsx', filename: 'analysis.xlsx' },
  prd: { path: '/export/prd', filename: 'PRD.md' },
  tasks: { path: '/export/tasks', filename: 'EngineeringTasks.json' },
}

/**
 * Downloads one of the supported export formats for a given analysis result.
 * @param {'json'|'csv'|'xlsx'|'prd'|'tasks'} format
 * @param {object} analysis - the AnalyzeResponse object already fetched from /analyze
 */
export async function exportAnalysis(format, analysis) {
  const config = EXPORT_CONFIG[format]
  if (!config) {
    throw new Error(`Unknown export format: ${format}`)
  }
  const response = await apiClient.post(config.path, { analysis }, { responseType: 'blob' })
  downloadBlob(response.data, config.filename)
}
