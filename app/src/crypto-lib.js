import * as openpgp from 'openpgp';
import { checkChat, getAesKey } from './indexedDB-lib';

var LLM_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEato/vBYJKwYBBAHaRw8BAQdAFeBwi4/eqSTcolri4lXH5/F9BdhyTgO7cI/8
yV3S8d60J01pbGVuYSBLdWtvbGogPHB1YmxpY19taWxlbmFAcHJvdG9uLm1lPoiQ
BBMWCgA4FiEEbQ46OTE1h4cI+9mMLkl0O+s2ltoFAmraP7wCGwEFCwkIBwIGFQoJ
CAsCBBYCAwECHgECF4AACgkQLkl0O+s2ltrZxQD/cQ+wie6ZIrgaXdRIPF8pjAgP
ohMAAuz6rbe46cYwfQUA/Rvi1z9A2S7noB/cbqR+Vu2VWOE7Hp68KCLCvhb05yMI
uDgEato/vBIKKwYBBAGXVQEFAQEHQB9M8/FvSDIjtf+hUMg1Xd0TfognegOMa2GC
2w7DfFJsAwEIB4h4BBgWCgAgFiEEbQ46OTE1h4cI+9mMLkl0O+s2ltoFAmraP7wC
GwwACgkQLkl0O+s2ltpxHwEAjZqWtgp+omRVFbgUk6nCt3cb79WRcrVkBjFHsfWV
QGgA/2avQU35IQAQPFKEbhg90ZHZtR3uNfzVjjOxaIgXJ9sL
=T5K+
-----END PGP PUBLIC KEY BLOCK-----`

export async function encryptWithLLMKey(aesKey) {
    var cleanKey = LLM_PUBLIC_KEY
    .split("\n")
    .map(l => l.replace(/^\s+/, ""))   
    .join("\n");

    const publicKey = await openpgp.readKey({ armoredKey: cleanKey });
    console.log("fingerprints")
    console.log(publicKey.getFingerprint())

    const rawKey = await crypto.subtle.exportKey('raw', aesKey)
    const keyBytes = new Uint8Array(rawKey)
    const message = await openpgp.createMessage({binary: keyBytes})

    const secret = await openpgp.encrypt({
        message,
        encryptionKeys: publicKey,
        format: 'armored'
    })
    console.log(secret)
    return secret
}

/* use this function to generate the master key */
export async function generatePgpKey(name, email, passphrase = '') {
    console.log(name)
    console.log(email)
    const cv25519_algorithm = {
        type: 'ecc',
        curve: 'curve25519',
        userIDs: [{name, email}],
    }
    let {
        privateKey,
        publicKey,
        revocationCertificate } = await openpgp.generateKey(cv25519_algorithm)

    return { privateKey, publicKey, revocationCertificate }
}

/* this function generates AES keys for encrypting chat data */
export async function generateAesKey(extractable=false) {
    console.log("extractable:", extractable)
    let length = 256
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: length },
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
export async function deriveAesKey(bytes) {
    const info = new TextEncoder().encode("aes-gcm-256")
    const baseKey = await crypto.subtle.importKey(
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
            info,
            salt: new Uint8Array(0), // no salt
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    )
}

/* function for wrapping the PGP private key, or any other plaintext */
export async function encryptWithAesKey(key, plaintext) {
    // converts string to Uint8Array, so that it can be used by the encrypt() method
    const bytes = new TextEncoder().encode(plaintext)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ct = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        bytes
    )
    const out = new Uint8Array(iv.length + ct.byteLength)
    out.set(iv, 0)
    out.set(new Uint8Array(ct), iv.length)
    return out;
}

export async function decryptWithAesKey(key, blob) {
    const iv = blob.slice(0,12)
    const ct = blob.slice(12)
    return new TextDecoder().decode(
        await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ct
        )
    )
}


export async function encryptChatToLLM(messages, chat_uuid) {
    // TODO: encrypt messages with AES chat key
    const chat_key = await getAesKey(chat_uuid)
    if (!chat_key) return null // TODO maybe I should raise an error here "chat not found."
    const enc_messages = await encryptWithAesKey(chat_key, JSON.stringify(messages)) 
    // TODO: encrypt AES key with LLM pub key
    const enc_aes = await encryptWithLLMKey(chat_key)
    return {enc_messages, enc_aes}
}


// async function getAssistantResponse(encrypted_messages) {
//     return null
// }

// async function saveChatDB(messages) {
//     console.log("TODO saving chats.")
//     // TODO encrypt chat
//     // TODO send (chat, key) to fastapi endpoint chats/save
// };
