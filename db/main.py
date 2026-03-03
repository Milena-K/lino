#!/usr/bin/env python3
import psycopg2
import os
import bcrypt
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')

conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS)

cursor = conn.cursor()

# drop tables
# drop_users_table = 'DROP TABLE users CASCADE'
# drop_chats_table = 'DROP TABLE chats'
# cursor.execute(drop_users_table)
# cursor.execute(drop_chats_table)
# conn.commit()

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

# delete_user_id(2)
# insert_user("daisy", "bebe")
# get_user_id("daisy")
