import { type FormData, type LwwRegister, type VectorClock, elementType } from '@michaelyinopen/scheduler-common';
import { serverReplicaId } from './constants.ts';

function wrapLwwRegisterValue<T>(value: T): LwwRegister<T> {
  return {
    timestamp: 0,
    origin: serverReplicaId,
    value,
  }
}

const example1: FormData = {
  title: wrapLwwRegisterValue('Example 1: Schedule',),
  description: wrapLwwRegisterValue( // hard coded in client so to insert links
    "Welcome to Scheduler for the job shop scheduling problem.\n" +
    "This example has 3 jobs. Each job contains several procedures that have to be performed on specified machines, in order.\n" +
    "Drag the procedures to the timeline, until all procedures are scheduled and there are no conflicts."
  ),
  machines: {
    blocks: [
      {
        id: '1.1',
        originLeft: undefined,
        originRight: undefined,
      },
      {
        id: '1.2',
        originLeft: '1.1',
        originRight: undefined,
      },
      {
        id: '1.3',
        originLeft: '1.2',
        originRight: undefined,
      },
      {
        id: '1.4',
        originLeft: '1.3',
        originRight: undefined,
      },
    ],
    elements: {
      '1.1': {
        type: elementType.value,
        version: { '1': 1 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('M1'),
          description: wrapLwwRegisterValue('Machine 1'),
        },
      },
      '1.2': {
        type: elementType.value,
        version: { '1': 2 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('M2'),
          description: wrapLwwRegisterValue('Machine 2'),
        },
      },
      '1.3': {
        type: elementType.value,
        version: { '1': 3 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('M3'),
          description: wrapLwwRegisterValue('Machine 3'),
        },
      },
      '1.4': {
        type: elementType.value,
        version: { '1': 4 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('M4'),
          description: wrapLwwRegisterValue('Machine 4'),
        },
      },
    },
  },
  jobs: {
    blocks: [
      {
        id: '1.5',
        originLeft: undefined,
        originRight: undefined,
      },
      {
        id: '1.6',
        originLeft: '1.5',
        originRight: undefined,
      },
      {
        id: '1.7',
        originLeft: '1.6',
        originRight: undefined,
      },
    ],
    elements: {
      '1.5': {
        type: elementType.value,
        version: { '1': 5 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('1'),
          color: wrapLwwRegisterValue('#3cb44b'),
          procedures: {
            blocks: [
              {
                id: '1.8',
                originLeft: undefined,
                originRight: undefined,
              },
              {
                id: '1.9',
                originLeft: '1.8',
                originRight: undefined,
              },
              {
                id: '1.10',
                originLeft: '1.9',
                originRight: undefined,
              },
            ],
            elements: {
              '1.8': {
                type: elementType.value,
                version: { '1': 8 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.1'),
                  processingTimeMs: wrapLwwRegisterValue(600000),
                },
              },
              '1.9': {
                type: elementType.value,
                version: { '1': 9 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.2'),
                  processingTimeMs: wrapLwwRegisterValue(480000),
                },
              },
              '1.10': {
                type: elementType.value,
                version: { '1': 9 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.3'),
                  processingTimeMs: wrapLwwRegisterValue(240000),
                },
              },
            },
          },
        },
      },
      '1.6': {
        type: elementType.value,
        version: { '1': 6 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('2'),
          color: wrapLwwRegisterValue('#ffe119'),
          procedures: {
            blocks: [
              {
                id: '1.11',
                originLeft: undefined,
                originRight: undefined,
              },
              {
                id: '1.12',
                originLeft: '1.11',
                originRight: undefined,
              },
              {
                id: '1.13',
                originLeft: '1.12',
                originRight: undefined,
              },
              {
                id: '1.14',
                originLeft: '1.13',
                originRight: undefined,
              },
            ],
            elements: {
              '1.11': {
                type: elementType.value,
                version: { '1': 11 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.2'),
                  processingTimeMs: wrapLwwRegisterValue(480000),
                },
              },
              '1.12': {
                type: elementType.value,
                version: { '1': 12 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.1'),
                  processingTimeMs: wrapLwwRegisterValue(180000),
                },
              },
              '1.13': {
                type: elementType.value,
                version: { '1': 13 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.4'),
                  processingTimeMs: wrapLwwRegisterValue(300000),
                },
              },
              '1.14': {
                type: elementType.value,
                version: { '1': 14 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.3'),
                  processingTimeMs: wrapLwwRegisterValue(360000),
                },
              },
            },
          },
        },
      },
      '1.7': {
        type: elementType.value,
        version: { '1': 7 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('3'),
          color: wrapLwwRegisterValue('#4363d8'),
          procedures: {
            blocks: [
              {
                id: '1.15',
                originLeft: undefined,
                originRight: undefined,
              },
              {
                id: '1.16',
                originLeft: '1.15',
                originRight: undefined,
              },
              {
                id: '1.17',
                originLeft: '1.16',
                originRight: undefined,
              },
            ],
            elements: {
              '1.15': {
                type: elementType.value,
                version: { '1': 15 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.1'),
                  processingTimeMs: wrapLwwRegisterValue(240000),
                },
              },
              '1.16': {
                type: elementType.value,
                version: { '1': 16 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.2'),
                  processingTimeMs: wrapLwwRegisterValue(420000),
                },
              },
              '1.17': {
                type: elementType.value,
                version: { '1': 17 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.4'),
                  processingTimeMs: wrapLwwRegisterValue(180000),
                },
              },
            },
          },
        },
      },
    },
  },
  isAutoTimeOptions: false,
  manualTimeOptions: {
    maxTimeMs: 3600000,
    viewStartTimeMs: 0,
    viewEndTimeMs: 2400000,
    minViewDurationMs: 1800000,
    maxViewDurationMs: 3600000,
  },
  scheduledProcedureStartTimes: {},
  bestTotalTimeMs: 1680000,
}

