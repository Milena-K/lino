import { generateAesKey } from "./crypto-lib"

const promisify = req =>
      new Promise((resolve, reject) => {
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
      })

export async function checkChat(chatUuid, db=null) {
    if (!db) {
      db = await openDB()    
    }

    if (!db) return { dbExists: false }

    try {
        if (!db.objectStoreNames.contains("chats")) {
            return {
                dbExists: true,
                storeExists: false,
                availableStores: [...db.objectStoreNames],
            }
        }
        const store = db.transaction("chats", "readonly").objectStore("chats")

        // lookup by primary key
        let record;
        if (store.keyPath === 'chat_uuid') {
            record = await promisify(store.get(chatUuid))
        }
        if (!record) {
            // TODO: here I should call /chats to see if we have chat stored in DB
            // let URL_BASE_STR = "http://localhost:8000/chat"
            return {
                dbExists: true,
                storeExists: true,
                chatFound: false
            }
        }

        const key = record["aes_key"]
        return {
            dbExists: true,
            storeExists: true,
            chatFound: true,
            hasAesKey: key != null,
            keyType: key != null ? Object.prototype.toString.call(key) : null,
            uuid: record["chat_uuid"],
            aesKey: key,
            recordFields: Object.keys(record)
        }
    } finally {
        db.close()
    }
}

export function openDB(name="SecureDB", version=null, onUpgrade=null) {
    return new Promise((resolve, reject) => {
        const req = version ? indexedDB.open(name, version) : indexedDB.open(name)
        if (onUpgrade) req.onupgradeneeded = () => onUpgrade(req.result)
        req.onsuccess = () => {
            const db = req.result
            db.onversionchange = () => db.close()
            resolve(db);
        }
        req.onerror = () => reject(req.error)
        req.onblocked = () => reject(new Error("Upgrade blocked: close other tabs using this DB"))
    })
}

export async function ensureChatsStore(dbName = "SecureDB") {
    const db = await openDB()
    if (db.objectStoreNames.contains("chats")) return db;

    const nextVersion = db.version + 1
    db.close();

    return openDB(dbName, nextVersion, upgradeDb => {
        upgradeDb.createObjectStore("chats", {keyPath: "chat_uuid"})
    })
}

export async function createChat(messages, chat_uuid) {
/*  Once a chat is opened:
    - old: call fastapi endpoint to check if it is stored in DB, pull it and save to indexedDB
    - new: create new one with a single user message and generate AES chat key
    - invalid uuid: check with fastapi and if chat is not found, redirect to /new page.
*/
    // TODO: check if there is already a chat with that uuid
    const aes_key = await generateAesKey(true) // the key is extractable
    const chat = {
        chat_uuid,
        messages,
        aes_key  
    }
    const indexedDB = await ensureChatsStore()
    const tx = indexedDB.transaction("chats", "readwrite")
    tx.objectStore("chats").put(chat)

    await new Promise((res, rej) => {
        tx.oncomplete = res();
        tx.onerror = () => rej(tx.error)
    })

    console.log("Stores in SecureDB:", [...indexedDB.objectStoreNames])
    indexedDB.close();
    return chat
}

export async function getAesKey(chat_uuid) {
    // check indexedDB if chat is stored and AES key present
    let result = await checkChat(chat_uuid)
    if (!result.chatFound) { // chat doesn't exists
        console.error("chat not found.")
        return null 
    }
    return result.aesKey // chat does exist 
}
