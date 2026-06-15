var URL_BASE_STR = "http://localhost:8000/chat"
var crypto_algorithm = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
}


// async function getItemFromStore(key_name) {
  // const db = await open
  // TODO maybe use a lib for index db
// }
let db;
const db_request = indexedDB.open("SecureDB");
db_request.onerror = (event) => {
  console.error("IndexDB could not open.")
  console.error(`Database error: ${event.target.error?.message}`)
}
db_request.onsuccess = (event) => {
  db = event.target.result;
}

// function getItemFromStore(key_name) {
//     let master_key, enc_export_key;
//     const objectStore = db.transaction("keys").objectStore("keys")
//     const request_mas = objectStore.get("masterKey")
//     const request_exp = objectStore.get("exportKey")
//     request_exp.onsuccess = () => {
//       master_key = request_mas.result.keyValue
//       console.log("master key:")
//       console.log(master_key)
//       request_exp.onsuccess = () => {
//         enc_export_key = request_exp.result.keyValue
//         console.log("enc export key:")
//         console.log(enc_export_key)
//       }
//     }
// }

async function encrypt_chat_to_LLM(new_messages) {
    let master_key, enc_export_key;
    const objectStore = db.transaction("keys").objectStore("keys")
    const request_mas = objectStore.get("masterKey")
    const request_exp = objectStore.get("exportKey")
    request_mas.onsuccess = () => {
      master_key = request_mas.result.keyValue
    }
    request_exp.onsuccess = async () => {
      enc_export_key = request_exp.result.keyValue
      console.log("master key:")
      console.log(master_key)
      const export_key = await crypto.subtle.decrypt(crypto_algorithm, master_key.privateKey, enc_export_key)

      console.log("export key:")
      console.log(export_key)
      // const aes_key = crypto.subtle.generateKey(
      //   {
      //     name: "AES-GCM",
      //     length: 256,
      //   },
      //   true,
      //   ["encrypt", "decrypt"]
      // )

      // const enc_messages = await crypto
    }
  return null;
}

async function getAssistantResponse (enc_messages) {
  const res = await fetch(URL_BASE_STR, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ["http://localhost:8000/"],
      "Access-Control-Allow-Credentials": "false", // TODO made a change here
    },
    body: JSON.stringify({ "messages": enc_messages })
  })

  if (res.status != 200) {
    console.log(res.status)
    console.log(res)
  }
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let out = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    // TODO this value should be encoded, so first decode it.
    out += decoder.decode(value)
    self.postMessage(out)
  }
  return out
}

self.onmessage = (e) => {
  let action = e.data.action
  if (action == "getAssistantMessage") {
    let messages = e.data.data
    const encrypted_messages = encrypt_chat_to_LLM(messages)
    // getAssistantResponse(encrypted_messages)
  }
}
