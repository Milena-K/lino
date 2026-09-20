from openai import OpenAI

BASE_URL = "http://localhost:8080/v1"

client = OpenAI(base_url=BASE_URL, api_key="not-needed")

response = client.chat.completions.create(
    model="local",
    messages=[{"role": "user", "content": "Explain Docker in one sentence."}],
    temperature=0.7,
)

print(response.choices[0].message.content)
