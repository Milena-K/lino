import * as openpgp from 'openpgp';
import { checkChat } from './indexedDB-lib';

/* use this function to generate the master key */
export async function generatePgpKey({name, email, passpharase = ''}) {
    const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{name, email}],
        passphrase,
        format: 'armored',
    })

    return { privateKey, publicKey, revocationCertificate }
}

/* this function generates AES keys for encrypting chat data */
export async function generateAesKey({ length = 256, extractable = false } = {}) {
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length },
        extractable,
        ['encrypt', 'decrypt']
    )
    return key
}

export async function exportAesKey(key) {
    const raw = await crypto.subtle.exportKey('raw', key)
    return btoa(String.fromCharCode(...new Uint8Array(raw)))
};

/* this function should be used to derive AES key from OPAQUE export key */
export async function deriveAesKey(bytes, info) {
    const baseKey = await crypto.subtle.import(
        "raw",
        bytes,
        "HKDF",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: new Uint8Array(0), // no salt
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    )
}

/* function for wrapping the PGP private key */
export async function encryptAes(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ct = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        plaintext
    )
    const out = new Uint8Array(iv.length + ct.byteLength)
    out.set(iv, 0)
    out.set(new Uint8Array(ct), iv.length)
    return out;
}

export async function decryptAes(key, blob) {
    const iv = blob.slice(0,12)
    const ct = blob.slice(12)
    return new Uint8Array(
        await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ct
        )
    )
}



var URL_BASE_STR = "http://localhost:8000/chat"
var crypto_algorithm = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
}


async function getAESKey(chat_uuid) {
    // check indexedDB if chat is stored and AES key present
    var result = await checkChat(chat_uuid)
    if (!result.chatFound) { // if chat doesn't exists
        return result
    } else { // chat does exist 
        // TODO get AES key and encrypt it then ship it
        return null
    }
}

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