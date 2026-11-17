import { useEffect, useRef, useState, useCallback } from "react"


export function useAuthWorker() {
  const workerRef = useRef(null)


  useEffect(() => {
    const worker = new Worker(new URL("../auth-worker.js", import.meta.url), {type: "module"});
    workerRef.current = worker
    worker.onmessage = (e) => {
      console.log("Worker message:", e.data ?? "(no message)")
    }
    worker.onerror = (event) => console.error("Worker error:", event ?? "(no message)")
    return () => { //cleanup
      worker.terminate()
    }

  }, [])

  const register = ( username: string, password: string) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ action: "register", id: username, pw: password })
    }
  }

  const login = (username: string, password: string) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ action: "login", id: username, pw: password })
    }
  }

  const logout = () => {
    if (workerRef.current) {
      workerRef.current.postMessage({ action: "logout" })
    }
  }

  return { register, login, logout }
}
