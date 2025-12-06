function replaceNaN(num: number): number {
  if (isNaN(num)) { return 0 }
  return num
}

// note milliseconds are truncated
// note > 24 hurs will show as 25+ hour, therefore the result is not a time
export function msToFormattedTime(duration: number): string {
  const seconds = replaceNaN(Math.floor((duration / 1000) % 60))
    .toString()
    .padStart(2, '0')
  const minutes = replaceNaN(Math.floor((duration / (1000 * 60)) % 60))
    .toString()
    .padStart(2, '0')
  const hours = replaceNaN(Math.floor((duration / (1000 * 60 * 60))))
    .toString()
    .padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

export function msToFormattedHourMinute(duration: number): string {
  const minutes = replaceNaN(Math.floor((duration / (1000 * 60)) % 60))
    .toString()
    .padStart(2, '0')
  const hours = replaceNaN(Math.floor((duration / (1000 * 60 * 60)) % 24))
    .toString()
    .padStart(2, '0')

  return `${hours}:${minutes}`
}

export function msToFormattedDay(duration: number): string {
  const days = replaceNaN(Math.floor((duration / (24 * 1000 * 60 * 60))))
    .toString()

  return `Day ${days}`
}

export function roundToMinute(milliseconds: number) {
  return Math.round(milliseconds / 60000) * 60000
}
