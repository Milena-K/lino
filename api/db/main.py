#!/usr/bin/env python3
import psycopg
import os
import asyncio
import logging
from dotenv import load_dotenv
from pydantic import ValidationError
from .db_types import ChatJSON, User

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')

async def delete_all_tables():
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    delete_all_query = """
    DROP TABLE IF EXISTS users, login_records, credential_secrets, chats CASCADE
    """
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(delete_all_query)
            logging.info("Deleted all tables.")

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
            logging.info("USERS Table created.")

async def create_credential_secrets_table():
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    cred_sec_query = '''
    create table if not exists credential_secrets (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        credential_secret TEXT NOT NULL,
        login_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_login
            FOREIGN KEY (user_name)
            REFERENCES users(user_name)
            ON DELETE CASCADE
    )
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(cred_sec_query)
            logging.info("CREDENTIAL_SECRETS table created.")

async def create_login_records_table():
    """ creates login records table.
        stores the session key
    """
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    create_login_table = '''
    create table if not exists login_records (
        login_id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        login_record TEXT NOT NULL,
        login_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_login
            FOREIGN KEY (user_name)
            REFERENCES users(user_name)
            ON DELETE CASCADE
    )
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(create_login_table)
            logging.info("LOGIN_RECORDS table created.")


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
            ON DELETE CASCADE
    )
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(create_chats_table)
            logging.info("CHATS Table created.")


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
            logging.info(f"User inserted with ID: {result}")

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
            logging.info("User updated the password.")

async def get_user(user_name: str) -> User | None:
    """Return user record"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    get_user_query = '''
    SELECT user_id, user_name, registration_record
    FROM users
    WHERE user_name = %s
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            users = await curr.execute(get_user_query, (user_name,))
            result = await users.fetchone()
            if result:
                logging.info(f"The user {user_name} has an ID {result}")
                return User(
                    user_id=result[0],
                    user_name=result[1],
                    registration_record=result[2]
                )
            else:
                logging.info(f"The user {user_name} does not exist.")
                return None

async def delete_user(username: str):
    """Delete user record"""
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    delete_query = '''DELETE FROM users WHERE user_name = %s'''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(delete_query, (username,))
            logging.info(f"User with username {username} has been deleted.")

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
                    logging.info(f"Chat inserted with ID: {result}")
    except ValidationError as e:
        logging.error(e.errors())

async def get_chat_by_id(user_id: int, chat_id: int) -> ChatJSON | None:
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
                return result[0]
            else:
                logging.error(f"There is no such chat for user ID {user_id}")
                return None


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
                if not result:
                    logging.error(f"This chat ID {chat_id} does not belong to user ID {user_id}")
    except ValidationError as e:
        logging.error(e.errors())

async def delete_chat(user_id: int, chat_id: int):
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    delete_query = '''
    DELETE FROM chats
    WHERE user_id = %s and chat_id = %s
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(delete_query, (user_id, chat_id))
            logging.info(f"Chat with id {chat_id} has been deleted.")


###
### CRUD LOGIN RECORDS
###
async def create_login_record(user_name: str, login_record: str, login_time: str):
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    insert_query = '''
    INSERT INTO login_records (user_name, login_record, login_time)
    VALUES (%s, %s, %s)
    RETURNING user_name, login_record, login_time;
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            records = await curr.execute(insert_query, (user_name, login_record, login_time))
            await records.fetchone()
            logging.info("Login record inserted.")

async def get_login_record(user_name: str) -> str | None:
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    select_query = '''
    select login_record
    from login_records
    where user_name = %s
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            records = await curr.execute(select_query, (user_name,))
            result = await records.fetchone()
            if result:
                return result[0]
            return None

async def delete_login_record(user_name: str):
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    delete_query = """
    DELETE FROM login_records
    WHERE user_name = %s
    """
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(delete_query, (user_name,))

###
### CR CREDENTIAL SECRETS
###
async def create_credential_secret(user_name: str, cred_sec: str, login_time: str):
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    insert_query = '''
    INSERT INTO credential_secrets (user_name, credential_secret, login_time)
    VALUES (%s, %s, %s)
    RETURNING user_name, credential_secret, login_time;
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            secrets = await curr.execute(insert_query, (user_name, cred_sec, login_time))
            result = await secrets.fetchone()
            if result:
                logging.info("Credential secret inserted")

async def get_credential_secret(user_name: str) -> str | None:

    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    select_query = '''
    select credential_secret
    from credential_secrets
    where user_name = %s
    order by id desc;
    '''
    async with aconn:
        async with aconn.cursor() as curr:
            records = await curr.execute(select_query, (user_name,))
            result = await records.fetchone()
            if result:
                return result[0]
            return None

async def delete_credential_secret(user_name: str):
    aconn = await psycopg.AsyncConnection.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)
    delete_query = """
    DELETE FROM credential_secrets
    WHERE user_name = %s
    """
    async with aconn:
        async with aconn.cursor() as curr:
            await curr.execute(delete_query, (user_name,))


if __name__ == "__main__":
    asyncio.run(delete_all_tables())
    asyncio.run(create_users_table())
    asyncio.run(create_login_records_table())
    asyncio.run(create_chats_table())
    asyncio.run(create_credential_secrets_table())
    # asyncio.run(create_user("milena", "test"))
    # chat = '{"model": "llama3.2:1B", "messages": [{"role": "user", "content":"What are peaches?"}, {"role": "assistant", "content":"Oranges are a fruit."}]}'
    # asyncio.run(create_login_record(2, "anatha one", str(datetime.now())))
    # asyncio.run(get_login_record(2))
