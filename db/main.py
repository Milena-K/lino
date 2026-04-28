#!/usr/bin/env python3
import psycopg
import os
import bcrypt
import asyncio
from dotenv import load_dotenv
from pydantic import ValidationError
from datetime import datetime

from db_types import ChatJSON

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')

async def delete_all_tables():
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    delete_all_query = """
    DROP TABLE IF EXISTS users, login_records, chats
    """
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(delete_all_query)
            print("Deleted all tables.")

### USERS CRUD

async def create_users_table():
    """create USERS table"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    create_users_table = '''
    create table if not exists users (
        user_id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) UNIQUE NOT NULL,
        registration_record TEXT NOT NULL
    )
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(create_users_table)
            print("USERS Table created.")

async def create_login_records_table():
    """create login records table"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    create_login_table = '''
    create table if not exists login_records (
        login_id SERIAL PRIMARY KEY,
        user_id INTEGER,
        login_record TEXT NOT NULL,
        login_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_login
            FOREIGN KEY (user_id)
            REFERENCES users(user_id)
    )
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(create_login_table)
            print("LOGIN_RECORDS table created.")


async def create_chats_table():
    """create CHATS table"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
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
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(create_chats_table)
            print("CHATS Table created.")


# USERS CRUD operations

async def create_user(user_name: str, registration_record: str):
    """Insert user record"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    insert_query = '''
    INSERT INTO users (user_name, registration_record)
    VALUES (%s, %s)
    RETURNING user_id;
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            insert = await curr.execute(insert_query, (user_name, registration_record))
            result = await insert.fetchone()
            print(f"User inserted with ID: {result}")

async def update_user(user_id: int, registration_record: str):
    """Update user record"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    update_query = '''
    UPDATE users
    SET registration_record = %s
    WHERE user_id = %s
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(update_query, (registration_record, user_id))
            print("User updated the password.")

async def get_user_id(user_name: str):
    """Return user record"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    get_user_query = ''' SELECT * FROM users WHERE user_name = %s '''

    async with aconn:
        async with aconn.cursor() as curr:
            users = await curr.execute(get_user_query, (user_name,))
            result = await users.fetchone()
            if result:
                print(f"The user {user_name} has an ID {result[0]}")
            else:
                print(f"The user {user_name} does not exist.")

async def delete_user_id(user_id: int):
    """Delete user record"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    delete_query = '''
    DELETE FROM users
    WHERE user_id = %s
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(delete_query, (user_id,))
            print(f"User with id {user_id} has been deleted.")

### CHATS CRUD

async def create_chat(user_id: int, title: str, chat: str):
    """Create chat record"""
    try:
        ChatJSON.model_validate_json(chat)
        aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
        insert_query = '''
        INSERT INTO chats (user_id, title, messages)
        VALUES (%s, %s, %s)
        RETURNING user_id, title, messages;
        '''
        async with aconn:
            async with aconn.cursor() as curr:
                chats = await curr.execute(insert_query, (user_id, title, chat))
                result = await chats.fetchone()
                if result:
                    print(f"Chat inserted with ID: {result}")
    except ValidationError as e:
        print(e.errors())

async def get_chat_by_id(user_id: int, chat_id: int):
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    # TODO: checking only chat_id is sufficient, however I want to add a security check
    # Q: Did this user create the chat?
    chat_query = '''
    SELECT title, messages FROM chats
    WHERE user_id = %s and chat_id = %s
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            chats = await curr.execute(chat_query, (user_id, chat_id))
            result = await chats.fetchone()
            if result:
                print(result)
            else:
                print(f"There is no such chat for user ID {user_id}")


async def update_chat(user_id: int, chat_id: int, messages_json: str):
    try:
        ChatJSON.model_validate_json(messages_json)
        aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
        update_query = '''
        UPDATE chats
        SET messages = %s
        WHERE chat_id = %s and user_id = %s
        RETURNING messages
        '''
        async with aconn:
            async with aconn.cursor() as curr:
                chats = await curr.execute(update_query, (messages_json, chat_id, user_id))
                result = await chats.fetchone()
                if result:
                    print(f"The messages are updated: {result}")
                else:
                    print(f"This conversation does not belong to user ID {user_id}")
    except ValidationError as e:
        print(e.errors())

async def delete_chat(user_id: int, chat_id: int):
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    delete_query = '''
    DELETE FROM chats
    WHERE user_id = %s and chat_id = %s
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(delete_query, (user_id, chat_id))
            print(f"Chat with id {chat_id} has been deleted.")


# CRUD LOGIN RECORDS
async def create_login_record(user_id: int, login_record: str, login_time: str):
    # TODO check if date is in correct form
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    insert_query = '''
    INSERT INTO login_records (user_id, login_record, login_time)
    VALUES (%s, %s, %s)
    RETURNING user_id, login_record, login_time;
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            chats = await curr.execute(insert_query, (user_id, login_record, login_time))
            result = await chats.fetchone()
            if result:
                print(f"Chat inserted with ID: {result}")

# TODO write get login record (sort by timestamp or id and get last)

if __name__ == "__main__":
    # asyncio.run(create_user("milena", "test"))
    # chat = '{"model": "llama3.2:1B", "messages": [{"role": "user", "content":"What are peaches?"}, {"role": "assistant", "content":"Oranges are a fruit."}]}'
    asyncio.run(create_login_record(2, "test", str(datetime.now())))

# if __name__ == "__main__":
    # asyncio.run(delete_all_tables())
    # asyncio.run(create_users_table())
    # asyncio.run(create_login_records_table())
    # asyncio.run(create_chats_table())
