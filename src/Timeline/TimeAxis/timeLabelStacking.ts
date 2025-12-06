import { maxTopPositionMapIteration } from '../../constants'

const gapPx = 4 // gap between time labels has a bottom margin

export const timeLabelPriority = {
  edgeLabel: 0,
  customLabel: 1,
} as const

export type TimeLabelPriority = typeof timeLabelPriority[keyof typeof timeLabelPriority]

export type TimeLabelData = {
  id: string
  priority: TimeLabelPriority // smaller number means placed first
  startPx: number
  widthRem: number
  heightRem: number
}

// for floating point number comparisons, deceided to use reference of 0.01px
const tolerance = 0.01

function timeLabelDataComparer(a: TimeLabelData, b: TimeLabelData) {
  // smaller priority first
  if (a.priority > b.priority) return 1
  if (a.priority < b.priority) return -1

  // greater startPx first
  if (a.startPx < b.startPx) return 1
  if (a.startPx > b.startPx) return -1

  // greater widthRem first
  if (a.widthRem < b.widthRem) return 1
  if (a.widthRem > b.widthRem) return -1

  // greater height first
  if (a.heightRem < b.heightRem) return 1
  if (a.heightRem > b.heightRem) return -1

  return 0
}

function overlapsPlacedTimeLabels(
  remToPxMultiplier: number,
  timeAxisWidthPx: number,
  placedTimeLabels: TimeLabelData[],
  topPositionMap: Record<string, number>,
  currentHeightLevel: number,
  current: TimeLabelData
) {
  for (const placed of placedTimeLabels) {
    const placedTopPosition = topPositionMap[placed.id]
    const placedBottomPosition = placed.heightRem * remToPxMultiplier + placedTopPosition
    if (placedBottomPosition + gapPx <= currentHeightLevel + tolerance) {
      continue
    }

    const currentBottomPosition = currentHeightLevel + current.heightRem * remToPxMultiplier
    if (placedTopPosition + tolerance > currentBottomPosition + gapPx) {
      continue
    }

    const placedEndPx = Math.min(timeAxisWidthPx, placed.startPx + placed.widthRem * remToPxMultiplier)
    const placedStartPx = placedEndPx - placed.widthRem * remToPxMultiplier
    const currentEndPx = Math.min(timeAxisWidthPx, current.startPx + current.widthRem * remToPxMultiplier)
    const currentStartPx = currentEndPx - current.widthRem * remToPxMultiplier

    if (placedEndPx + tolerance > currentStartPx && placedStartPx < currentEndPx + tolerance) {
      return true
    }
  }

  return false
}

function getNextHeightLevel(
  remToPxMultiplier: number,
  placedTimeLabels: TimeLabelData[],
  topPositionMap: Record<string, number>,
  currentHeightLevel: number
) {
  let minimumNextHeightLevel: number | undefined = undefined

  for (const placed of placedTimeLabels) {
    const potentialHeightLevel = placed.heightRem * remToPxMultiplier + topPositionMap[placed.id] + gapPx

    if (potentialHeightLevel + tolerance > currentHeightLevel
      && (minimumNextHeightLevel === undefined || potentialHeightLevel + tolerance > minimumNextHeightLevel)
    ) {
      minimumNextHeightLevel = potentialHeightLevel
    }
  }

  return minimumNextHeightLevel
}

export type TopPositionMapResult = {
  topPositionMap: Record<string, number>
  totalHeightPx: number
}

export function calculateTopPositionMap(remToPxMultiplier: number, timeAxisWidthPx: number, timeLabels: TimeLabelData[]): TopPositionMapResult {
  const placedTimeLabels: TimeLabelData[] = [] // mutates
  const topPositionMap: Record<string, number> = {} // mutates
  let totalHeightPx = 0

  // to be processed back-to-front to reduce re-indexing
  const remainingTimeLabels = timeLabels.toSorted((a, b) => -timeLabelDataComparer(a, b)) // cloned, mutates

  let currentHeightLevel = 0
  let currentIteration = 0

  while (remainingTimeLabels.length > 0 && currentIteration <= maxTopPositionMapIteration) {
    currentIteration = currentIteration + 1

    const currentTimeLabelIndex = remainingTimeLabels
      .findLastIndex(r => !overlapsPlacedTimeLabels(remToPxMultiplier, timeAxisWidthPx, placedTimeLabels, topPositionMap, currentHeightLevel, r))

    if (currentTimeLabelIndex === -1) {
      const nextHeightLevel = getNextHeightLevel(remToPxMultiplier, placedTimeLabels, topPositionMap, currentHeightLevel)
      if (nextHeightLevel === undefined) {
        // put all remaining to the last height level
        for (const remainingTimeLabel of remainingTimeLabels) {
          topPositionMap[remainingTimeLabel.id] = currentHeightLevel

          const totalHeightPxOfCurrentTimeLabel = currentHeightLevel + remainingTimeLabel.heightRem * remToPxMultiplier
          if (totalHeightPxOfCurrentTimeLabel > totalHeightPx) {
            totalHeightPx = totalHeightPxOfCurrentTimeLabel
          }
        }

        break
      }
      currentHeightLevel = nextHeightLevel
      continue
    }

    const currentTimeLabel = remainingTimeLabels[currentTimeLabelIndex]

    topPositionMap[currentTimeLabel.id] = currentHeightLevel
    remainingTimeLabels.splice(currentTimeLabelIndex, 1)
    placedTimeLabels.push(currentTimeLabel)

    const totalHeightPxOfCurrentTimeLabel = currentHeightLevel + currentTimeLabel.heightRem * remToPxMultiplier
    if (totalHeightPxOfCurrentTimeLabel > totalHeightPx) {
      totalHeightPx = totalHeightPxOfCurrentTimeLabel
    }
  }

  return { topPositionMap, totalHeightPx }
}
