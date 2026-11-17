// import * as forge from "node-forge"
// import * as openpgp from 'openpgp';
// // import hkdf from 'js-crypto-hkdf'
// import {RSA_algorithm,
//         wrapCryptoKey,
//         getKeyMaterial,
//         getKey,
//         unwrapPrivateKey,
//         bytesToHex,
//        } from "./crypto"

import * as opaque from "@serenity-kit/opaque";
// var URL_BASE_STR = "http://localhost:8000/auth"
var URL_BASE_STR = "https://spidery-spooky-wraith-x9pj6r4q9q9fx9-8000.app.github.dev/auth"

async function register(username, password) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  const response = await fetch(URL_BASE_STR + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      regReq: registrationRequest,
    })
  })
  const registrationResponse = await response.json()
  const result = { clientRegistrationState, registrationResponse };
  if (result.status == 200) {
    console.log("#1 Registration successful.")
  }
  if (response.status != 200) {
    // TODO: check for server response "User already exists"
    console.error(response.status)
    console.error(response.statusText)
  }
  return result
}

async function register_finish(username,
                               password,
                               clientRegistrationState,
                               registrationResponse) {
  console.log("register_finish called with: ")
  const { exportKey, registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password
  })
  console.log("registrationRecord: ", registrationRecord)
  console.log("username: ", username)
  const result = await fetch(URL_BASE_STR + "/register_finish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      registration_record: registrationRecord,
    })
  })
  if (result.status == 200) {
    console.log("#2 Registration successful.")
  }
  if (result.status != 200) {
    // TODO: check for server response "User already exists"
    console.error(result.status)
    console.error(result.statusText)
  }
  return exportKey
}

// REGISTER FUNCTIONS ABOVE

// async function login(username, password) {
//   const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
//     password
//   })
//   var response = await fetch(URL_BASE_STR + "/login", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Access-Control-Allow-Origin": ["http://localhost:8000/auth/login"], // ,"*"
//       "Access-Control-Allow-Credentials": false,
//     },
//     body: JSON.stringify({
//       username,
//       login_request: startLoginRequest
//     })
//   })
//   var loginResponse  = await response.json()
//   var result = { clientLoginState, loginResponse }
//   return result
// }

// async function login_finish(username, password, clientLoginState, loginResponse) {
//   console.log({
//     clientLoginState,
//     loginResponse,
//     password
//   })
//   const loginResult = opaque.client.finishLogin({
//     clientLoginState,
//     loginResponse,
//     password
//   })
//   if (!loginResult) {
//     throw new Error("Login failed.")
//   }
//   const { exportKey, finishLoginRequest, sessionKey } = loginResult
//   console.log("session key:")
//   console.log(sessionKey)
//   let loginRequest = await fetch(URL_BASE_STR + "/login_finish", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Access-Control-Allow-Origin": ["http://localhost:8000/auth/login_finish","*"],
//       "Access-Control-Allow-Credentials": false,
//     },
//     body: JSON.stringify({
//       username,
//       request_finish: finishLoginRequest
//     })
//   })
// 
//   if (loginRequest.ok) {
//     //TODO: get the RSAkey from the loginRequest
//     const userKey = loginRequest.body
//     const RSAKey = await unwrapPrivateKey(exportKey, userKey.RSAKey, userKey.salt, userKey.iv)
//     // derive AES key from session key
//     const keyMaterial = await getKeyMaterial(sessionKey)
//     const salt = crypto.getRandomValues(new Uint8Array(16))
//     const session_AES_key = await getKey(keyMaterial, salt)
//     addKey("RSAKey", RSAKey)
//     addKey("sessionAESKey", session_AES_key)
//   }
// }

// function createDB () {
//   const dbName = "SecureDB";
//   const request = indexedDB.open(dbName)
//   request.onupgradeneeded = (event) => {
//     const db = event.target.result;
//     if (!db.objectStoreNames.contains("keys")) {
//       db.createObjectStore("keys", {keyPath: "keyName"})
//     }
//     console.log("Database setup complete.")
//   }
//   request.onsuccess = (event) => {
//     const db = event.target.result;
//     console.log("DB opened successfully. ", db)
//   }
//   request.onerror = (event) => {
//     console.log("Error opening database: ", event.target.errorCode)
//   }
// }

// function addKey (keyName, keyValue) {
//   const request = indexedDB.open("SecureDB");
//   request.onsuccess = (event) => {
//     const db = event.target.result
//     const transaction = db.transaction("keys", "readwrite")
//     const objectStore = transaction.objectStore("keys")
//     const key = { keyName, keyValue }

//     const retrieveRequest = objectStore.get(keyName)
//     // this means that there is no key with this name entered yet.
//     retrieveRequest.onerror = (event) => {
//         console.error(`There was no key with the name ${keyName}. We will add one now.`)
//         // we should probably add one
//         const addRequest = objectStore.add(key)

//         addRequest.onsuccess = () => {
//         console.log("Key added: ", key)
//         }
//         addRequest.onerror = () => {
//         console.error("Error adding key: ", event.target.errorCode)
//         }
//     }
//     retrieveRequest.onsuccess = (event) => {
//         //just inform the user
//         console.error(`There is already a key named: ${keyName}.`)
//     }

//   }
//   request.onerror = (event) => {
//       console.error(`IndexedDB didn't open correctly (addKey):
//                     ${event.target.error?.message}`);
//   };
// }


onmessage = async (e) => {
    const { action, id, pw } = e.data
    var result = `Result: ${action} - ${id}`
    console.log("message received in worker.");

    if (action === "register") {
        const { clientRegistrationState, registrationResponse } = await register(id, pw)
        console.log("clientRegistrationState: ", clientRegistrationState)
        console.log("registrationResponse: ", registrationResponse)
        const exportKey = await register_finish(id, pw, clientRegistrationState, registrationResponse)
        self.postMessage("Registration successful.")
        console.log("exportKey: ", exportKey) 
    }
};

    // console.log("message received");
    // var action = e.data.action;
    // // for some actions username and password are null, I should check if they are not null somewhere
    // // var username = e.data.id;
    // // var password = e.data.pw;
    // var secret_text = e.data.secret;
    // if (action === "register") {
    //     var { clientRegistrationState, registrationResponse } = await register(username, password)
    //     register_finish(username, password, clientRegistrationState, registrationResponse)
    //     console.log("test")
    // } else if (action === "login") {
    //     createDB()
    //     try {
    //         let { clientLoginState, loginResponse } = await login(username, password)
    //         await login_finish(username, password, clientLoginState, loginResponse)
    //         await addKey("LLMkey", LLM_PUBLIC_KEY);
    //     } catch (error) {
    //         console.log(error)
    //         // console.error("The user is already logged in.")
    //     }
    // } else if (action == "logout") {
    //     console.log(this.indexedDB)
    //     console.log("logout")
    //     let result = indexedDB.deleteDatabase("SecureDB")
    //     result.onsuccess = () => {
    //         console.log("DB deleted.")
    //     }
    //     result.onerror = () => {
    //         console.error("DB not deleted.")
    //     }
    //     await fetch(URL_BASE_STR + "/logout/" + username, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             "Access-Control-Allow-Origin": ["http://localhost:8000/","*"],
    //             "Access-Control-Allow-Credentials": false,
    //         },
    //     })
    // } else {
    //     console.log("action is not defined.")
    // }
