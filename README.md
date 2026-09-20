# lino
User interface for using open-source LLMs, with zero-access encryption.

## Install and start React app
cd app/
npm install
npm run dev

## Install Python packages
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

## Setup DB
cd api/db/
docker compose up -d
python main.py

## Start Fastapi server
cd api/
uv run fastapi dev

## Setup LLM
cd api/llm/
docker compose up
docker exec ollama ollama pull llama3.2:1B2:1B



