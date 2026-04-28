// "use strict"
import * as opaque from "@serenity-kit/opaque"

var URL_BASE_STR = "http://localhost:8000/auth"


async function register(username, password) {
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password });
  var response = await fetch(URL_BASE_STR + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ["http://localhost:8000/auth/register","*"],
      "Access-Control-Allow-Credentials": false,
    },
    body: JSON.stringify({
      username,
      regReq: registrationRequest,
    })
  })
  var registrationResponse = await response.json()
  var result = { clientRegistrationState, registrationResponse };
  return result
}

async function register_finish(username, password, clientRegistrationState, registrationResponse) {
  const { exportKey, registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password
  })
  // TODO: save exportKey locally?
  // console.log(exportKey)
  // console.log(registrationRecord)
  fetch(URL_BASE_STR + "/register_finish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ["http://localhost:8000/auth/register_finish","*"],
      "Access-Control-Allow-Credentials": false,
    },
    body: JSON.stringify({
      username,
      registration_record: registrationRecord,
    })
  })
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
  // console.log((clientLoginState, loginResponse))
  var result = { clientLoginState, loginResponse }
  return result
}

async function login_finish(username, password, clientLoginState, loginResponse) {
  const loginResult = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password
  })
  if (!loginResponse) {
    throw new Error("Login failed.")
  }
  const { finishLoginRequest, sessionKey } = loginResult
  // console.log(finishLoginRequest)
  // TODO: save sessionKey in db, as well as export key
  console.log("session key:")
  console.log(sessionKey)
  fetch(URL_BASE_STR + "/login_finish", {
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
}


onmessage = async function (e) {
  var action = e.data.action;
  var username = e.data.id;
  var password = e.data.pw;
  if (action === "register") {
    // TODO maybe create a new function for these two steps?
    var { clientRegistrationState, registrationResponse } = await register(username, password)
    register_finish(username, password, clientRegistrationState, registrationResponse)
  } else if (action === "login") {
    var { clientLoginState, loginResponse } = await login(username, password)
    // console.log("here:")
    // console.log(clientLoginState)
    // console.log(loginResponse)
    login_finish(username, password, clientLoginState, loginResponse)
  } else {
    console.log("action is not defined.")
  }
};
