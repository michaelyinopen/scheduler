import sqlite from 'better-sqlite3'
import type { Event, VectorClock, ReplicationState } from '@michaelyinopen/scheduler-common'

const db = new sqlite(process.env.DATABASE_PATH)
db.pragma('journal_mode = WAL')
db.defaultSafeIntegers(false)

db.exec(
  `CREATE TABLE IF NOT EXISTS replicationStates (
    id INTEGER PRIMARY KEY,
    data TEXT
  );`
)

export { db }

const saveSnapshotStatement = db.prepare(
  `INSERT INTO replicationStates (id, data) VALUES(@id, @value)
  ON CONFLICT(id) DO UPDATE SET data = @value;`)
export function saveSnapshot<TCrdt>(id: number, replicationState: ReplicationState<TCrdt>) {
  saveSnapshotStatement.run({ id, value: JSON.stringify(replicationState) })
}

const loadSnapshotStatement = db.prepare<number, any>('SELECT data FROM replicationStates WHERE id = ?;')
export function loadSnapshot<TCrdt>(id: number): ReplicationState<TCrdt> | undefined {
  const row = loadSnapshotStatement.get(id)
  return row === undefined
    ? undefined
    : (JSON.parse(row.data) as ReplicationState<TCrdt>)
}

// the lastReplicaId of '1' is the server ReplicaId
db.exec(
  `CREATE TABLE IF NOT EXISTS lastReplicaIds (
    replicationStateId INTEGER PRIMARY KEY,
    lastReplicaId INTEGER DEFAULT 1
  );`
)

const incrementReplicaIdStatement = db.prepare(
  `INSERT INTO lastReplicaIds (replicationStateId, lastReplicaId) VALUES(@replicationStateId, 2)
  ON CONFLICT(replicationStateId) DO UPDATE SET lastReplicaId = lastReplicaId + 1;`)

const loadLastReplicaIdStatement = db.prepare<number, any>('SELECT lastReplicaId FROM lastReplicaIds WHERE replicationStateId = ?;')
export function getNextReplicaId(replicationStateId: number): number {
  incrementReplicaIdStatement.run({ replicationStateId })
  const row = loadLastReplicaIdStatement.get(replicationStateId)
  return row?.lastReplicaId ?? 2
}

db.exec(
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    replicationStateId INTEGER,
    origin INTEGER,
    originSequence INTEGER,
    localSequence INTEGER,
    version TEXT,
    operation TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_events_replicationStateId_localSequence ON events (replicationStateId, localSequence);`
)

const saveEventsStatement = db.prepare(
  `INSERT INTO events (
    replicationStateId,
    origin,
    originSequence,
    localSequence,
    version,
    operation
  )
  VALUES (
    @replicationStateId,
    @origin,
    @originSequence,
    @localSequence,
    @version,
    @operation
  );`
)
const saveEventsTransaction = db.transaction((replicationStateId: number, events: Event<unknown>[]) => {
  for (const event of events) {
    saveEventsStatement.run({
      replicationStateId: replicationStateId,
      origin: event.origin,
      originSequence: event.originSequence,
      localSequence: event.localSequence,
      version: JSON.stringify(event.version),
      operation: JSON.stringify(event.operation),
    })
  }
})
export function saveEvents<TOperation>(replicationStateId: number, events: Event<TOperation>[]) {
  saveEventsTransaction(replicationStateId, events)
}

const loadEventsStatement = db.prepare<{ replicationStateId: number, startSequence: number }, any>(
  `SELECT
    origin,
    originSequence,
    localSequence,
    version,
    operation
  FROM
    events
  WHERE
    replicationStateId = @replicationStateId AND
    localSequence >= @startSequence;`
)
export function loadEvents<TOperation>(replicationStateId: number, startSequence: number): Event<TOperation>[] {
  return loadEventsStatement.all({ replicationStateId, startSequence })
    .map(rawEvent => {
      return {
        origin: rawEvent.origin,
        originSequence: rawEvent.originSequence,
        localSequence: rawEvent.localSequence,
        version: JSON.parse(rawEvent.version) as VectorClock,
        operation: JSON.parse(rawEvent.operation) as TOperation,
      }
    })
}

export const saveEventsAndSnapshot:
  <TOperation, TCrdt>(replicationStateId: number, events: Event<TOperation>[], replicationState: ReplicationState<TCrdt>) => void =
  db.transaction(<TOperation, TCrdt>(replicationStateId: number, events: Event<TOperation>[], replicationState: ReplicationState<TCrdt>) => {
    for (const event of events) {
      saveEventsStatement.run({
        replicationStateId: replicationStateId,
        origin: event.origin,
        originSequence: event.originSequence,
        localSequence: event.localSequence,
        version: JSON.stringify(event.version),
        operation: JSON.stringify(event.operation),
      })
    }
    saveSnapshot(replicationStateId, replicationState)
  })
