import { useState, useRef } from 'react'
import { CloudUpload, Image as ImageIcon } from 'lucide-react'
import { ALLOWED_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE } from '../../config'
import { useConnection } from '../../context/ConnectionContext'

function isValidImage(file) {
  const typeOk = ALLOWED_TYPES.includes(file.type)
  const extOk = ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
  return (typeOk || extOk) && file.size <= MAX_FILE_SIZE
}

function getErrorMessage(file) {
  const typeOk = ALLOWED_TYPES.includes(file.type)
  const extOk = ALLOWED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
  const typeBad = !typeOk && !extOk
  const sizeBad = file.size > MAX_FILE_SIZE
  if (typeBad) return 'Unsupported image format.'
  if (sizeBad) return 'Image exceeds 20 MB limit.'
  return 'Invalid image.'
}

export default function UploadZone({ disabled, onAddFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)
  const { status } = useConnection()

  function handleFiles(files) {
    const array = Array.from(files)
    const valid = []
    const errors = []
    for (const file of array) {
      if (isValidImage(file)) {
        valid.push(file)
      } else {
        errors.push({ filename: file.name, error: getErrorMessage(file) })
      }
    }
    onAddFiles(valid, errors)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }

  function handleFileInput(e) {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={e => { e.preventDefault(); setDragging(false) }}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center
        border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center
        transition-all duration-200 min-h-[240px]
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-accent/60 hover:bg-accent/5'}
        ${dragging ? 'border-accent bg-accent/10 scale-[1.01]' : 'border-dark-600/60 bg-dark-900/40'}
      `}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label="Upload images"
      onClick={() => { if (!disabled) inputRef.current?.click() }}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) inputRef.current?.click() } }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        onChange={handleFileInput}
        className="hidden"
        aria-label="File selection"
      />

      <div className="mb-4">
        <CloudUpload className={`w-10 h-10 ${dragging ? 'text-accent' : 'text-dark-500'}`} />
      </div>

      <div className="text-base sm:text-lg font-medium text-dark-200 mb-1.5">
        {disabled ? 'AI server unavailable' : 'Drop your images here'}
      </div>
      <div className="text-sm text-dark-500 mb-3">
        {disabled ? (
          'Connect your AI server in Settings to continue'
        ) : (
          <>or <span className="text-accent">click to browse files</span></>
        )}
      </div>
      <div className="text-xs text-dark-600">
        JPG • PNG • WEBP • AVIF&nbsp;&nbsp;·&nbsp;&nbsp;Max 20 MB each
      </div>
    </div>
  )
}
