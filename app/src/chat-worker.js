import { createChat, getAesKey } from "./indexedDB-lib"
import { generateAesKey, encryptWithAesKey, encryptChatToLLM, decryptWithAesKey } from "./crypto-lib"
import { getAssistantResponse } from "./utils"

self.addEventListener('error', (e) => console.log('inside worker:', e.message, e.filename, e.lineno));
self.addEventListener('unhandledrejection', (e) => console.log('rejection:', e.reason));

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
                } else if (action == "getAssistantMessage") {
                    const type = task.type; 
                    if (type === 'cancel') {
                        controller?.abort()
                        return;
                    }
                    if (type === "start") {
                        console.log("started writing response")
                        const data = await encryptChatToLLM(messages, chat_uuid) // {enc_messages, enc_aes_key}
                        const reader = await getAssistantResponse(data)
                        controller = new AbortController()
                        
                        while(true) {
                            const { done, value } = await reader.read()
                            if (done) break
                            const aes_key = await getAesKey(chat_uuid)
                            const plaintext = await decryptWithAesKey(aes_key, value)
                            if (plaintext) self.postMessage({ type: "chunk", text: plaintext })
                        }
                        self.postMessage({type: "done"})
                    } 
                } else if (action == "saveChat") {
                    // TODO update/save chat to IndexedDB
                    await saveChatIDB(messages, chat_uuid)
                    // TODO generate new aes key for enc messages
                    const new_aes_key = await generateAesKey(true)
                    // TODO encrypt the messages with aes_key (they could be already encrypted)
                    const enc_messages = await encryptWithAesKey(new_aes_key, JSON.stringify(messages))
                    // TODO encrypt the aes_key with pgp_key
                    
                    // TODO send to fastapi
                }

                // ADD new actions HERE
            } catch (err) {
                if (err.name === "AbortError") {
                    self.postMessage({ type: "aborted", error: String(err) })
                } else {
                    self.postMessage({ type: "error", error: String(err) })
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
