# lino
User interface for using open-source LLMs, with zero-access encryption.

## Install and start React app
cd app/<br>
npm install<br>
npm run dev<br>

## Install Python packages
python -m venv venv<br>
source venv/bin/activate<br>
pip install -r requirements.txt<br>

## Setup DB
cd api/db/<br>
docker compose up -d<br>
python main.py<br>

## Start Fastapi server
cd api/<br>
uv run fastapi dev

## Setup LLM
cd api/llm/<br>
docker compose up<br>
docker exec ollama ollama pull llama3.2:1b
