import { useState, useEffect, useRef } from 'react'

export const useWebSocket = (url) => {
  const [data, setData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)
  const ws = useRef(null)

  useEffect(() => {
    if (!url) return

    const wsUrl = `ws://localhost:8000${url}`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        setData(message)
      } catch (err) {
        setError('Failed to parse message')
      }
    }

    ws.current.onerror = (err) => {
      setError('WebSocket error')
      setIsConnected(false)
    }

    ws.current.onclose = () => {
      setIsConnected(false)
    }

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [url])

  const sendMessage = (message) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(message))
    }
  }

  return { data, isConnected, error, sendMessage }
}