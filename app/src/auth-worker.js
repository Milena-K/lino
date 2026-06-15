import * as opaque from "@serenity-kit/opaque"
import * as forge from "node-forge"
// import hkdf from 'js-crypto-hkdf'
import {RSA_algorithm,
        wrapCryptoKey,
        getKeyMaterial,
        getKey,
        unwrapPrivateKey,
        bytesToHex,
       } from "./crypto"

var URL_BASE_STR = "http://localhost:8000/auth"


async function register(username, password) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  var response = await fetch(URL_BASE_STR + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ["http://localhost:8000/"],
      "Access-Control-Allow-Credentials": "false", // TODO made a change here
    },
    body: JSON.stringify({
      username,
      regReq: registrationRequest,
    })
  })
  var registrationResponse = await response.json()
  var result = { clientRegistrationState, registrationResponse };
  console.log("test")
  return result
}

async function register_finish(username, password, clientRegistrationState, registrationResponse) {
  const { exportKey, registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password
  })
  const RSA_key = await crypto.subtle.generateKey(RSA_algorithm, true, ["encrypt", "decrypt"])
  const RSA_priv_key = await crypto.subtle.exportKey("pkcs8", RSA_key.privateKey)
  console.log("RSA")
  console.log(RSA_priv_key)
  console.log(password)
  const RSA_pub_key = RSA_key.publicKey
  // let { wrappedKey, salt, iv } = await wrapCryptoKey(exportKey, RSA_key.privateKey) // key, salt, iv
  // wraps and encrypts a Forge private key and outputs it in PEM format
  // TODO: convert RSA_priv_key to forge.pki.PrivateKey
  const pem = forge.pki.encryptRsaPrivateKey(RSA_priv_key, password);

  console.log("something")
  console.log(pem)
  const rsa_key = pem
  // const rsa_key = bytesToHex(wrappedKey)
  // salt = bytesToHex(salt)
  // iv = bytesToHex(salt)
  const result = await fetch(URL_BASE_STR + "/register_finish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ["http://localhost:8000/","*"],
      "Access-Control-Allow-Credentials": false,
    },
    body: JSON.stringify({
      username,
      registration_record: registrationRecord,
      rsa_key,
      salt,
      iv
    })
  })
    console.log("----------------")
    console.log("rsa_key")
    console.log("----------------")
    console.log(rsa_key)
    console.log("----------------")
    console.log("salt")
    console.log("----------------")
    console.log(salt)
    console.log("----------------")
    console.log("iv")
    console.log("----------------")
    console.log(iv)
  if (result.status == 200) {
  }
  if (result.status != 200) {
    // TODO: check for server response "User already exists"
    console.error(result.status)
    console.error(result.statusText)
  }
}

async function login(username, password) {
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password
  })
  var response = await fetch(URL_BASE_STR + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ["http://localhost:8000/auth/login"], // ,"*"
      "Access-Control-Allow-Credentials": false,
    },
    body: JSON.stringify({
      username,
      login_request: startLoginRequest
    })
  })
  var loginResponse  = await response.json()
  var result = { clientLoginState, loginResponse }
  return result
}

async function login_finish(username, password, clientLoginState, loginResponse) {
  console.log({
    clientLoginState,
    loginResponse,
    password
  })
  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password
  })
  if (!loginResult) {
    throw new Error("Login failed.")
  }
  const { exportKey, finishLoginRequest, sessionKey } = loginResult
  console.log("session key:")
  console.log(sessionKey)
  let loginRequest = await fetch(URL_BASE_STR + "/login_finish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ["http://localhost:8000/auth/login_finish","*"],
      "Access-Control-Allow-Credentials": false,
    },
    body: JSON.stringify({
      username,
      request_finish: finishLoginRequest
    })
  })

  if (loginRequest.ok) {
    //TODO: get the RSAkey from the loginRequest
    const userKey = loginRequest.body
    const RSAKey = await unwrapPrivateKey(exportKey, userKey.RSAKey, userKey.salt, userKey.iv)
    // derive AES key from session key
    const keyMaterial = await getKeyMaterial(sessionKey)
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const session_AES_key = await getKey(keyMaterial, salt)
    addKey("RSAKey", RSAKey)
    addKey("sessionAESKey", session_AES_key)
  }
}

function createDB () {
  const dbName = "SecureDB";
  const dbVersion = 1;
  const request = indexedDB.open(dbName, dbVersion)
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("keys")) {
      db.createObjectStore("keys", {keyPath: "keyName"})
    }
    console.log("Database setup complete.")
  }
  request.onsuccess = (event) => {
    const db = event.target.result;
    console.log("DB opened successfully. ", db)
  }
  request.onerror = (event) => {
    console.log("Error opening database: ", event.target.errorCode)
  }
}

function addKey (keyName, keyValue) {
  const request = indexedDB.open("SecureDB", 1);
  request.onsuccess = (event) => {
    const db = event.target.result
    const transaction = db.transaction("keys", "readwrite")
    const objectStore = transaction.objectStore("keys")
    const key = { keyName, keyValue }
    const addRequest = objectStore.add(key)

    addRequest.onsuccess = () => {
      console.log("Key added: ", key)
    }
    addRequest.onerror = () => {
      console.error("Error adding key: ", event.target.errorCode)
    }
  }
}



onmessage = async function (e) {
  var action = e.data.action;
  var username = e.data.id;
  var password = e.data.pw;
  if (action === "register") {
    var { clientRegistrationState, registrationResponse } = await register(username, password)
    register_finish(username, password, clientRegistrationState, registrationResponse)
  } else if (action === "login") {
    createDB()
    try {
      let { clientLoginState, loginResponse } = await login(username, password)
      await login_finish(username, password, clientLoginState, loginResponse)
    }catch (error){
      console.log(error)
      // console.error("The user is already logged in.")
    }
  } else if (action == "logout") {
    console.log(this.indexedDB)
    console.log("logout")
    let result = indexedDB.deleteDatabase("SecureDB")
    result.onsuccess = () => {
      console.log("DB deleted.")
    }
    result.onerror = () => {
      console.log("DB not deleted.")
    }
    await fetch(URL_BASE_STR + "/logout/" + username, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ["http://localhost:8000/","*"],
        "Access-Control-Allow-Credentials": false,
      },
    })
  } else {
    console.log("action is not defined.")
  }
};
