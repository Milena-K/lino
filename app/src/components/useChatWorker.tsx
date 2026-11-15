import { useEffect, useRef, useState, useCallback } from "react"

interface Task {
  data: string;
}

const FLUSH_INTERVAL_MS = 30

export function useChatWorker() {
  const [reply, setReply] = useState("")
  const [isStreaming, setIsStreaming] = useState(false); 

  const workerRef = useRef(null)
  const bufferRef = useRef("")
  const timerRef = useRef(null)


  const flush = useCallback(() => {
    // cancel any scheduled flushes
    if (timerRef.current != null) {
      clearTimeout(timerRef.current) 
      timerRef.current = null
    }
    // read the buffer, if it's empty nothing to do
    const buffer_text = bufferRef.current
    if (!buffer_text) return
    // reset buffer, and append last buffer message
    bufferRef.current = ""
    setReply((prev) => prev + buffer_text)
    // setReply((prev) => {
    //   const last = prev[prev.length - 1]
    //   if (!last || last.role !== "assistant") return prev
    //   return [...prev.slice(0, -1), { ...last, content: last.content + buffer_text }]
    // })
  }, [])

  useEffect(() => {
    const worker = new Worker(new URL("../chat-worker.js", import.meta.url), {type: "module"});
    workerRef.current = worker
    worker.onmessage = (e) => {
      const { type, text, error } = e.data
      if (type === "chunk") {
        // console.log(text)
        bufferRef.current += text
        setIsStreaming(true)
        if(timerRef.current == null)
          timerRef.current = setTimeout(flush, FLUSH_INTERVAL_MS)
        return;
      }
      flush()
      setIsStreaming(false)
      if (type === "error") {
        setReply(`error: ${error}`)
      }
    }
    worker.onerror = (event) => console.error("Worker error:", event ?? "(no message)")
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

  const sendChat = (messages, chat_uuid) => {
    console.log("sending chat.")
    if (isStreaming || !messages) return
    workerRef.current?.postMessage({
      type: 'start',
      action: "getAssistantMessage",
      messages,
      chat_uuid: chat_uuid
    })
  }

  const saveChat = (messages, chat_uuid) => { 
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


  return { createChat, sendChat, saveChat, isStreaming, reply, setReply }
}
