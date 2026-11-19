import { createChat } from "./indexedDB-lib"
import { generateAesKey, encryptWithAesKey, encryptChatToLLM } from "./crypto-lib"
import { getAssistantResponse } from "./utils"

const queue = []
let processing = false
let controller = null

onmessage = (e) => {
    queue.push(e.data)
    void processQueue()
}

async function processQueue() {
    const task = queue.shift();
    let { action, messages, chat_uuid } = task
    if (action == "createChat") {
        // TODO add chat title
        console.log("chat created. worker.")
        let chat_key = await generateAesKey(true)
        let enc_messages = await encryptWithAesKey(chat_key, JSON.stringify(messages)) 
        let res = await createChat(enc_messages, chat_uuid) 
    } else if (action == "saveChat") {
        console.log("started writing response. worker.")
        const data = await encryptChatToLLM(messages, chat_uuid) // {enc_messages, enc_aes_key}
        const reader = await getAssistantResponse(data)
        const decoder = new TextDecoder()
        controller = new AbortController()

        while(true) {
            const { done, value } = await reader.read()
            if (done) break
            const text = decoder.decode(value, { stream: true })
            console.log(text)
            if (text) self.postMessage({ type: "chunk", text })
        }
        self.postMessage({type: "done"})
    } else if () {
        
    }
}
