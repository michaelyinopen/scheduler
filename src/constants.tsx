export const throttleDelayMs = 16
export const closeDelayMs = 200

export const defaultJobSetId = 1
export const availableJobSetIds = [1, 2, 3]
export const availableSolutionJobSetIds = [1, 2]

export const serverReplicaId = 1

export function isValidJobSetId(jobSetId: number | undefined) {
  return jobSetId !== undefined
    && !isNaN(jobSetId)
    && availableJobSetIds.includes(jobSetId)
}

export function isValidSolutionJobSetId(jobSetId: number | undefined) {
  return jobSetId !== undefined
    && !isNaN(jobSetId)
    && availableSolutionJobSetIds.includes(jobSetId)
}

export const maxTopPositionMapIteration = 100
export const maxTaskHeightLevelsIteration = 100 // ~max tasks for a machine

export const touchDragActivationDelayMs = 250
export const touchDragActivationTolerancePx = 5

// used as fallback
export const exampleTitles = {
  1: 'Example 1: Schedule',
  2: 'Example 2: Optimise',
}

// prioritise this description over the description in crdt
export const exampleDescriptions = {
  1: (<>
    Welcome to <b>Scheduler</b> for the <a href="https://en.wikipedia.org/wiki/Job-shop_scheduling" target="_blank">job shop scheduling problem</a>.<br />
    This example has 3 jobs. Each job contains several procedures that have to be performed on specified machines, in order.<br />
    Drag the procedures to the timeline, until all procedures are scheduled and there are no conflicts.
  </>)
}

export const colorPickerDebounceDelayMs = 200

export const emptyMachineTitle = 'M‒' // figure dash, also used for deleted machine
