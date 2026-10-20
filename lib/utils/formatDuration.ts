export function formatDuration(seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {return '—'}
  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60
  if (hours > 0) {return `${hours}h ${minutes}m ${remainingSeconds}s`}
  if (minutes > 0) {return `${minutes}m ${remainingSeconds}s`}
  return `${remainingSeconds}s`
}

export function elapsedSeconds(startedAt: string | null | undefined, submittedAt: string | null | undefined): number | null {
  if (!startedAt || !submittedAt) {return null}
  const start = Date.parse(startedAt)
  const end = Date.parse(submittedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {return null}
  return (end - start) / 1000
}

export function getValidDurationSeconds(
  startedAt: string | null | undefined,
  submittedAt: string | null | undefined,
  durationMinutes: number | null | undefined,
): number | null {
  const seconds = elapsedSeconds(startedAt, submittedAt)
  if (seconds === null) {return null}
  if (durationMinutes !== null && durationMinutes !== undefined && seconds > (durationMinutes + 5) * 60) {return null}
  return seconds
}
