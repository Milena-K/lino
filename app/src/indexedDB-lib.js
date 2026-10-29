const promisify = req =>
      new Promise((resolve, reject) => {
          req.onsuccess = () => resolve(req.result)
          req.onerror = () => reject(req.error)
      })

export async function checkChat(chatUuid) {
    const db = await openDB()
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
    const db = await openDB(dbName)
    if (db.objectStoreNames.contains("chats")) return db;

    const nextVersion = db.version + 1
    db.close();

    return openDB(dbName, nextVersion, upgradeDb => {
        upgradeDb.createObjectStore("chats", {keyPath: "chat_uuid"})
    })
}

export async function createChat(messages, chat_uuid) {
    const db = await ensureChatsStore()
    const tx = db.transaction("chats", "readwrite")
    const chat = {
        chat_uuid,
        messages,
        aes_key: null, //generateAesKey()
    }
    tx.objectStore("chats").put(chat)

    await new Promise((res, rej) => {
        tx.oncomplete = res();
        tx.onerror = () => rej(tx.error)
    })

    console.log("Stores in SecureDB:", [...db.objectStoreNames])
    db.close();
    return chat
}
