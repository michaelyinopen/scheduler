import { msToFormattedDay, msToFormattedHourMinute } from '../../utils/time'

export const maxMajorTickMarksOnScreen = 8
export const maxMinorTickMarksOnScreen = 16

export const tickMarkLevelDetails = {
  '1m': { stepMs: 60000, formatter: msToFormattedHourMinute, minWidthRem: 3 },
  '5m': { stepMs: 300000, formatter: msToFormattedHourMinute, minWidthRem: 3 },
  '10m': { stepMs: 600000, formatter: msToFormattedHourMinute, minWidthRem: 3 },
  '30m': { stepMs: 1800000, formatter: msToFormattedHourMinute, minWidthRem: 3 },
  '1h': { stepMs: 3600000, formatter: msToFormattedHourMinute, minWidthRem: 3 },
  '6h': { stepMs: 21600000, formatter: msToFormattedHourMinute, minWidthRem: 3 },
  '12h': { stepMs: 43200000, formatter: msToFormattedHourMinute, minWidthRem: 3 },
  '1D': { stepMs: 86400000, formatter: msToFormattedDay, minWidthRem: 3.5 },
} as const

export type TickMarkLevel = keyof typeof tickMarkLevelDetails

function getTickMarkLevel(
  maxCountOnScreen: number,
  durationMs: number,
  timeAxisWidthPx: number,
  remToPxMultiplier: number
): TickMarkLevel {
  for (const [tickMarkLevel, detail] of Object.entries(tickMarkLevelDetails)) {
    const maxCountByWidth = Math.ceil(timeAxisWidthPx / (detail.minWidthRem * remToPxMultiplier))
    const actualMaxCount = Math.min(maxCountOnScreen, maxCountByWidth)
    if (durationMs <= actualMaxCount * detail.stepMs) {
      return tickMarkLevel as TickMarkLevel
    }
  }
  return '1D';
}

export const tickMarkType = {
  major: 'major',
  minor: 'minor',
} as const

export type TickMarkType = typeof tickMarkType[keyof typeof tickMarkType]

export type TickMarkTime = {
  key: string
  timeMs: number
  type: TickMarkType
  text: string
}

export function getViewTickMarkLevels(viewDurationMs: number, timeAxisWidthPx: number, remToPxMultiplier: number)
  : { majorTickMarkLevel: TickMarkLevel, minorTickMarkLevel: TickMarkLevel } {
  const majorTickMarkLevel = getTickMarkLevel(maxMajorTickMarksOnScreen, viewDurationMs, timeAxisWidthPx, remToPxMultiplier)
  const minorTickMarkLevel = getTickMarkLevel(maxMinorTickMarksOnScreen, viewDurationMs, timeAxisWidthPx, remToPxMultiplier)
  return {
    majorTickMarkLevel,
    minorTickMarkLevel,
  }
}

// memoize this function
// assumes major tick mark's stepMs is a multiple of minor tick mark's stepMs
export function getTickMarkTimes(maxTimeMs: number, majorTickMarkLevel: TickMarkLevel, minorTickMarkLevel: TickMarkLevel)
  : TickMarkTime[] {
  const hasMinorTickMarks = majorTickMarkLevel !== minorTickMarkLevel

  const stepMs = hasMinorTickMarks
    ? tickMarkLevelDetails[minorTickMarkLevel].stepMs
    : tickMarkLevelDetails[majorTickMarkLevel].stepMs

  const majorTickMarkLevelSteps = tickMarkLevelDetails[majorTickMarkLevel].stepMs

  let currentTimeMs = 0
  let timeUntilNextMajorTickMark = 0
  const tickMarkTimes: TickMarkTime[] = []

  while (currentTimeMs <= maxTimeMs) {
    if (timeUntilNextMajorTickMark === 0) {
      tickMarkTimes.push({
        key: `major-tick-mark-${currentTimeMs}`,
        type: tickMarkType.major,
        timeMs: currentTimeMs,
        text: tickMarkLevelDetails[majorTickMarkLevel].formatter(currentTimeMs),
      })

      timeUntilNextMajorTickMark = majorTickMarkLevelSteps - stepMs
    } else {
      tickMarkTimes.push({
        key: `minor-tick-mark-${currentTimeMs}`,
        type: tickMarkType.minor,
        timeMs: currentTimeMs,
        text: tickMarkLevelDetails[minorTickMarkLevel].formatter(currentTimeMs),
      })

      timeUntilNextMajorTickMark = timeUntilNextMajorTickMark - stepMs
    }

    currentTimeMs = currentTimeMs + stepMs
  }

  return tickMarkTimes
}
