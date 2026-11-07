import { useEffect, useRef, useState, useCallback } from "react"

interface Task {
  id: number;
  data: string;
}

export function useChatWorker() {
  const workerRef = useRef(null)
  const [queue, setQueue] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [id, setId] = useState(0)

  useEffect(() => {
    const worker = new Worker(new URL("../chat-worker.js", import.meta.url), {type: "module"});
    worker.onmessage = (event) => {
      // const result: Task = {
      //   id: event.id,
      //   data: event.data
      // }
      // setQueue([...queue, result])
      // TODO set something as result or queue
      console.log(event.data)
      console.log(event)
      console.log("onmessage received.")
    }
    worker.onerror = (err) => console.error("Worker error:", err.message ?? "(no message)")
    workerRef.current = worker
    //cleanup
    return () => worker.terminate()
  }, [])

  const createChat = (user_message, chat_uuid) => { 
    // call when sending the first message
    // setProcessing(true)
    setId(id+1)
    workerRef.current?.postMessage({ id, action: "createChat", messages: [user_message], chat_uuid: chat_uuid })
  }

  const sendChat = (messages, chat_uuid) => {
    console.log("sending...")
    // setProcessing(true)
    setId(id+1)
    workerRef.current?.postMessage({ id, action: "getAssistantMessage", messages, chat_uuid: chat_uuid })
  }

  return { queue, createChat, sendChat }
}
