import http from 'http'
import express from 'express'
import type { Request, Response } from 'express'
import session from 'express-session'
import sqliteSessionStore from 'better-sqlite3-session-store'
import { WebSocketServer, WebSocket } from 'ws'
import { CronJob } from 'cron'

import {
  clientMessageType,
  serverMessageType,
  type ResetMessage,
  type ClientMessage,
  type ConnectMessage,
  type SubmitMessage,
  type ReplicatedMessage,
  type ReplicaId,
  type InitializeMessage,
} from '@michaelyinopen/scheduler-common'

import { db } from './db.ts'
import { createUser } from './users.ts'
import { getNextSocketId } from './getNextSocketId.ts'
import * as service from './service.ts'
import { createOrRecoverExamples, serverReplicaId } from './service.ts'
import { maxConnectEventCount } from './constants.ts'
import { exampleFormDatas } from './examples.ts'

const port = process.env.PORT
const sessionSecret = process.env.SESSION_SECRET

class WebSocketWithId extends WebSocket {
  userId!: number
  isAlive!: boolean
}

declare module "express-session" {
  interface SessionData {
    userId: number
  }
}

const app = express()
type WsInfo = { webSocket: WebSocketWithId, replicaIds: Record<number, ReplicaId>, currentJobSetId: number | undefined }
const wsInfoMap = new Map<number, WsInfo>() // key is socketId
const SqliteStore = sqliteSessionStore(session)

const sessionOptions: session.SessionOptions = {
  store: new SqliteStore({
    client: db,
    expired: {
      clear: true,
      intervalMs: 900000 //ms = 15min
    },
  }) as any,
  secret: sessionSecret!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8640000000 //ms = 100 days
  },
  rolling: true,
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sessionOptions.cookie!.domain = "scheduler.michael-yin.net"
  sessionOptions.cookie!.secure = true // serve secure cookies
}

const sessionParser = session(sessionOptions)

app.use(sessionParser)

app.post('/api/login', function (request, response) {
  //
  // "Log in" user and set userId to session.
  //
  const id = request.session.userId ?? createUser()

  request.session.userId = id
  response.send({ result: 'OK', message: 'Session updated' })
})

app.delete('/api/logout', function (request, response) {
  const wsList = Array.from(wsInfoMap.values()).filter(ws => ws.webSocket.userId === request.session.userId)

  request.session.destroy(function () {
    for (const ws of wsList) {
      if (ws) ws.webSocket.close()
    }

    response.send({ result: 'OK', message: 'Session destroyed' })
  })
})

const server = http.createServer(app)

const wss = new WebSocketServer({
  // port: 8080,
  WebSocket: WebSocketWithId,
  clientTracking: false,
  noServer: true,
})

