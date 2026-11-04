import { useEffect, useRef, useState, useCallback } from "react"

export function useChatWorker() {
  const workerRef = useRef(null)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const worker = new Worker(new URL("../chat-worker.js", import.meta.url), {type: "module"});
    worker.onmessage = (event) => setResult(event.data)
    worker.onerror = (err) => console.error("Worker error:", event.message ?? "(no message)")
    workerRef.current = worker

    //cleanup
    return () => worker.terminate()
  }, [])

  const createChat = (user_message, chat_uuid) => { 
    // call when sending the first message
    workerRef.current?.postMessage({ action: "createChat", messages: [user_message], chat_uuid: chat_uuid })
    workerRef.current?.postMessage({ action: "getAssistantResponse", messages: [user_message], chat_uuid: chat_uuid })
  }

  return { result, createChat }
}
