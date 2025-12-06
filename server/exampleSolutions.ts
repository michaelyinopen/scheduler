import {
  type ElementId,
  type LwwRegister
} from '@michaelyinopen/scheduler-common';


const solution1: Record<ElementId, number> = {
  '1.7': 0,
  '1.8': 600000,
  '1.9': 1080000,
  '1.10': 0,
  '1.11': 600000,
  '1.12': 780000,
  '1.13': 1420000,
  '1.14': 780000,
  '1.15': 1080000,
  '1.16': 1500000,
}

const solution2: Record<ElementId, number> = {
  '1.7': 0,
  '1.8': 240000,
  '1.9': 360000,
  '1.10': 180000,
  '1.11': 300000,
  '1.12': 360000,
  '1.13': 0,
  '1.14': 480000,
}

export const exampleSolutions = new Map<number, Record<ElementId, number>>([
  [1, solution1],
  [2, solution2],
])
