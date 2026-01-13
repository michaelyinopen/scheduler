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
  allowExpand: true,
}

const example3 = {
  title: wrapLwwRegisterValue("Example 3: Expand and collaborate"),
  description: wrapLwwRegisterValue("Expand your shop by creating your own schedule!\nAll examples allow collaborative editing with a friend (or two browsers)."),
  machines: {
    "blocks": [
      {
        "id": "1.1"
      },
      {
        "id": "1.2",
        "originLeft": "1.1"
      },
      {
        "id": "1.3",
        "originLeft": "1.2"
      },
      {
        "id": "1.4",
        "originLeft": "1.3"
      }
    ],
    "elements": {
      "1.1": {
        "type": "value",
        "version": {
          "1": 1
        },
        "isDeleted": false,
        "value": {
          "title": wrapLwwRegisterValue("M1"),
          "description": wrapLwwRegisterValue("Machine 1")
        }
      },
      "1.2": {
        "type": "value",
        "version": {
          "1": 2
        },
        "isDeleted": false,
        "value": {
          "title": wrapLwwRegisterValue("M2"),
          "description": wrapLwwRegisterValue("Machine 2")
        }
      },
      "1.3": {
        "type": "value",
        "version": {
          "1": 3
        },
        "isDeleted": false,
        "value": {
          "title": wrapLwwRegisterValue("M3"),
          "description": wrapLwwRegisterValue("Machine 3")
        }
      },
      "1.4": {
        "type": "value",
        "version": {
          "1": 4
        },
        "isDeleted": false,
        "value": {
          "title": {
            "timestamp": 1768266539928,
            "origin": 6,
            "value": "M4"
          },
          "description": {
            "timestamp": 1768266491003,
            "origin": 6,
            "value": "Machine 4"
          }
        }
      }
    }
  },
  "jobs": {
    "blocks": [
      {
        "id": "1.5"
      },
      {
        "id": "1.6",
        "originLeft": "1.5"
      },
      {
        "id": "1.7",
        "originLeft": "1.6"
      },
      {
        "id": "1.8",
        "originLeft": "1.7"
      }
    ],
    "elements": {
      "1.5": {
        "type": "value",
        "version": {
          "1": 5
        },
        "isDeleted": false,
        "value": {
          "title": {
            "timestamp": 1768266544495,
            "origin": 6,
            "value": "1"
          },
          "color": {
            "timestamp": 1768266497634,
            "origin": 6,
            "value": "#3cb44b"
          },
          "procedures": {
            "blocks": [
              {
                "id": "1.9"
              },
              {
                "id": "1.10",
                "originLeft": "1.9"
              },
              {
                "id": "1.11",
                "originLeft": "1.10"
              },
              {
                "id": "1.12",
                "originLeft": "1.11"
              }
            ],
            "elements": {
              "1.9": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 80
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266571229,
                    "origin": 6,
                    "value": 240000
                  },
                  "machineId": {
                    "timestamp": 1768266562646,
                    "origin": 6,
                    "value": "1.3"
                  }
                }
              },
              "1.10": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 81
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266507841,
                    "origin": 6,
                    "value": 300000
                  },
                  "machineId": {
                    "timestamp": 1768266574949,
                    "origin": 6,
                    "value": "1.2"
                  }
                }
              },
              "1.11": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 83
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266591466,
                    "origin": 6,
                    "value": 240000
                  },
                  "machineId": {
                    "timestamp": 1768266585060,
                    "origin": 6,
                    "value": "1.1"
                  }
                }
              },
              "1.12": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 85
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266596110,
                    "origin": 6,
                    "value": 240000
                  },
                  "machineId": {
                    "timestamp": 1768266594525,
                    "origin": 6,
                    "value": "1.4"
                  }
                }
              }
            }
          }
        }
      },
      "1.6": {
        "type": "value",
        "version": {
          "1": 6
        },
        "isDeleted": false,
        "value": {
          "title": {
            "timestamp": 1768266546998,
            "origin": 6,
            "value": "2"
          },
          "color": {
            "timestamp": 1768266498959,
            "origin": 6,
            "value": "#ffe119"
          },
          "procedures": {
            "blocks": [
              {
                "id": "1.13"
              },
              {
                "id": "1.14",
                "originLeft": "1.13"
              },
              {
                "id": "1.15",
                "originLeft": "1.14"
              },
              {
                "id": "1.16",
                "originLeft": "1.15"
              }
            ],
            "elements": {
              "1.13": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 86
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266514167,
                    "origin": 6,
                    "value": 300000
                  },
                  "machineId": {
                    "timestamp": 1768266620425,
                    "origin": 6,
                    "value": "1.4"
                  }
                }
              },
              "1.14": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 88
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266634619,
                    "origin": 6,
                    "value": 180000
                  },
                  "machineId": {
                    "timestamp": 1768266631143,
                    "origin": 6,
                    "value": "1.3"
                  }
                }
              },
              "1.15": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 90
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266643583,
                    "origin": 6,
                    "value": 180000
                  },
                  "machineId": {
                    "timestamp": 1768266641093,
                    "origin": 6,
                    "value": "1.2"
                  }
                }
              },
              "1.16": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 92
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266649895,
                    "origin": 6,
                    "value": 240000
                  },
                  "machineId": {
                    "timestamp": 1768266646654,
                    "origin": 6,
                    "value": "1.4"
                  }
                }
              }
            }
          }
        }
      },
      "1.7": {
        "type": "value",
        "version": {
          "1": 7
        },
        "isDeleted": false,
        "value": {
          "title": {
            "timestamp": 1768266549639,
            "origin": 6,
            "value": "3"
          },
          "color": {
            "timestamp": 1768266499541,
            "origin": 6,
            "value": "#4363d8"
          },
          "procedures": {
            "blocks": [
              {
                "id": "1.17"
              },
              {
                "id": "1.18",
                "originLeft": "1.17"
              },
              {
                "id": "1.19",
                "originLeft": "1.18"
              },
              {
                "id": "1.20",
                "originLeft": "1.19"
              }
            ],
            "elements": {
              "1.17": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 95
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266667746,
                    "origin": 6,
                    "value": 120000
                  },
                  "machineId": {
                    "timestamp": 1768266672618,
                    "origin": 6,
                    "value": "1.3"
                  }
                }
              },
              "1.18": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 99
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266696734,
                    "origin": 6,
                    "value": 180000
                  },
                  "machineId": {
                    "timestamp": 1768266682918,
                    "origin": 6,
                    "value": "1.1"
                  }
                }
              },
              "1.19": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 100
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266699172,
                    "origin": 6,
                    "value": 180000
                  },
                  "machineId": {
                    "timestamp": 1768266685789,
                    "origin": 6,
                    "value": "1.1"
                  }
                }
              },
              "1.20": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 101
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266701688,
                    "origin": 6,
                    "value": 240000
                  },
                  "machineId": {
                    "timestamp": 1768266688160,
                    "origin": 6,
                    "value": "1.4"
                  }
                }
              }
            }
          }
        }
      },
      "1.8": {
        "type": "value",
        "version": {
          "1": 8
        },
        "isDeleted": false,
        "value": {
          "title": {
            "timestamp": 1768266552257,
            "origin": 6,
            "value": "4"
          },
          "color": {
            "timestamp": 1768266500116,
            "origin": 6,
            "value": "#f58231"
          },
          "procedures": {
            "blocks": [
              {
                "id": "1.21"
              },
              {
                "id": "1.22",
                "originLeft": "1.21"
              },
              {
                "id": "1.23",
                "originLeft": "1.22"
              },
              {
                "id": "1.24",
                "originLeft": "1.23"
              }
            ],
            "elements": {
              "1.21": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 106
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266752371,
                    "origin": 6,
                    "value": 240000
                  },
                  "machineId": {
                    "timestamp": 1768266709021,
                    "origin": 6,
                    "value": "1.2"
                  }
                }
              },
              "1.22": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 107
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266755112,
                    "origin": 6,
                    "value": 240000
                  },
                  "machineId": {
                    "timestamp": 1768266712974,
                    "origin": 6,
                    "value": "1.2"
                  }
                }
              },
              "1.23": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 104
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266523086,
                    "origin": 6,
                    "value": 300000
                  },
                  "machineId": {
                    "timestamp": 1768266723499,
                    "origin": 6,
                    "value": "1.1"
                  }
                }
              },
              "1.24": {
                "type": "value",
                "version": {
                  "1": 14,
                  "6": 108
                },
                "isDeleted": false,
                "value": {
                  "processingTimeMs": {
                    "timestamp": 1768266759638,
                    "origin": 6,
                    "value": 240000
                  },
                  "machineId": {
                    "timestamp": 1768266737374,
                    "origin": 6,
                    "value": "1.3"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "isAutoTimeOptions": false,
  "manualTimeOptions": {
    "maxTimeMs": 3600000,
    "viewStartTimeMs": 0,
    "viewEndTimeMs": 1440000,
    "minViewDurationMs": 600000,
    "maxViewDurationMs": 3600000
  },
  "scheduledProcedureStartTimes": {},
  "allowExpand": true
}

export const exampleFormDatas = new Map<number, FormData>([
  [1, example1],
  [2, example2],
  [3, example3],
])

export const exampleOriginalVersions = new Map<number, VectorClock>([
  [1, { 1: 17 }],
  [2, { 1: 14 }],
  [3, { 1: 24 }],
])