server.on('upgrade', function (request, socket, head) {
  socket.on('error', console.error)

  const req = request as Request

  sessionParser(req, ({} as Response), () => {
    if (!req.session?.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    socket.removeListener('error', console.error)

    wss.handleUpgrade(request, socket, head, function (ws) {
      wss.emit('connection', ws, request)
    })
  })
})

function heartbeat(this: WebSocket) {
  (this as WebSocketWithId).isAlive = true
}

wss.on('connection', function connection(ws, request) {
  const userId = (request as Request).session.userId!
  const socketId = getNextSocketId()

  ws.userId = userId
  const wsInfo: WsInfo = { webSocket: ws, replicaIds: {}, currentJobSetId: undefined }
  wsInfoMap.set(socketId, wsInfo)

  ws.isAlive = true
  ws.on('error', console.error)

  ws.on('message', (data) => {
    console.log('received: %s', data);
    const message: ClientMessage = JSON.parse(data.toString())

    if (message.type === clientMessageType.initialize) {
      const { id } = message as InitializeMessage

      let replicaId = wsInfo.replicaIds[id]
      if (replicaId === undefined) {
        replicaId = service.getNextReplicaId(id)
        wsInfo.replicaIds[id] = replicaId
      }

      wsInfo.currentJobSetId = id

      const replicationState = service.getReplicationState(service.serverReplicaId, id)
      const resetMessage: ResetMessage = {
        type: serverMessageType.reset,
        id: id,
        replicaId,
        crdt: replicationState.crdt,
        version: replicationState.version,
        from: replicationState.replicaId,
        toSequence: replicationState.sequence,
      }
      ws.send(JSON.stringify(resetMessage))
    }

    if (message.type === clientMessageType.connect) {
      const { id, replicaId, sequence, latestVersion } = message as ConnectMessage
      wsInfo.replicaIds[id] = replicaId
      wsInfo.currentJobSetId = id

      const replicationState = service.getReplicationState(service.serverReplicaId, id)
      const hardResetHappened = (latestVersion[serverReplicaId] ?? 0) < (replicationState.version[serverReplicaId] ?? 0)

      if (replicationState.sequence - sequence <= maxConnectEventCount && !hardResetHappened) {
        const events = service.getEventsAfter(id, sequence, latestVersion)

        if (events.length > 0 || sequence !== replicationState.sequence) {
          // send events not observed by replica
          const replicatedMessage: ReplicatedMessage = {
            type: serverMessageType.replicated,
            id,
            from: service.serverReplicaId,
            toSequence: replicationState.sequence,
            events: events,
          }
          ws.send(JSON.stringify(replicatedMessage))
        }
      } else {
        // send the whole replicated state to replica
        const resetMessage: ResetMessage = {
          type: serverMessageType.reset,
          id: id,
          replicaId,
          crdt: replicationState.crdt,
          version: replicationState.version,
          from: replicationState.replicaId,
          toSequence: replicationState.sequence,
        }
        ws.send(JSON.stringify(resetMessage))
      }

      // request events not observed by server
      const replicateMessage = {
        type: serverMessageType.replicate,
        id,
        sequence: replicationState.observed[replicaId] ?? 0,
        latestVersion: replicationState.version,
      }
      ws.send(JSON.stringify(replicateMessage))
    }

    if (message.type === clientMessageType.submit) {
      const { id, replicaId, toSequence, events } = message as SubmitMessage

      const appliedEvents = service.handleEvents(id, replicaId, toSequence, events)
      const replicationState = service.getReplicationState(service.serverReplicaId, id)

      if (appliedEvents.length !== 0) {
        for (const client of wsInfoMap.values()) {
          if (client.webSocket !== ws && client.webSocket.readyState === WebSocket.OPEN && client.currentJobSetId === id) {
            const replicatedMessage: ReplicatedMessage = {
              type: serverMessageType.replicated,
              id,
              from: service.serverReplicaId,
              toSequence: replicationState.sequence,
              events: appliedEvents,
            }
            client.webSocket.send(JSON.stringify(replicatedMessage))
          }
        }
      }
    }
  })

  ws.on('pong', heartbeat)

  ws.on('close', () => {
    wsInfoMap.delete(socketId)
  })
})

const interval = setInterval(function ping() {
  for (const ws of wsInfoMap.values()) {
    if (ws.webSocket.isAlive === false) {
      return ws.webSocket.terminate()
    }

    ws.webSocket.isAlive = false
    ws.webSocket.ping()
  }
}, 30000)

wss.on('close', () => clearInterval(interval))

// creates the example replicationStates if they do not exist in database
// and set replicationStateCache
createOrRecoverExamples(serverReplicaId)

// cron job that hard resets the replicaton states
new CronJob(
  '0 0 3 * * SUN', // cronTime, every Sunday 3am
  function hardResetReplicationState() {
    console.log('Hard resetting')
    for (const [id, formData] of exampleFormDatas.entries()) {
      const newReplicationState = service.hardResetReplicationState(id, formData)

      if (newReplicationState !== undefined) {
        for (const client of wsInfoMap.values()) {
          if (client.webSocket.readyState === WebSocket.OPEN && client.currentJobSetId === id) {
            const replicaId = client.replicaIds[id]

            const resetMessage: ResetMessage = {
              type: serverMessageType.reset,
              id: id,
              replicaId,
              crdt: newReplicationState.crdt,
              version: newReplicationState.version,
              from: newReplicationState.replicaId,
              toSequence: newReplicationState.sequence,
            }
            client.webSocket.send(JSON.stringify(resetMessage))
          }
        }
      }
    }
  },
  null, // onComplete
  true, // start
  'Australia/Sydney' // timeZone
)

//
// Start the server.
//
server.listen(port, function () {
  console.log('Listening on http://localhost:%s', port)
})
