import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto'; // must come before db.js uses indexedDB
import { openDB, createChat, checkChat } from '../indexedDB-lib';

const STORE = 'chats'

async function getAllChatsFromDB() {
    const db = await openDB()
    const chats = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).getAll()
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
    return chats
}

describe('IndexedDB transactions', () => {
  let db;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(async () => db?.close());

  it('creates the object store - chats', async () => {
    let message = {
        "role": "user",
        "message": "testing",
    }
    const chat = await createChat([message], "id-123")
    const stored = await getAllChatsFromDB()
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(chat);
  });


  it('finds the correct chat', async () => {
    let message = {
        "role": "user",
        "message": "testing",
    }
    const uuid = "id-123"
    const chatA = await createChat([message], uuid)
    const chatB = await checkChat(uuid)
      console.log(chatB)
    expect(chatB.uuid).toEqual(uuid)
  });

});
