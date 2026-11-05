import { useEffect, useRef, useState, useCallback } from "react"

export function useChatWorker() {
  const workerRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const worker = new Worker(new URL("../chat-worker.js", import.meta.url), {type: "module"});
    worker.onmessage = (event) => {
      setResult(event.data)
      console.log(event.data)
    }
    worker.onerror = (err) => console.error("Worker error:", err.message ?? "(no message)")
    workerRef.current = worker

    //cleanup
    return () => worker.terminate()
  }, [])

  const createChat = (user_message, chat_uuid) => { 
    // call when sending the first message
    workerRef.current?.postMessage({ action: "createChat", messages: [user_message], chat_uuid: chat_uuid })
  }

  const sendChat = (messages, chat_uuid) => {
    console.log("sending...")
    workerRef.current?.postMessage({ action: "getAssistantResponse", messages, chat_uuid: chat_uuid })
  }

  return { result, createChat, sendChat }
}
