import { createChat } from "./indexedDB-lib"
import { generateAesKey, encryptWithAesKey, encryptChatToLLM } from "./crypto-lib"

async function getAssistantResponse () {
  const URL_BASE_STR = "http://localhost:8000/chat/llm"
  const res = await fetch(URL_BASE_STR, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data) // data={enc_messages, enc_aes_key}
  })

  if (res.status != 200) {
    console.log(res.status)
    console.log(res)
  }
  return res
}

const queue = []
let processing = false

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
                // old code
                let action = task.action
                let messages = task.messages
                let chat_uuid = task.chat_uuid
                if (action == "createChat") {
                    // TODO add chat title
                    let chat_key = await generateAesKey(true)
                    console.log(chat_key)
                    let enc_messages = await encryptWithAesKey(chat_key, JSON.stringify(messages)) 
                    let res = await createChat(enc_messages, chat_uuid) 
                    self.postMessage("chat created.")
                } else if (action == "getAssistantMessage") {
                    console.log("hello?")
                    // const data = await encryptChatToLLM(messages, chat_uuid) // {enc_messages, enc_aes_key}
                    // const result = await getAssistantResponse(data)
                    // self.postMessage(JSON.stringify(result))
                    self.postMessage("chat sent.")
                }
                // end old code
            } catch (err) {
                self.postMessage({ id: task.id, error: String(err) })
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
