import { describe, expect, test } from 'vitest'
import { Operation, operationType } from './operation'
import { OperationMatcher, matchesOperation, shortCutCondition } from './matchesOperation'
import { elementType } from '../data/yata'

describe('matchesOperation', () => {
  test('assign operation matches', () => {
    const operation: Operation = {
      type: operationType.update,
      key: 'isAutoTimeOptions',
      childOperation: {
        type: operationType.assign,
        timestamp: 0,
        value: true,
      }
    }

    const operationMatcher: OperationMatcher = {
      type: operationType.update,
      key: 'isAutoTimeOptions',
      childOperation: {
        type: operationType.assign,
      }
    }

    const actual = matchesOperation(operation, { matchers: [operationMatcher] })

    expect(actual).toBe(true)
  })

  test('assign operation does not match', () => {
    const operation: Operation = {
      type: operationType.update,
      key: 'title',
      childOperation: {
        type: operationType.assign,
        timestamp: 0,
        value: 'wrong',
      }
    }

    const operationMatcher: OperationMatcher = {
      type: operationType.update,
      key: 'isAutoTimeOptions',
      childOperation: {
        type: operationType.assign,
      }
    }

    const actual = matchesOperation(operation, { matchers: [operationMatcher] })

    expect(actual).toBe(false)
  })

  test('insert element operation matches', () => {
    const operation: Operation = {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.insertElement,
        id: '1.1',
        originLeft: undefined,
        originRight: undefined,
        elementValue: {},
      },
    }

    const operationMatcher: OperationMatcher = {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.insertElement,
        id: null,
      },
    }

    const actual = matchesOperation(operation, { matchers: [operationMatcher] })

    expect(actual).toBe(true)
  })

  test('insert element operation does not matches', () => {
    const operation: Operation = {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: '1.1',
        elementOperation: {
          type: operationType.update,
          key: 'title',
          childOperation: {
            type: operationType.assign,
            timestamp: 0,
            value: 'wrong',
          }
        },
      },
    }

    const operationMatcher: OperationMatcher = {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.insertElement,
        id: null,
      },
    }

    const actual = matchesOperation(operation, { matchers: [operationMatcher] })

    expect(actual).toBe(false)
  })

  test('update element operation that undeletes matches', () => {
    const operation: Operation = {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: '1.1',
        elementOperation: {
          type: operationType.update,
          key: 'title',
          childOperation: {
            type: operationType.assign,
            timestamp: 0,
            value: 'undeletes something',
          },
        },
      },
    }

    const operationMatcher: OperationMatcher = {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: null,
        shortCutCondition: shortCutCondition.undelete,
      },
    }

    const previousCrdt = {
      machines: {
        blocks: [{
          id: '1.1',
          originLeft: undefined,
          originRight: undefined,
        }],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 2 },
            isDeleted: true,
            value: {}
          },
        },
      },
    }

    const newCrdt = {
      machines: {
        blocks: [{
          id: '1.1',
          originLeft: undefined,
          originRight: undefined,
        }],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 3 },
            isDeleted: false,
            value: {
              title: [{
                version: { 1: 3 },
                timestamp: 0,
                origin: 1,
                value: 'undeletes something',
              }]
            },
          },
        },
      },
    }

    const actual = matchesOperation(operation, { matchers: [operationMatcher], newCrdt, previousCrdt })

    expect(actual).toBe(true)
  })

  test('update element operation ordinarily does not match', () => {
    const operation: Operation = {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: '1.1',
        elementOperation: {
          type: operationType.update,
          key: 'title',
          childOperation: {
            type: operationType.assign,
            timestamp: 0,
            value: 'update something',
          },
        },
      },
    }

    const operationMatcher: OperationMatcher = {
      type: operationType.update,
      key: 'machines',
      childOperation: {
        type: operationType.updateElement,
        id: null,
        shortCutCondition: shortCutCondition.undelete,
      },
    }

    const previousCrdt = {
      machines: {
        blocks: [{
          id: '1.1',
          originLeft: undefined,
          originRight: undefined,
        }],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 2 },
            isDeleted: false,
            value: {
              title: [{
                version: { 1: 2 },
                timestamp: 0,
                origin: 1,
                value: 'not deleted',
              }]
            },
          },
        },
      },
    }

    const newCrdt = {
      machines: {
        blocks: [{
          id: '1.1',
          originLeft: undefined,
          originRight: undefined,
        }],
        elements: {
          '1.1': {
            type: elementType.value,
            version: { 1: 3 },
            isDeleted: false,
            value: {
              title: [{
                version: { 1: 3 },
                timestamp: 0,
                origin: 1,
                value: 'update something',
              }]
            },
          },
        },
      },
    }

    const actual = matchesOperation(operation, { matchers: [operationMatcher], newCrdt, previousCrdt })

    expect(actual).toBe(false)
  })
})
