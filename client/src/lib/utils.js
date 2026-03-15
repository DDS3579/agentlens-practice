
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format, isValid } from "date-fns"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format duration from milliseconds to human readable
export function formatDuration(ms) {
  if (ms < 1000) return '< 1s'
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}

// Format file size in bytes to human readable
export function formatFileSize(bytes) {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1000000) return `${(bytes / 1000).toFixed(1)} KB`
  return `${(bytes / 1000000).toFixed(1)} MB`
}

// Extract repo name from GitHub URL
export function extractRepoName(url) {
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`
    }
    return url
  } catch {
    return url
  }
}

// Truncate text with ellipsis
export function truncate(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Copy text to clipboard, returns Promise<boolean>
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch {
      return false
    }
  }
}

// Format a date to relative time with fallback
export function formatRelativeTime(date) {
  try {
    const d = date instanceof Date ? date : new Date(date)
    if (!isValid(d)) {
      return 'Invalid date'
    }
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    try {
      const d = date instanceof Date ? date : new Date(date)
      return format(d, 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
  }
}

// Debounce a function
export function debounce(fn, delay) {
  let timeoutId
  const debounced = (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
  debounced.cancel = () => clearTimeout(timeoutId)
  return debounced
}

// Generate a random ID (for temporary IDs before server response)
export function generateTempId() {
  return `tmp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Check if a string is a valid GitHub URL
export function isValidGithubUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'github.com' && parsed.hostname !== 'www.github.com') {
      return false
    }
    const parts = parsed.pathname.split('/').filter(Boolean)
    return parts.length >= 2
  } catch {
    return false
  }
}
