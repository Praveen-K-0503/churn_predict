import { useEffect, useRef, useState } from 'react'

const useWebSocket = (url, options = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const ws = useRef(null)
  const { onOpen, onMessage, onClose, onError } = options

  useEffect(() => {
    if (!url) return

    const wsUrl = url.startsWith('ws') ? url : `ws://localhost:8000${url}`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = (event) => {
      setIsConnected(true)
      onOpen?.(event)
    }

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLastMessage(data)
      onMessage?.(data)
    }

    ws.current.onclose = (event) => {
      setIsConnected(false)
      onClose?.(event)
    }

    ws.current.onerror = (event) => {
      onError?.(event)
    }

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [url])

  const sendMessage = (message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    }
  }

  return {
    isConnected,
    lastMessage,
    sendMessage
  }
}

export default useWebSocket