import { createChat } from "./indexedDB-lib"

onmessage = async (e) => {
  let action = e.data.action
  let messages = e.data.messages
  let chat_uuid = e.data.chat_uuid
  if (action == "createChat") {
      let res = await createChat(messages, chat_uuid) // TODO find where bug
      self.postMessage("chat created.")
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
