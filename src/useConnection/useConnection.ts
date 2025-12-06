import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { type ServerMessage } from '@michaelyinopen/scheduler-common'
import { createRetrier } from './retryBackoff'
import { getStatus } from './onlineStatus'

export type ConnectionOptions = {
  getWebSocket: () => WebSocket | undefined
  setWebSocket: (ws: WebSocket) => void
  onConnectionOpen: () => void
  onMessage: (message: ServerMessage) => void
}

export function useConnection({ getWebSocket, setWebSocket, onConnectionOpen, onMessage }: ConnectionOptions) {
  const [online, setOnline] = useState(() => window.navigator.onLine)

  const onConnectionOpenEvent = useEffectEvent(onConnectionOpen)
  const onMessageEvent = useEffectEvent(onMessage)

  useEffect(() => {
    const controller = new AbortController()
    window.addEventListener("online", () => setOnline(true), { signal: controller.signal })
    window.addEventListener("offline", () => setOnline(false), { signal: controller.signal })

    return () => controller.abort()
  }, [])

  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  const supportsWebSocket = useMemo(() => 'WebSocket' in window && window.WebSocket.CLOSING === 2, [])

  const [isFirstTimeWebSocket, setIsFirstTimeWebSocket] = useState(true)
  const [webSocketConnecting, setWebSocketConnecting] = useState(false)
  const [webSocketOpen, setWebSocketOpen] = useState(() => getWebSocket()?.readyState === WebSocket.OPEN)

  useEffect(() => {
    // foreground tab of a non-minimized window
    let isVisible = document.visibilityState === 'visible'
    const getIsVisible = () => isVisible

    const controller = new AbortController()
    const retrier = createRetrier(getIsVisible)

    const connect = () => {
      if (!supportsWebSocket || !online) {
        return
      }

      setWebSocketConnecting(true)
      console.log("ws connecting")
      const socket = new WebSocket("/ws")
      socket.onerror = (event) => {
        console.log("ws errored", event)
        // onclose will be called
      }
      socket.onopen = () => {
        console.log("ws opened")
        setIsFirstTimeWebSocket(false)
        setWebSocketConnecting(false)
        setWebSocketOpen(true)
        retrier.reset()
        onConnectionOpenEvent()
      }
      socket.onclose = () => {
        console.log("ws closed")
        setIsFirstTimeWebSocket(false)
        setWebSocketConnecting(false)
        setWebSocketOpen(false)
        retrier.retryWebSocketConnect()
      }
      socket.onmessage = e => {
        const message: ServerMessage = JSON.parse(e.data as string)
        onMessageEvent(message)
      }
      setWebSocket(socket)
    }

    const login = () => {
      if (!online) {
        return
      }

      setLoggingIn(true)
      console.log("logging in")
      fetch('/api/login', {
        method: 'post',
        signal: controller.signal
      }).then((response) => {
        if (response.status == 200) {
          console.log("logged in")
          setLoggingIn(false)
          setLoggedIn(true)
          setIsFirstTimeLogin(false)
          retrier.setLoggedIn(new Date())
          connect()
          return
        }
        console.log("login failed")
        setLoggingIn(false)
        setLoggedIn(false)
        setIsFirstTimeLogin(false)
        retrier.retryLogin()
      }).catch(() => {
        if (!controller.signal.aborted) {
          console.log("login errored")
          setLoggingIn(false)
          setLoggedIn(false)
          setIsFirstTimeLogin(false)
          retrier.retryLogin()
        }
      })
    }

    retrier.setRetryLogin(login)
    retrier.setRetryWebSocketConnect(connect)
    login()

    window.addEventListener("visibilitychange", () => {
      isVisible = document.visibilityState === 'visible'
      if (isVisible) {
        retrier.flushPendingActions()
      }
    }, { signal: controller.signal })

    return () => {
      controller.abort()
      retrier.abort()
      getWebSocket()?.close()
    }
  }, [supportsWebSocket, online, setWebSocket, getWebSocket])

  const status = getStatus({
    online,
    isFirstTimeLogin,
    loggingIn,
    loggedIn,
    isFirstTimeWebSocket,
    webSocketConnecting,
    webSocketOpen
  })

  return status
}
