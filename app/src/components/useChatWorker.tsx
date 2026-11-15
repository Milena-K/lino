import { useEffect, useRef, useState, useCallback } from "react"

interface Task {
  data: string;
}

const FLUSH_INTERVAL_MS = 30

export function useChatWorker() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false); 

  const [text, setText] = useState("")
  const workerRef = useRef(null)
  const bufferRef = useRef("")
  const timerRef = useRef(null)


  const flush = useCallback(() => {
    if (timerRef.current != null) {
      clearTiemeout(timerRef.current) 
      timerRef.current = null
    }
    const text = bufferRef.current
    if (!text) return
    bufferRef.current = ""
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (!last || last.role !== "assistant") return prev
      return [...prev.slice(0, -1), { ...last, content: last.content + text }]
    })
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL("../chat-worker.js", import.meta.url), {type: "module"});
    workerRef.current = worker
    worker.onmessage = (e) => {
      const { type, text, error } = e.data
      if (type === "chunk") {
        console.log(text)
        bufferRef.current += text
        if(timeRef.current == null)
          timerRef.current = setTimeout(flush, FLUSH_INTERVAL_MS)
        return;
      }
      flush()
      setIsStreaming(false)
      if (type === "error") {
        setMessages((prev) => [
          ...prev,
          { role: "error", content: "Error: ${error}" }
        ])
      }
    }
    // worker.onerror = (event) => console.error("Worker error:", event ?? "(no message)")
    worker.onerror = (e) => console.error('Worker error:', e.message, e.filename, e.lineno, e.colno);
    return () => { //cleanup
      worker.terminate()
      if (timerRef.current != null)
        clearTimeout(timerRef.current)
    }
  }, [flush])
  // }, [])

  const createChat = (user_message, chat_uuid) => { 
    // call when sending the first message
    // setProcessing(true)
    console.log("creating chat.")
    workerRef.current?.postMessage({
      action: "createChat",
      messages: [user_message],
      chat_uuid: chat_uuid
    })
  }

  const sendChat = (messages, chat_uuid) => { // TODO should the Chat component send the text only instead of all messages?
    // TODO think this through...
    // messages are sent to this chat worker. However, there is also a local setMessages
    console.log("sending chat.")
    if (isStreaming || !messages) return
    // setIsStreaming(true) TODO uncomment this
    workerRef.current?.postMessage({
      type: 'start',
      action: "getAssistantMessage",
      messages,
      chat_uuid: chat_uuid
    })
  }

  const saveChat = (messages, chat_uuid) => { // TODO should the Chat component send the text only instead of all messages?
    console.log("saving chat.")
    if (isStreaming || !messages) return
    console.log("for real")
    workerRef.current?.postMessage({
      action: "saveChat",
      messages,
      chat_uuid: chat_uuid
    })
  }

  const cancel = useCallback(() => {
    workerRef.current?.postMessage({ type: "cancel" })
  }, [])


  return { createChat, sendChat, saveChat, text, setText, isStreaming }
}
