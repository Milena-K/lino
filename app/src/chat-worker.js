import { createChat } from "./indexedDB-lib"
import { generateAesKey, encryptWithAesKey, encryptChatToLLM } from "./crypto-lib"
import { getAssistantResponse, toBase64 } from "./utils"

const queue = []
let processing = false
let controller = null

onmessage = (e) => {
    queue.push(e.data)
    void processQueue()
}

async function processQueue() {
    if (processing) return;

    processing = true;
    try {
        while (queue.length > 0) {
            const task = queue.shift();
            try {
                let action = task.action
                let messages = task.messages
                let chat_uuid = task.chat_uuid
                if (action == "createChat") {
                    // TODO add chat title
                    let chat_key = await generateAesKey(true)
                    let enc_messages = await encryptWithAesKey(chat_key, JSON.stringify(messages)) 
                    let res = await createChat(enc_messages, chat_uuid) 
                    // self.postMessage("chat created.")
                } else if (action == "getAssistantMessage") {
                    const { type, id } = task.data; // TODO check if id is sent

                    if (type === 'cancel') {
                        controller?.abort()
                        return;
                    }

                    if (type === "start") {
                        const data = await encryptChatToLLM(messages, chat_uuid) // {enc_messages, enc_aes_key}
                        const reader = await getAssistantResponse(data)
                        const decoder = new TextDecoder()
                        controller = new AbortController()
                        
                        while(true) {
                            const { done, value } = await reader.read()
                            if (done) break
                            const text = decoder.decode(value, { stream: true })
                            if (text) self.postMessage({ type: "chunk", id, text })
                        }
                        self.postMessage({type: "done", id })
                        // self.postMessage(JSON.stringify(result))
                        // self.postMessage("chat sent.")
                    } 
                }// ADD new actions HERE
            } catch (err) {
                if (err.name === "AbortError") {
                    self.postMessage({ type: "aborted", id, error: String(err) })
                } else {
                    self.postMessage({ type: "error", id, error: String(err) })
                }
            }
        }
    } finally {
        processing = false
    }
}


  // } else if (action == "save") {
  //     if (messages) {
  //       saveChatDB(messages)
  //     }
  // } else if (action == "getChat") {
  //     // This should be called after opening /chat/chat_uuid (from button in sidemenu or from directly typing in URL)
  //     // TODO call API to request chat_uuid
  //     // TODO save chat to IndexedDB
  // }


// Once a chat is opened new or old it should either:
// old: call fastapi endpoint to check if it is stored in DB, pull it and save to indexedDB
// new: create new one with a single user message and generate AES chat key
// invalid uuid: check with fastapi and if chat is not found, redirect to /new page.
// 
// * Send encrypted messages to LLM service
// - [x] generate AES chat key
// - [x] encrypt chat with AES chat key
// - [x] encrypt AES chat key with LLM public key
// - [x] send (enc_chat, enc_aes) to LLM service
