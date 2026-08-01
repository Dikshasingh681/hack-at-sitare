import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { UploadCloud, FileJson, X, Wand2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const SAMPLE_REVIEWS = [
  { id: 1, review: 'App crashes while uploading image.' },
  { id: 2, review: 'Application closes every time I attach a photo.' },
  { id: 3, review: 'Force stop happens during image upload on Android.' },
  { id: 4, review: 'Dark mode would be great for night use.' },
  { id: 5, review: 'Please add a dark theme option, my eyes hurt at night.' },
  { id: 6, review: 'Payment fails randomly at checkout, lost my order twice.' },
  { id: 7, review: 'Checkout keeps declining my card even though it works elsewhere.' },
  { id: 8, review: 'Search results take forever to load, really slow.' },
  { id: 9, review: 'Love the new onboarding flow, super smooth!' },
  { id: 10, review: 'Cannot log in with Google anymore, auth keeps failing.' },
  { id: 11, review: 'Push notifications arrive hours late.' },
  { id: 12, review: 'The export to PDF feature is broken, produces blank pages.' },
]

function validateReviews(json) {
  if (!Array.isArray(json)) {
    throw new Error('The JSON file must contain an array of reviews.')
  }
  if (json.length === 0) {
    throw new Error('The file has no reviews to analyze.')
  }
  json.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Item at index ${index} is not an object.`)
    }
    if (item.id === undefined || item.review === undefined) {
      throw new Error(`Item at index ${index} is missing "id" or "review".`)
    }
    if (typeof item.review !== 'string' || item.review.trim().length === 0) {
      throw new Error(`Item at index ${index} has an empty "review" field.`)
    }
  })
  return json
}

export default function UploadZone({ onAnalyze, isAnalyzing }) {
  const [fileName, setFileName] = useState(null)
  const [reviews, setReviews] = useState(null)
  const [progress, setProgress] = useState(0)
  const toast = useToast()

  const readFile = useCallback((file) => {
    setProgress(0)
    const reader = new FileReader()

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const validated = validateReviews(parsed)
        setReviews(validated)
        setFileName(file.name)
        setProgress(100)
        toast.success(`Loaded ${validated.length} reviews from ${file.name}`)
      } catch (err) {
        toast.error(err.message || 'Could not parse that file as valid review JSON.')
        setFileName(null)
        setReviews(null)
        setProgress(0)
      }
    }

    reader.onerror = () => {
      toast.error('Failed to read the file.')
      setProgress(0)
    }

    reader.readAsText(file)
  }, [toast])

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles?.length) {
      toast.error('Only .json files are supported.')
      return
    }
    const file = acceptedFiles[0]
    if (file) readFile(file)
  }, [readFile, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/json': ['.json'] },
    maxFiles: 1,
    disabled: isAnalyzing,
  })

  const loadSample = () => {
    setReviews(SAMPLE_REVIEWS)
    setFileName('sample-feedback.json')
    setProgress(100)
    toast.info(`Loaded ${SAMPLE_REVIEWS.length} sample reviews`)
  }

  const clearFile = () => {
    setReviews(null)
    setFileName(null)
    setProgress(0)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={[
          'relative rounded-2xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer',
          isDragActive
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
            : 'border-slate-300 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-500/60',
          isAnalyzing && 'opacity-60 pointer-events-none',
        ].filter(Boolean).join(' ')}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ y: isDragActive ? -4 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="h-14 w-14 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <UploadCloud className="h-6 w-6 text-brand-500" />
          </div>
          <p className="font-display font-semibold text-slate-800 dark:text-white">
            {isDragActive ? 'Drop the JSON file here' : 'Drag & drop your feedback JSON'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            or click to browse — expects an array of <code className="font-mono">{'{ id, review }'}</code>
          </p>
        </motion.div>
      </div>

      {fileName && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mt-4 px-4 py-3 flex items-center gap-3"
        >
          <FileJson className="h-5 w-5 text-brand-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-slate-800 dark:text-slate-100">{fileName}</p>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-brand-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{reviews?.length ?? 0} reviews ready</p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            aria-label="Remove file"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          type="button"
          className="btn-primary min-w-[180px]"
          disabled={!reviews || isAnalyzing}
          onClick={() => onAnalyze(reviews)}
        >
          {isAnalyzing ? 'Analyzing…' : 'Analyze Feedback'}
        </button>
        <button type="button" className="btn-secondary" onClick={loadSample} disabled={isAnalyzing}>
          <Wand2 className="h-4 w-4" />
          Try sample data
        </button>
      </div>
    </div>
  )
}
