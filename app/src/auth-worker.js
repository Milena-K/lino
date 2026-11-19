import * as opaque from "@serenity-kit/opaque";
import { deleteIDB, createUser } from "./indexedDB-lib.js"
import { base64UrlToBytes, deriveAesKeyFromExportKey } from "./crypto-lib.js"
// var URL_BASE_STR = "http://localhost:8000/auth"
var URL_BASE_STR = "https://spidery-spooky-wraith-x9pj6r4q9q9fx9-8000.app.github.dev/auth"

async function register(username, password) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  const response = await fetch(URL_BASE_STR + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
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
    await storeAes(username, exportKey)
  }
  if (result.status != 200) {
    // TODO: check for server response "User already exists"
    console.error(result.status)
    console.error(result.statusText)
  }
}

// REGISTER FUNCTIONS ABOVE

async function login(username, password) {
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password
  })
  console.log("clientLoginState: ", clientLoginState)
  console.log("startLoginRequest: ", startLoginRequest)
  var response = await fetch(URL_BASE_STR + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
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
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      request_finish: finishLoginRequest
    })
  })

  await storeAes(username, exportKey)
  if (loginRequest.ok) {
    await storeAes(username, exportKey)
  }
}

async function storeAes(username, exportKey) {  
    // convert exportKey to AES key
    const rawBytes = await base64UrlToBytes(exportKey)
    const aesKey = await deriveAesKeyFromExportKey(rawBytes)
    // store AES key in IndexedDB
    void createUser(username, aesKey)
}

async function logout(username) {
  await deleteIDB()
  // TODO add safety check so that it checks if the user has permissions for this action.
  await fetch(URL_BASE_STR + "/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username
    })
  })
}

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
    console.log("message received in worker. xd", result);

    if (action === "register") {
        const { clientRegistrationState, registrationResponse } = await register(id, pw)
        console.log("clientRegistrationState: ", clientRegistrationState)
        console.log("registrationResponse: ", registrationResponse)
        await register_finish(id, pw, clientRegistrationState, registrationResponse)
        self.postMessage("Registration successful.")
    } else if (action === "login") {
        try {
            const { clientLoginState, loginResponse } = await login(id, pw)
            await login_finish(id, pw, clientLoginState, loginResponse)
            self.postMessage("Login successful.")
        } catch (error) {
            console.error("Error during login: ", error)
            self.postMessage("Login failed.")
        }
    } else if (action == "logout") {
      await logout(id)
    } else {
        console.log("action is not defined.")
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
