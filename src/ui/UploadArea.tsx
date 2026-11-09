import { useId, useRef, useState, type DragEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import { Button } from './Button'
import { cx } from './cx'
import styles from './UploadArea.module.css'

type Props = {
  /** Same format as the input's accept attribute, e.g. ".csv,.xlsx,.pdf". */
  accept?: string
  /** Maximum file size in bytes. */
  maxSize?: number
  onFile: (file: File) => void
  title?: string
  description?: string
  /** 0–100 while the file is being processed; undefined when idle. */
  progress?: number
  /** Error from the caller (e.g. unreadable file). */
  error?: string
  disabled?: boolean
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))}MB` : `${Math.round(bytes / 1024)}KB`
}

/** Drag-and-drop area plus a "choose file" button. Only selection here; parsing happens elsewhere. */
export function UploadArea({
  accept,
  maxSize,
  onFile,
  title = 'גררו קובץ לכאן',
  description,
  progress,
  error,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const [dragging, setDragging] = useState(false)
  const [sizeError, setSizeError] = useState('')
  const busy = progress !== undefined
  const shownError = sizeError || error
  const inactive = disabled || busy

  function take(file: File | undefined) {
    if (!file) return
    if (maxSize !== undefined && file.size > maxSize) {
      setSizeError(`הקובץ גדול מדי. הגודל המרבי הוא ${formatSize(maxSize)}.`)
      return
    }
    setSizeError('')
    onFile(file)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (!inactive) take(e.dataTransfer.files[0])
  }

  return (
    <div
      className={cx(styles.area, dragging && styles.dragging, shownError && styles.invalid, inactive && styles.inactive)}
      onDragOver={(e) => {
        e.preventDefault()
        if (!inactive) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      data-testid="upload-area"
    >
      <UploadCloud size={40} strokeWidth={1.4} aria-hidden="true" className={styles.icon} />
      <p className={styles.title}>{busy ? 'מעבד את הקובץ…' : title}</p>
      {description && !busy && (
        <p id={`${id}-desc`} className={styles.description}>
          {description}
        </p>
      )}

      {busy ? (
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="התקדמות העיבוד"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      ) : (
        <Button variant="secondary" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
          בחירת קובץ
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="visually-hidden"
        tabIndex={-1}
        aria-label="בחירת קובץ"
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={inactive}
        onChange={(e) => {
          take(e.target.files?.[0])
          e.target.value = '' // allow choosing the same file again
        }}
      />

      {shownError && (
        <p className={styles.error} role="alert">
          {shownError}
        </p>
      )}
    </div>
  )
}
