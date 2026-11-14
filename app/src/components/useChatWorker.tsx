import { useEffect, useRef, useState, useCallback } from "react"

interface Task {
  id: number;
  data: string;
}

const FLUSH_INTERVAL_MS = 30

export function useChatWorker() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false); 

  const [text, setText] = useState("")
  const [id, setId] = useState(0) // TODO figure out how useful is ID
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
    worker.onerror = (err) => console.error("Worker error:", err.message ?? "(no message)")
    //cleanup
    return () => {
      worker.terminate()
      if (timerRef.current != null)
        clearTimeout(timerRef.current)
    }
  }, [flush])

  const createChat = (user_message, chat_uuid) => { 
    // call when sending the first message
    // setProcessing(true)
    setId(id+1)
    workerRef.current?.postMessage({ id, action: "createChat", messages: [user_message], chat_uuid: chat_uuid })
  }

  const sendChat = (messages, chat_uuid) => { // TODO should the Chat component send the text only instead of all messages?
    // TODO think this through...
    // messages are sent to this chat worker. However, there is also a local setMessages 
    // console.log("sending...")
    // setProcessing(true)
    if (isStreaming || !messages) return
    // const history = [...messages, { role: "user", content: userText }];
    // setMessages([...history, { role: "assistant", content: "" }]);
    setIsStreaming(true)
    setId(id+1) // TODO decide if this should be uuid
    workerRef.current?.postMessage({
      type: 'start',
      id,
      action: "getAssistantMessage",
      messages,
      chat_uuid: chat_uuid
    })
  }

  const saveChat = (messages, chat_uuid) => { // TODO should the Chat component send the text only instead of all messages?
    if (isStreaming || !messages) return
    setId(id+1) // TODO decide if this should be uuid
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
