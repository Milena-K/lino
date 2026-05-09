import * as opaque from "@serenity-kit/opaque"

var URL_BASE_STR = "http://localhost:8000/auth"
var crypto_algorithm = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
}


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
  console.log("first pass")
  return result
}

async function register_finish(username, password, clientRegistrationState, registrationResponse) {
  const { registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password
  })
 await fetch(URL_BASE_STR + "/register_finish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ["http://localhost:8000/","*"],
      "Access-Control-Allow-Credentials": false,
    },
    body: JSON.stringify({
      username,
      registration_record: registrationRecord,
    })
  })





  console.log("second pass")
  // TODO: check for server response "User already exists"
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
    let cryptoKeyPair = await crypto.subtle.generateKey(
      crypto_algorithm,
      false,
      ["encrypt", "decrypt"],
    )
    let enc = new TextEncoder()
    let enc_export_key = await crypto.subtle.encrypt(crypto_algorithm, cryptoKeyPair.publicKey, enc.encode(exportKey))
    let enc_session_key = await crypto.subtle.encrypt(crypto_algorithm, cryptoKeyPair.publicKey, enc.encode(sessionKey))

    // save to IndexedDB
    addKey("masterKey", cryptoKeyPair)
    addKey("exportKey", enc_export_key)
    addKey("sessionKey", enc_session_key)
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
    }catch {
      console.error("The user is already logged in.")
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
