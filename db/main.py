#!/usr/bin/env python3
import psycopg2
import os
import bcrypt
from dotenv import load_dotenv
from pydantic import ValidationError

from db_types import ChatJSON

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')

conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)

cursor = conn.cursor()


def create_users_table_fn():
    # create USERS table
    create_users_table = '''
    create table if not exists users (
        user_id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt VARCHAR(70)
    )
    '''
    cursor.execute(create_users_table)
    conn.commit()
    print("USERS Table created.")

def create_chats_table_fn():
    # create CHATS table
    create_chats_table = '''
    create table if not exists chats (
        chat_id SERIAL PRIMARY KEY,
        user_id INTEGER,
        title VARCHAR(200),
        messages JSONB,
        CONSTRAINT fk_chat_user
            FOREIGN KEY (user_id)
            REFERENCES users(user_id)
    )
    '''
    cursor.execute(create_chats_table)
    conn.commit()
    print("CHATS Table created.")

# USERS CRUD operations
def insert_user(user_name: str, password: str):
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode("utf-8"), salt)

    insert_query = '''
    INSERT INTO users (user_name, password_hash, salt)
    VALUES (%s, %s, %s)
    RETURNING user_id;
    '''
    cursor.execute(insert_query, (user_name, password_hash, salt))
    conn.commit()
    result = cursor.fetchone()
    if result:
        print(f"User inserted with ID: {result[0]}")

# insert_user("milena", "pass")

def update_user(user_id: int, password: str):
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode("utf-8"), salt)

    update_query = '''
    UPDATE users
    SET password_hash = %s,
        salt = %s
    WHERE user_id = %s
    '''
    cursor.execute(update_query, (password_hash, salt, user_id))
    conn.commit()
    print(f"User updated pass hash: {password_hash}")

# update_user(1, "pass")
def delete_user_id(user_id: int):
    delete_query = '''
    DELETE FROM users
    WHERE user_id = %s
    '''
    cursor.execute(delete_query, (user_id,))
    conn.commit()
    print(f"User with id {user_id} has been deleted.")

def get_user_id(user_name: str):
    cursor.execute('''
    SELECT * FROM users
    WHERE user_name = %s
    ''', (user_name,))
    conn.commit()
    result = cursor.fetchone()
    if result:
        print(f"The user {user_name} has an ID {result[0]}")
    else:
        print(f"The user {user_name} does not exist.")


def create_chat(user_id: int, title: str, messages_json: str):
    try:
         ChatJSON.model_validate_json(messages_json)
    except ValidationError as e:
        print(e.errors())

    insert_query = '''
    INSERT INTO chats (user_id, title, messages)
    VALUES (%s, %s, %s)
    RETURNING user_id, title, messages;
    '''
    cursor.execute(insert_query, (user_id, title, messages_json))
    conn.commit()
    result = cursor.fetchone()
    if result:
        print(f"Chat inserted with ID: {result}")

def get_chat(user_id: int, chat_id: int):
    # checking only chat_id is sufficient, however I want to add a security check
    # Q: Did this user create the chat?
    cursor.execute('''
    SELECT title, messages FROM chats
    WHERE user_id = %s and chat_id = %s
    ''', (user_id, chat_id))
    conn.commit()
    result = cursor.fetchone()
    if result:
        print(result)
    else:
        print(f"There is no such chat for user ID {user_id}")

def update_chat(user_id: int, chat_id: int, messages_json: str):
    try:
        ChatJSON.model_validate_json(messages_json)
    except ValidationError as e:
        print(e.errors())

    cursor.execute('''
    UPDATE chats
    SET messages = %s
    WHERE chat_id = %s and user_id = %s
    RETURNING messages
    ''', (messages_json, chat_id, user_id))
    conn.commit()
    result = cursor.fetchone()
    if result:
        print(f"The messages are updated: {result}")
    else:
        print(f"This conversation does not belong to user ID {user_id}")


def delete_chat(user_id: int, chat_id: int):
    delete_query = '''
    DELETE FROM chats
    WHERE user_id = %s and chat_id = %s
    '''
    cursor.execute(delete_query, (user_id, chat_id))
    conn.commit()
    print(f"Chat with id {chat_id} has been deleted.")


######### TESTING ###########

# drop_users_table = 'DROP TABLE users CASCADE'
# drop_chats_table = 'DROP TABLE chats'
# cursor.execute(drop_users_table)
# cursor.execute(drop_chats_table)
# conn.commit()

# create_users_table_fn()
# create_chats_table_fn()

# delete_user_id(2)
# insert_user("daisy", "bebe")
# get_user_id("daisy")

chat = '''{
  "model": "mistral",
  "messages": [
    {"role": "system", "content": "You are helpful."},
    {"role": "user", "content": "Explain RAG."},
    {"role": "system", "content": "No, google it."}
  ],
  "stream": false
}'''

# create_chat(1, "first chat", chat)
# get_chat(1, 1)
# update_chat(1, 1, chat)
delete_chat(1, 1)
