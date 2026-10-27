import { checkChat, ensureChatsStore } from "./indexedDB-lib"
import { generateAesKey } from "./crypto-lib"
var URL_BASE_STR = "http://localhost:8000/chat"
var crypto_algorithm = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
}

async function createChat(message, chat_uuid) {
    const db = await ensureChatsStore()
    const tx = db.transaction("chats", "readwrite")
    tx.objectStore("chats").put({
        chat_uuid,
        messages: [message],
        aes_key: null, //generateAesKey()
    })

    await new Promise((res, rej)) => {
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error)
    }

    console.log("Stores in SecureDB:", [...db.objectStoreNames])
    db.close();
}

// async function getAESKey(chat_uuid) {
//     // check indexedDB if chat is stored and AES key present
//     var result = await checkChat(chat_uuid)
//     if (!result.chatFound) { // if chat doesn't exists
//         return result
//     } else { // chat does exist 
//         // TODO get AES key and encrypt it then ship it
//     }

// }

// async function encryptChatToLLM(messages, chat_uuid) {
//     return null 
// }

// async function getAssistantResponse(encrypted_messages) {
//     return null
// }

// async function saveChatDB(messages) {
//     console.log("TODO saving chats.")
//     // TODO encrypt chat
//     // TODO send (chat, key) to fastapi endpoint chats/save
// };

onmessage = async (e) => {
  let action = e.data.action
  let messages = e.data.messages
  let chat_uuid = e.data.chat_uuid
  if (action == "createChat") {
      await createChat(messages, chat_uuid) // TODO find where bug
      self.postMessage("chat created")
  }
  // else if (action == "getAssistantMessage") {
  //   const encrypted_messages = await encryptChatToLLM(messages, chat_uuid)
  //   self.postMessage(JSON.stringify(encrypted_messages))
  //   // const result = await getAssistantResponse(encrypted_messages)
  // } else if (action == "save") {
  //     if (messages) {
  //       saveChatDB(messages)
  //     }
  // } else if (action == "getChat") {
  //     // This should be called after opening /chat/chat_uuid (from button in sidemenu or from directly typing in URL)
  //     // TODO call API to request chat_uuid
  //     // TODO save chat to IndexedDB
  // }

}

// Once a chat is opened new or old it should either:
// old: call fastapi endpoint to check if it is stored in DB, pull it and save to indexedDB
// new: create new one with a single user message and generate AES chat key
// invalid uuid: check with fastapi and if chat is not found, redirect to /new page.
// 
// * Send encrypted messages to LLM service
// - [x] generate AES chat key
// - [ ] encrypt chat with AES chat key
// - [ ] encrypt AES chat key with LLM public key
// - [ ] send (enc_chat, enc_aes) to LLM service
