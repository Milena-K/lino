export function toBase64(u8){
    let binary = ""
    const chunk = 0x8000
    for (let i = 0; i < u8.length; i += chunk ) {
        binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunk))
    }
    return btoa(binary)
}

export async function getAssistantResponse (data) {
  console.log(data)
  let body = JSON.stringify ({
    enc_messages: toBase64(data.enc_messages),
    enc_aes: data.enc_aes
  })
  const URL_BASE_STR = "http://localhost:8000/chat/llm"
  const response = await fetch(URL_BASE_STR, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  return response.body.getReader()
}
