import { describe, expect, test } from 'vitest'
import { type Event, applyEvent } from './event.ts'
import { type Operation, operationType } from './operation.ts'
import { ReplicaId } from '../data/replicaId.ts'
import { elementType } from '../data/yata.ts'

const referenceTimeMs = 1761610000000
const oneMinuteMs = 60000

function wrapInEvent(operation: Operation): Event<Operation> {
  return {
    version: { 1: 2 },
    origin: 1,
    originSequence: 2,
    localSequence: 2,
    operation,
  }
}

function wrapInSpecificEvent(origin: ReplicaId, sequence: number, operation: Operation): Event<Operation> {
  return {
    version: { [origin]: sequence },
    origin,
    originSequence: sequence,
    localSequence: sequence,
    operation,
  }
}

function wrapInLwwRegister(timestamp: number, value: any) {
  return {
    timestamp,
    origin: 1,
    value,
  }
}

describe('applyEvent', () => {
  test('assign operation', () => {
    const operation = {
      type: operationType.assign,
      timestamp: referenceTimeMs,
      value: 2,
    }

    const result = applyEvent(wrapInEvent(operation), undefined)
    expect(result).toEqual(wrapInLwwRegister(referenceTimeMs, 2))
  })

  test('assign operation older than current', () => {
    // should just keep the original formData
    const formData = wrapInLwwRegister(referenceTimeMs + oneMinuteMs, 1)

    const operation = {
      type: operationType.assign,
      timestamp: referenceTimeMs,
      value: 2,
    }

    const result = applyEvent(wrapInEvent(operation), formData)
    expect(result).toBe(formData)
  })

  test('update operation', () => {
    const operation = {
      type: operationType.update,
      key: 'count',
      childOperation: {
        type: operationType.assign,
        timestamp: referenceTimeMs + oneMinuteMs,
        value: 2,
      }
    }

    const result = applyEvent(wrapInEvent(operation), { count: wrapInLwwRegister(referenceTimeMs, 1) })
    expect(result).toEqual({ count: wrapInLwwRegister(referenceTimeMs + oneMinuteMs, 2) })
  })

  test('nested update operation', () => {
    // update [head][count] to 2
    const operation = {
      type: operationType.update,
      key: 'head',
      childOperation: {
        type: operationType.update,
        key: 'count',
        childOperation: {
          type: operationType.assign,
          timestamp: referenceTimeMs + oneMinuteMs,
          value: 2,
        }
      }
    }

    const result = applyEvent(
      wrapInEvent(operation),
      {
        head: { count: wrapInLwwRegister(referenceTimeMs, 1) },
        tail: [],
      }
    )

    expect(result).toEqual({
      head: { count: wrapInLwwRegister(referenceTimeMs + oneMinuteMs, 2) },
      tail: [],
    })
  })

  test('nested update operation creates missing child', () => {
    // update [head][count] to 2
    const operation = {
      type: operationType.update,
      key: 'head',
      childOperation: {
        type: operationType.update,
        key: 'count',
        childOperation: {
          type: operationType.assign,
          timestamp: referenceTimeMs,
          value: 2,
        }
      }
    }

    const result = applyEvent(
      wrapInEvent(operation),
      undefined
    )

    expect(result).toEqual({
      head: { count: wrapInLwwRegister(referenceTimeMs, 2) }
    })
  })

  describe('insert element', () => {
    test('insert new element to undefined', () => {
      const operation = {
        type: operationType.insertElement,
        id: '1.2',
        originLeft: undefined,
        originRight: undefined,
        elementValue: 'first',
      } as const
      const result = applyEvent(
        wrapInEvent(operation),
        undefined
      )

      expect(result).toEqual(
        {
          blocks: [{
            id: '1.2',
            originLeft: undefined,
            originRight: undefined,
          }],
          elements: {
            '1.2': {
              type: elementType.value,
              version: { 1: 2 },
              isDeleted: false,
              value: 'first',
            }
          }
        }
      )
    })

    test('insert new element to the end', () => {
      const operation = {
        type: operationType.insertElement,
        id: '1.2',
        originLeft: '1.1',
        originRight: undefined,
        elementValue: 'end',
      } as const
      const result = applyEvent(
        wrapInEvent(operation),
        {
          blocks: [{
            id: '1.1',
            originLeft: undefined,
            originRight: undefined,
          }],
          elements: {
            '1.1': {
              type: elementType.value,
              version: { 1: 1 },
              isDeleted: false,
              value: 'first',
            },
          }
        }
      )

      expect(result).toEqual(
        {
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
          ],
          elements: {
            '1.1': {
              type: elementType.value,
              version: { 1: 1 },
              isDeleted: false,
              value: 'first',
            },
            '1.2': {
              version: { 1: 2 },
              type: elementType.value,
              isDeleted: false,
              value: 'end',
            }
          }
        }
      )
    })

    test('insert new element to the beginning', () => {
      const operation = {
        type: operationType.insertElement,
        id: '1.2',
        originLeft: undefined,
        originRight: '1.1',
        elementValue: 'beginning',
      } as const
      const result = applyEvent(
        wrapInEvent(operation),
        {
          blocks: [{
            id: '1.1',
            originLeft: undefined,
            originRight: undefined,
          }],
          elements: {
            '1.1': {
              version: { 1: 1 },
              type: elementType.value,
              isDeleted: false,
              value: 'first',
            },
          }
        }
      )

      expect(result).toEqual(
        {
          blocks: [
            {
              id: '1.2',
              originLeft: undefined,
              originRight: '1.1',
            },
            {
              id: '1.1',
              originLeft: undefined,
              originRight: undefined,
            },
          ],
          elements: {
            '1.1': {
              type: elementType.value,
              version: { 1: 1 },
              isDeleted: false,
              value: 'first',
            },
            '1.2': {
              type: elementType.value,
              version: { 1: 2 },
              isDeleted: false,
              value: 'beginning',
            },
          }
        }
      )
    })

    describe('other left < left', () => {
      const originalFormData = {
        blocks: [
          { id: '1.1', originLeft: undefined, originRight: undefined, },
          { id: '1.4', originLeft: '1.1', originRight: '1.3', },
          { id: '2.2', originLeft: '1.1', originRight: '2.1', },
          { id: '2.1', originLeft: '1.1', originRight: '1.3', },
          { id: '1.5', originLeft: '1.4', originRight: '1.3', },
          { id: '1.3', originLeft: '1.1', originRight: '1.2', },
          { id: '1.2', originLeft: '1.1', originRight: undefined, },
        ],
        elements: {
          '1.1': 1,
          '1.2': 2,
          '1.3': 3,
          '1.4': 4,
          '2.1': 5,
          '2.2': 6,
        }
      }

      test.each([
        {
          description: 'and other right < right',
          event: wrapInSpecificEvent(3, 1, {
            type: operationType.insertElement,
            id: '3.1',
            originLeft: '1.4',
            originRight: '1.3',
            elementValue: 7,
          }),
          expectedBlocks: [
            { id: '1.1', originLeft: undefined, originRight: undefined, },
            { id: '1.4', originLeft: '1.1', originRight: '1.3', },
            { id: '3.1', originLeft: '1.4', originRight: '1.3', }, // new block
            { id: '2.2', originLeft: '1.1', originRight: '2.1', }, // OL < L && OR < R => inserted before
            { id: '2.1', originLeft: '1.1', originRight: '1.3', },
            { id: '1.5', originLeft: '1.4', originRight: '1.3', },
            { id: '1.3', originLeft: '1.1', originRight: '1.2', },
            { id: '1.2', originLeft: '1.1', originRight: undefined, },
          ],
        },
        {
          description: 'and other right = right',
          event: wrapInSpecificEvent(3, 1, {
            type: operationType.insertElement,
            id: '3.1',
            originLeft: '1.4',
            originRight: '2.1',
            elementValue: 7,
          }),
          expectedBlocks: [
            { id: '1.1', originLeft: undefined, originRight: undefined, },
            { id: '1.4', originLeft: '1.1', originRight: '1.3', },
            { id: '3.1', originLeft: '1.4', originRight: '2.1', }, // new block
            { id: '2.2', originLeft: '1.1', originRight: '2.1', }, // OL < L && OR = R => inserted before
            { id: '2.1', originLeft: '1.1', originRight: '1.3', },
            { id: '1.5', originLeft: '1.4', originRight: '1.3', },
            { id: '1.3', originLeft: '1.1', originRight: '1.2', },
            { id: '1.2', originLeft: '1.1', originRight: undefined, },
          ],
        },
        {
          description: 'and other right > right',
          event: wrapInSpecificEvent(3, 1, {
            type: operationType.insertElement,
            id: '3.1',
            originLeft: '2.1',
            originRight: '1.3',
            elementValue: 7,
          }),
          expectedBlocks: [
            { id: '1.1', originLeft: undefined, originRight: undefined, },
            { id: '1.4', originLeft: '1.1', originRight: '1.3', },
            { id: '2.2', originLeft: '1.1', originRight: '2.1', },
            { id: '2.1', originLeft: '1.1', originRight: '1.3', },
            { id: '3.1', originLeft: '2.1', originRight: '1.3', }, // new block
            { id: '1.5', originLeft: '1.4', originRight: '1.3', }, // OL < L && OR > R => inserted before
            { id: '1.3', originLeft: '1.1', originRight: '1.2', },
            { id: '1.2', originLeft: '1.1', originRight: undefined, },
          ],
        },
      ])('$description', ({ event, expectedBlocks }) => {
        const result = applyEvent(event, originalFormData)

        expect(result.blocks).toEqual(expectedBlocks)
      })
    })

    test('other left = left and other right < right - scan insert', () => {
      const originalFormData = {
        blocks: [
          { id: '3.1', originLeft: undefined, originRight: undefined, },
          { id: '2.2', originLeft: '3.1', originRight: '2.1', },
          { id: '2.1', originLeft: '3.1', originRight: '3.2', },
          { id: '3.2', originLeft: '3.1', originRight: undefined, },
        ],
        elements: {
          '3.1': 1,
          '3.2': 2,
          '2.1': 3,
          '2.2': 4,
        }
      }

      const event = wrapInSpecificEvent(1, 1, {
        type: operationType.insertElement,
        id: '1.1',
        originLeft: '3.1',
        originRight: '3.2',
        elementValue: 5,
      })

      const expectedBlocks = [
        { id: '3.1', originLeft: undefined, originRight: undefined, },
        { id: '1.1', originLeft: '3.1', originRight: '3.2', }, // new block
        { id: '2.2', originLeft: '3.1', originRight: '2.1', }, // OL = L && OR < R => scan : this test case
        { id: '2.1', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR = R, smaller replica id => inserted at scan destination
        { id: '3.2', originLeft: '3.1', originRight: undefined, },
      ]

      const result = applyEvent(event, originalFormData)

      expect(result.blocks).toEqual(expectedBlocks)
    })

    test('other left = left and other right < right - scan insert 2', () => {
      const originalFormData = {
        blocks: [
          { id: '3.1', originLeft: undefined, originRight: undefined, },
          { id: '2.3', originLeft: '3.1', originRight: '2.2', },
          { id: '2.2', originLeft: '3.1', originRight: '2.1', },
          { id: '2.1', originLeft: '3.1', originRight: '3.2', },
          { id: '3.2', originLeft: '3.1', originRight: undefined, },
        ],
        elements: {
          '3.1': 1,
          '3.2': 2,
          '2.1': 3,
          '2.2': 4,
        }
      }

      const event = wrapInSpecificEvent(1, 1, {
        type: operationType.insertElement,
        id: '1.1',
        originLeft: '3.1',
        originRight: '3.2',
        elementValue: 5,
      })

      const expectedBlocks = [
        { id: '3.1', originLeft: undefined, originRight: undefined, },
        { id: '1.1', originLeft: '3.1', originRight: '3.2', }, // new block
        { id: '2.3', originLeft: '3.1', originRight: '2.2', }, // OL = L && OR < R => scan
        { id: '2.2', originLeft: '3.1', originRight: '2.1', }, // OL = L && OR < R => scan extends : this test case
        { id: '2.1', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR = R, smaller replica id => inserted at scan destination
        { id: '3.2', originLeft: '3.1', originRight: undefined, },
      ]

      const result = applyEvent(event, originalFormData)

      expect(result.blocks).toEqual(expectedBlocks)
    })

    test('other left = left and other right < right - scan ended', () => {
      const originalFormData = {
        blocks: [
          { id: '3.1', originLeft: undefined, originRight: undefined, },
          { id: '2.2', originLeft: '3.1', originRight: '2.1', },
          { id: '2.1', originLeft: '3.1', originRight: '3.2', },
          { id: '3.2', originLeft: '3.1', originRight: undefined, },
        ],
        elements: {
          '3.1': 1,
          '3.2': 2,
          '2.1': 3,
          '2.2': 4,
        }
      }

      const event = wrapInSpecificEvent(4, 1, {
        type: operationType.insertElement,
        id: '4.1',
        originLeft: '3.1',
        originRight: '3.2',
        elementValue: 5,
      })

      const expectedBlocks = [
        { id: '3.1', originLeft: undefined, originRight: undefined, },
        { id: '2.2', originLeft: '3.1', originRight: '2.1', }, // OL = L && OR < R => scan : this test case
        { id: '2.1', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR = R, larger replica id => end scan and continue
        { id: '4.1', originLeft: '3.1', originRight: '3.2', }, // new block
        { id: '3.2', originLeft: '3.1', originRight: undefined, }, // right, insert before
      ]

      const result = applyEvent(event, originalFormData)

      expect(result.blocks).toEqual(expectedBlocks)
    })

    describe('other left = left and other right = right', () => {
      const originalFormData = {
        blocks: [
          { id: '2.1', originLeft: undefined, originRight: undefined, },
          { id: '2.3', originLeft: '2.1', originRight: '2.2', },
          { id: '2.2', originLeft: '2.1', originRight: undefined, },
        ],
        elements: {
          '2.1': 1,
          '2.2': 2,
          '2.3': 3,
        }
      }

      test.each([
        {
          description: 'and smaller replicaId',
          event: wrapInSpecificEvent(1, 1, {
            type: operationType.insertElement,
            id: '1.1',
            originLeft: '2.1',
            originRight: '2.2',
            elementValue: 4,
          }),
          expectedBlocks: [
            { id: '2.1', originLeft: undefined, originRight: undefined, },
            { id: '1.1', originLeft: '2.1', originRight: '2.2', }, // new block
            { id: '2.3', originLeft: '2.1', originRight: '2.2', }, // OL = L && OR < R, smaller replicaId => insert before
            { id: '2.2', originLeft: '2.1', originRight: undefined, },
          ],
        },
        {
          description: 'and larger replicaId',
          event: wrapInSpecificEvent(3, 1, {
            type: operationType.insertElement,
            id: '3.1',
            originLeft: '2.1',
            originRight: '2.2',
            elementValue: 4,
          }),
          expectedBlocks: [
            { id: '2.1', originLeft: undefined, originRight: undefined, },
            { id: '2.3', originLeft: '2.1', originRight: '2.2', }, // OL = L && OR < R, smaller replicaId => continue
            { id: '3.1', originLeft: '2.1', originRight: '2.2', }, // new block
            { id: '2.2', originLeft: '2.1', originRight: undefined, }, // right, insert before
          ],
        },
      ])('$description', ({ event, expectedBlocks }) => {
        const result = applyEvent(event, originalFormData)

        expect(result.blocks).toEqual(expectedBlocks)
      })
    })

    test('other left = left and other right > right - continue', () => {
      const originalFormData = {
        blocks: [
          { id: '1.1', originLeft: undefined, originRight: undefined, },
          { id: '2.1', originLeft: '1.1', originRight: '1.2', },
          { id: '1.3', originLeft: '1.1', originRight: '1.2', },
          { id: '1.2', originLeft: '1.1', originRight: undefined, },
        ],
        elements: {
          '1.1': 1,
          '1.2': 2,
          '1.3': 3,
          '2.2': 4,
        }
      }

      const event = wrapInSpecificEvent(3, 1, {
        type: operationType.insertElement,
        id: '3.1',
        originLeft: '1.1',
        originRight: '1.3',
        elementValue: 5,
      })

      const expectedBlocks = [
        { id: '1.1', originLeft: undefined, originRight: undefined, },
        { id: '2.1', originLeft: '1.1', originRight: '1.2', }, // OL = L && OR > R => continue
        { id: '3.1', originLeft: '1.1', originRight: '1.3', }, // new block
        { id: '1.3', originLeft: '1.1', originRight: '1.2', }, // right, insert before
        { id: '1.2', originLeft: '1.1', originRight: undefined, },
      ]

      const result = applyEvent(event, originalFormData)

      expect(result.blocks).toEqual(expectedBlocks)
    })

    test('other left = left and other right > right - ends scan and continues', () => {
      const originalFormData = {
        blocks: [
          { id: '3.1', originLeft: undefined, originRight: undefined, },
          { id: '2.2', originLeft: '3.1', originRight: '2.1', },
          { id: '2.1', originLeft: '3.1', originRight: '3.2', },
          { id: '3.3', originLeft: '3.1', originRight: '3.2', },
          { id: '3.2', originLeft: '3.1', originRight: undefined, },
        ],
        elements: {
          '3.1': 1,
          '3.2': 2,
          '3.3': 3,
          '2.1': 4,
          '2.2': 5,
        }
      }

      const event = wrapInSpecificEvent(1, 1, {
        type: operationType.insertElement,
        id: '1.1',
        originLeft: '3.1',
        originRight: '3.3',
        elementValue: 5,
      })

      const expectedBlocks = [
        { id: '3.1', originLeft: undefined, originRight: undefined, },
        { id: '2.2', originLeft: '3.1', originRight: '2.1', }, // OL = L && OR < R => scan
        { id: '2.1', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR > R => end scan and continue : this test case
        { id: '1.1', originLeft: '3.1', originRight: '3.3', }, // new block
        { id: '3.3', originLeft: '3.1', originRight: '3.2', }, // right, insert before
        { id: '3.2', originLeft: '3.1', originRight: undefined, },
      ]

      const result = applyEvent(event, originalFormData)

      expect(result.blocks).toEqual(expectedBlocks)
    })

    test('other left > left and other right < right', () => {
      const originalFormData = {
        blocks: [
          { id: '3.1', originLeft: undefined, originRight: undefined, },
          { id: '1.1', originLeft: '3.1', originRight: '3.2', },
          { id: '1.2', originLeft: '1.1', originRight: '3.3', },
          { id: '3.3', originLeft: '3.1', originRight: '3.2', },
          { id: '3.2', originLeft: '3.1', originRight: undefined, },
        ],
        elements: {
          '3.1': 1,
          '3.2': 2,
          '3.3': 3,
          '1.1': 4,
          '1.2': 5,
        }
      }

      const event = wrapInSpecificEvent(2, 1, {
        type: operationType.insertElement,
        id: '2.1',
        originLeft: '3.1',
        originRight: '3.2',
        elementValue: 6,
      })

      const expectedBlocks = [
        { id: '3.1', originLeft: undefined, originRight: undefined, },
        { id: '1.1', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR = R, larger replica id => continue
        { id: '1.2', originLeft: '1.1', originRight: '3.3', }, // OL > L && OR < R => continue : this test case
        { id: '2.1', originLeft: '3.1', originRight: '3.2', }, // new block
        { id: '3.3', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR = R, smaller replica id => inserted before
        { id: '3.2', originLeft: '3.1', originRight: undefined, },
      ]

      const result = applyEvent(event, originalFormData)

      expect(result.blocks).toEqual(expectedBlocks)
    })

    test('other left > left and other right = right', () => {
      const originalFormData = {
        blocks: [
          { id: '3.1', originLeft: undefined, originRight: undefined, },
          { id: '1.1', originLeft: '3.1', originRight: '3.2', },
          { id: '1.2', originLeft: '1.1', originRight: '3.2', },
          { id: '3.3', originLeft: '3.1', originRight: '3.2', },
          { id: '3.2', originLeft: '3.1', originRight: undefined, },
        ],
        elements: {
          '3.1': 1,
          '3.2': 2,
          '3.3': 3,
          '1.1': 4,
          '1.2': 5,
        }
      }

      const event = wrapInSpecificEvent(2, 1, {
        type: operationType.insertElement,
        id: '2.1',
        originLeft: '3.1',
        originRight: '3.2',
        elementValue: 6,
      })

      const expectedBlocks = [
        { id: '3.1', originLeft: undefined, originRight: undefined, },
        { id: '1.1', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR = R, larger replica id => continue
        { id: '1.2', originLeft: '1.1', originRight: '3.2', }, // OL > L && OR = R => continue : this test case
        { id: '2.1', originLeft: '3.1', originRight: '3.2', }, // new block
        { id: '3.3', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR = R, smaller replica id => inserted before
        { id: '3.2', originLeft: '3.1', originRight: undefined, },
      ]

      const result = applyEvent(event, originalFormData)

      expect(result.blocks).toEqual(expectedBlocks)
    })

    test('other left > left and other right > right', () => {
      const originalFormData = {
        blocks: [
          { id: '3.1', originLeft: undefined, originRight: undefined, },
          { id: '1.1', originLeft: '3.1', originRight: '3.2', },
          { id: '1.2', originLeft: '1.1', originRight: '3.2', },
          { id: '2.1', originLeft: '3.1', originRight: undefined, },
          { id: '3.2', originLeft: '3.1', originRight: undefined, },
        ],
        elements: {
          '3.1': 1,
          '3.2': 2,
          '2.1': 3,
          '1.1': 4,
          '1.2': 5,
        }
      }

      const event = wrapInSpecificEvent(2, 2, {
        type: operationType.insertElement,
        id: '2.2',
        originLeft: '3.1',
        originRight: '2.1',
        elementValue: 6,
      })

      const expectedBlocks = [
        { id: '3.1', originLeft: undefined, originRight: undefined, },
        { id: '1.1', originLeft: '3.1', originRight: '3.2', }, // OL = L && OR > R => continue
        { id: '1.2', originLeft: '1.1', originRight: '3.2', }, // OL > L && OR > R => continue : this test case
        { id: '2.2', originLeft: '3.1', originRight: '2.1', }, // new block
        { id: '2.1', originLeft: '3.1', originRight: undefined, }, // right, insert before
        { id: '3.2', originLeft: '3.1', originRight: undefined, },
      ]

      const result = applyEvent(event, originalFormData)

      expect(result.blocks).toEqual(expectedBlocks)
    })
  })

  describe('update element', () => {
    test('update existing element', () => {
      const operation = {
        type: operationType.updateElement,
        id: '1.1',
        elementOperation: {
          type: operationType.assign,
          timestamp: referenceTimeMs + oneMinuteMs,
          value: 2,
        }
      } as const
      const result = applyEvent(
        wrapInEvent(operation),
        {
          blocks: [{
            id: '1.1',
            originLeft: undefined,
            originRight: undefined,
          }],
          elements: {
            '1.1': {
              type: elementType.value,
              version: { 1: 1 },
              isDeleted: false,
              value: wrapInLwwRegister(referenceTimeMs, 1),
            },
          }
        }
      )

      expect(result).toEqual(
        {
          blocks: [
            {
              id: '1.1',
              originLeft: undefined,
              originRight: undefined,
            },
          ],
          elements: {
            '1.1': {
              type: elementType.value,
              version: { 1: 2, },
              isDeleted: false,
              value: wrapInLwwRegister(referenceTimeMs + oneMinuteMs, 2),
            },
          }
        }
      )
    })

    test('update deleted element', () => {
      const operation = {
        type: operationType.updateElement,
        id: '1.1',
        elementOperation: {
          type: operationType.assign,
          timestamp: referenceTimeMs + oneMinuteMs,
          value: 2,
        }
      } as const
      const result = applyEvent(
        wrapInEvent(operation),
        {
          blocks: [{
            id: '1.1',
            originLeft: undefined,
            originRight: undefined,
          }],
          elements: {
            '1.1': {
              type: elementType.value,
              version: { 1: 1, 2: 1 },
              isDeleted: true,
              value: wrapInLwwRegister(referenceTimeMs, 1),
            }
          }
        }
      )

      expect(result).toEqual(
        {
          blocks: [
            {
              id: '1.1',
              originLeft: undefined,
              originRight: undefined,
            },
          ],
          elements: {
            '1.1': {
              type: elementType.value,
              isDeleted: false,
              version: { 1: 2, 2: 1 },
              value: wrapInLwwRegister(referenceTimeMs + oneMinuteMs, 2),
            },
          }
        }
      )
    })
  })

  test('delete element', () => {
    const operation = {
      type: operationType.deleteElement,
      id: '1.1',
    } as const
    const result = applyEvent(
      wrapInEvent(operation),
      {
        blocks: [{
          id: '1.1',
          originLeft: undefined,
          originRight: undefined,
        }],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 1 },
            isDeleted: false,
            value: 'first',
          }
        }
      }
    )

    expect(result).toEqual(
      {
        blocks: [
          {
            id: '1.1',
            originLeft: undefined,
            originRight: undefined,
          },
        ],
        elements: {
          '1.1': {
            version: { 1: 2 },
            type: elementType.value,
            isDeleted: true,
            value: 'first',
          }
        }
      }
    )
  })

  test('delete element concurrent with update', () => {
    const operation = {
      type: operationType.deleteElement,
      id: '1.1',
    } as const
    const result = applyEvent(
      wrapInSpecificEvent(2, 1, operation), // this event did not observe the update of version {1:2}
      {
        blocks: [{
          id: '1.1',
          originLeft: undefined,
          originRight: undefined,
        }],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 2 }, // this element was already updated concurrently
            isDeleted: false,
            value: wrapInLwwRegister(referenceTimeMs, 2),
          }
        }
      }
    )

    expect(result).toEqual(
      {
        blocks: [
          {
            id: '1.1',
            originLeft: undefined,
            originRight: undefined,
          },
        ],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 2, 2: 1 },
            isDeleted: false,
            value: wrapInLwwRegister(referenceTimeMs, 2),
          }
        }
      }
    )
  })

  test('delete element concurrent with delete', () => {
    const operation = {
      type: operationType.deleteElement,
      id: '1.1',
    } as const
    const result = applyEvent(
      wrapInSpecificEvent(2, 1, operation), // this event did not observe the delete of version {1:2}
      {
        blocks: [{
          id: '1.1',
          originLeft: undefined,
          originRight: undefined,
        }],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 2 }, // this element was already deleted concurrently
            isDeleted: true,
            value: wrapInLwwRegister(referenceTimeMs, 1),
          }
        }
      }
    )

    expect(result).toEqual(
      {
        blocks: [
          {
            id: '1.1',
            originLeft: undefined,
            originRight: undefined,
          },
        ],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 2, 2: 1 },
            isDeleted: true,
            value: wrapInLwwRegister(referenceTimeMs, 1),
          },
        }
      }
    )
  })
})
