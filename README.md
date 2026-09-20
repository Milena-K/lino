# lino
User interface for using open-source LLMs, with zero-access encryption.

## Install and start React app
cd app/
npm install
npm run dev

## Setup DB
### create python virtual env
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd api/db/
docker compose up -d
python main.py
