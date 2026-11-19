import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto'; // must come before db.js uses indexedDB
import { openDB, createChat, checkChat } from '../indexedDB-lib';
import * as clib from "../crypto-lib"
import { readMessage } from "openpgp"

const STORE = 'chats'

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

describe('Crypto keys and functions', () => {
  let db;

  beforeEach(async () => {
    db = await openDB();
  });

  afterEach(async () => db?.close());

  it('generates PGP key', async () => {
    let {
        privateKey,
        publicKey,
        revocationCertificate
    } = await clib.generatePgpKey("Milena", 'test@milena.mk')

    console.log(privateKey)
    console.log(publicKey)
    console.log(revocationCertificate)
    expect(privateKey != null).toBe(true);
  })

  it('encrypts with LLM pub key', async () => {
      const messages = [{
        "role": "user",
        "content": "testing",
      }]
      const chat = await createChat(messages, "123-53w-test")
      expect(chat).toBeDefined()
      expect(db).toBeDefined()
      expect(chat.aes_key).toBeDefined()

      clib.encryptChatToLLM(messages, "123-53w-test", chat.aes_key).then(result => {
        expect(result).toBeDefined()
        expect(result.enc_aes).toBeDefined()
      });
  })
})

describe('Testing AES key functions', () => {
  let key;

  it('generates AES key', async () => {
      key = await clib.generateAesKey(true)
      expect(key instanceof CryptoKey).toBe(true)
      expect(key.type).toEqual('secret')
      expect(key.algorithm.name).toEqual('AES-GCM')
  })

  it('it exports AES key', async () => {
      // let key = await clib.generateAesKey({extractable:true})
      let raw_key = await clib.exportAesKey(key)
      console.log(raw_key)
      expect(typeof raw_key).toBe('string')
  })

  it('derives AES key from OPAQUE export key', async () => {
    let opaque_export_key = "7K3xJ9mQpR5vL2wN8tYzF6hC4dE0gB1iM3jO5kP7qS9uT2vW4xZ6aA8bD0cF2eG4hI6jK8lM0nO2pQ4rS6tU8vW0xY2zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY0zA2bC4dE6fG8hI0jK2lM4nO6pQ8rS0tU2vW4xY6zA8bC0dE2fG4hI6jK8lM0nO2pQ4rS6tU8vW0xY2zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY0zA2bC4dE6fG8hI0jK2lM4nO6pQ8rS0tU2vW4xY6zA8bC0dE2fG4hI6jK8lM0nO2pQ4rS6tU8vW0xY2zA4bC6dE8fG0hI2jK4lM6nO8pQ0rS2tU4vW6xY8zA0bC2dE4fG6hI8jK0lM2nO4pQ6rS8tU0vW2xY4zA6bC8dE0fG2hI4jK6lM8nO0pQ2rS4tU6vW8xY0zA2bC4dE"
    let bytes = base64ToBytes(opaque_export_key)
    let derived_key = await clib.deriveAesKey(bytes)
    expect(derived_key instanceof CryptoKey).toBe(true)
    expect(derived_key.type).toEqual('secret')
    expect(derived_key.algorithm.name).toEqual('AES-GCM')
  })

  it('encrypts/decrypts with AES', async () => {
      let original_text = "super secret"
      let cipher_text = await clib.encryptWithAesKey(key, original_text)
      let plaintext = await clib.decryptWithAesKey(key, cipher_text)
      expect(original_text).toEqual(plaintext)
  })
})
