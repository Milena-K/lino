export var RSA_algorithm = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
}
/*
Get some key material to use as input to the deriveKey method.
The key material is the export key, instead of the user password.
*/
export function getKeyMaterial(material) {
  const enc = new TextEncod er()
  return crypto.subtle.importKey(
    "raw",
    enc.encode(material),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"])
}


/*for deriving AES keys (from session key, export key) */
export function getKey(keyMaterial, salt) {
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["wrapKey", "unwrapKey", "encrypt", "decrypt"]
  )
}

/*wrap another symmetric key with an AES key*/
export async function wrapCryptoKey(key, keyToWrap) {
  // get the key encryption key
  const keyMaterial = await getKeyMaterial(key)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const wrappingKey = await getKey(keyMaterial, salt)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const wrappedKey = await crypto.subtle.wrapKey(
    "raw", keyToWrap, wrappingKey, {name: "AES-GCM", iv}
  )
  return {
    wrappedKey,
    salt,
    iv
  }
}

export const bytesToHex = (bytes) => {
  return Array.from(bytes, (byte) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
};

export const hexToBytes = (hex) => {
  var bytes = [];
  for (var c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
};

export function bytesToArrayBuffer(bytes) {
  const bytesAsArrayBuffer = new ArrayBuffer(bytes.length)
  const bytesUint8 = new Uint8Array(bytesAsArrayBuffer)
  bytesUint8.set(bytes)
  return bytesAsArrayBuffer
}

export async function getUnwrappingKey(key, saltBytes) {
  const keyMaterial = await getKeyMaterial(key)
  const saltBuffer = bytesToArrayBuffer(saltBytes)
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["wrapKey", "unwrapKey"]
  )
}

export async function unwrapPrivateKey(secret, wrappedKey, salt, ivBytes) {
  const unwrappingKey = await getUnwrappingKey(secret, salt);
  const wrappedKeyBuffer = bytesToArrayBuffer(wrappedKey)
  const ivBuffer = bytesToArrayBuffer(ivBytes)
  return crypto.subtle.unwrapKey(
    "pkcs8",
    wrappedKeyBuffer,
    unwrappingKey,
    {
      name: "AES-GCM",
      iv: ivBuffer,
    },
    {
      name: "RSA-PSS",
      hash: "SHA-256",
    },
    false,
    ["encrypt", "decrypt"]
  )
}

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