const example2: FormData = {
  title: wrapLwwRegisterValue('Example 2: Optimise',),
  description: wrapLwwRegisterValue(
    "Drag the procedures to the timeline, until all procedures are scheduled and there are no conflicts.\n" +
    "See if you can create an optimal schedule that has the minimum total time!"
  ),
  machines: {
    blocks: [
      {
        id: '1.1',
        originLeft: undefined,
        originRight: undefined,
      },
      {
        id: '1.2',
        originLeft: '1.1',
        originRight: undefined,
      },
      {
        id: '1.3',
        originLeft: '1.2',
        originRight: undefined,
      },
    ],
    elements: {
      '1.1': {
        type: elementType.value,
        version: { '1': 1 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('M1'),
          description: wrapLwwRegisterValue('Machine 1'),
        },
      },
      '1.2': {
        type: elementType.value,
        version: { '1': 2 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('M2'),
          description: wrapLwwRegisterValue('Machine 2'),
        },
      },
      '1.3': {
        type: elementType.value,
        version: { '1': 3 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('M3'),
          description: wrapLwwRegisterValue('Machine 3'),
        },
      },
    },
  },
  jobs: {
    blocks: [
      {
        id: '1.4',
        originLeft: undefined,
        originRight: undefined,
      },
      {
        id: '1.5',
        originLeft: '1.4',
        originRight: undefined,
      },
      {
        id: '1.6',
        originLeft: '1.5',
        originRight: undefined,
      },
    ],
    elements: {
      '1.4': {
        type: elementType.value,
        version: { '1': 4 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('1'),
          color: wrapLwwRegisterValue('#3cb44b'),
          procedures: {
            blocks: [
              {
                id: '1.7',
                originLeft: undefined,
                originRight: undefined,
              },
              {
                id: '1.8',
                originLeft: '1.7',
                originRight: undefined,
              },
              {
                id: '1.9',
                originLeft: '1.8',
                originRight: undefined,
              },
            ],
            elements: {
              '1.7': {
                type: elementType.value,
                version: { '1': 7 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.1'),
                  processingTimeMs: wrapLwwRegisterValue(180000),
                },
              },
              '1.8': {
                type: elementType.value,
                version: { '1': 8 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.2'),
                  processingTimeMs: wrapLwwRegisterValue(120000),
                },
              },
              '1.9': {
                type: elementType.value,
                version: { '1': 9 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.3'),
                  processingTimeMs: wrapLwwRegisterValue(120000),
                },
              },
            },
          },
        },
      },
      '1.5': {
        type: elementType.value,
        version: { '1': 5 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('2'),
          color: wrapLwwRegisterValue('#ffe119'),
          procedures: {
            blocks: [
              {
                id: '1.10',
                originLeft: undefined,
                originRight: undefined,
              },
              {
                id: '1.11',
                originLeft: '1.10',
                originRight: undefined,
              },
              {
                id: '1.12',
                originLeft: '1.11',
                originRight: undefined,
              },
            ],
            elements: {
              '1.10': {
                type: elementType.value,
                version: { '1': 10 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.1'),
                  processingTimeMs: wrapLwwRegisterValue(120000),
                },
              },
              '1.11': {
                type: elementType.value,
                version: { '1': 11 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.3'),
                  processingTimeMs: wrapLwwRegisterValue(60000),
                },
              },
              '1.12': {
                type: elementType.value,
                version: { '1': 12 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.2'),
                  processingTimeMs: wrapLwwRegisterValue(240000),
                },
              },
            },
          },
        },
      },
      '1.6': {
        type: elementType.value,
        version: { '1': 6 },
        isDeleted: false,
        value: {
          title: wrapLwwRegisterValue('3'),
          color: wrapLwwRegisterValue('#4363d8'),
          procedures: {
            blocks: [
              {
                id: '1.13',
                originLeft: undefined,
                originRight: undefined,
              },
              {
                id: '1.14',
                originLeft: '1.13',
                originRight: undefined,
              },
            ],
            elements: {
              '1.13': {
                type: elementType.value,
                version: { '1': 13 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.2'),
                  processingTimeMs: wrapLwwRegisterValue(240000),
                },
              },
              '1.14': {
                type: elementType.value,
                version: { '1': 14 },
                isDeleted: false,
                value: {
                  machineId: wrapLwwRegisterValue('1.3'),
                  processingTimeMs: wrapLwwRegisterValue(180000),
                },
              },
            },
          },
        },
      },
    },
  },
  isAutoTimeOptions: false,
  manualTimeOptions: {
    maxTimeMs: 1260000,
    viewStartTimeMs: 0,
    viewEndTimeMs: 780000,
    minViewDurationMs: 720000,
    maxViewDurationMs: 1260000,
  },
  scheduledProcedureStartTimes: {},
  bestTotalTimeMs: 660000,
}

export const exampleFormDatas = new Map<number, FormData>([
  [1, example1],
  [2, example2],
])

export const exampleOriginalVersions = new Map<number, VectorClock>([
  [1, { 1: 17 }],
  [2, { 1: 14 }],
])
