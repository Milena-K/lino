import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto'; // must come before db.js uses indexedDB
import { openDB, createChat } from '../src/indexedDB-lib';

describe('IndexedDB transactions', () => {
  let db;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(async () => db?.close());

  it('creates the object store - chats', async () => {
    let message = {
        "role": "user",
        "message": "testing"
    }
    await createChat(chat=[message], chat_uuid="123")
    expect(db.objectStoreNames.contains('chats')).toBe(true);
  });

//   it('commits a readwrite transaction', async () => {
//     await expect(putItem(db, { id: 1, name: 'alpha' })).resolves.toBe(true);
//   });

//   it('persists the written data', async () => {
//     await putItem(db, { id: 2, name: 'beta' });
//     const tx = db.transaction('items', 'readonly');
//     const req = tx.objectStore('items').get(2);
//     const result = await new Promise((resolve, reject) => {
//       req.onsuccess = () => resolve(req.result);
//       req.onerror = () => reject(req.error);
//     });
//     expect(result).toEqual({ id: 2, name: 'beta' });
//   });
});