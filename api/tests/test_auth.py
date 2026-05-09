import pytest
import opaquepy
from httpx import ASGITransport, AsyncClient
import db.main as db
from main import app

username = "kikiTest"
password = "testing"


@pytest.mark.anyio
@pytest.mark.order("first")
async def test_register_user():
    async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://localhost:8000/auth"
    ) as ac:
        register_request, client_registration_state = opaquepy.register_client(password)

        first_response = await ac.post(
            "/register",
            headers={
                "Content-Type": "application/json",
            },
            json={
                "username": username,
                "regReq": register_request
            }
        )
        assert first_response.status_code == 200
        registration_response = first_response.json()
        registration_record = opaquepy.register_client_finish(
            client_registration_state,
            password,
            registration_response
        )
        second_response = await ac.post(
            "/register_finish",
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "false",
            },
            json={
                "username": username,
                "registration_record": registration_record
            }
        )
        assert second_response.status_code == 200
        session_key = second_response.json()
        print("=====session_key======")
        print(session_key)
        # TODO check the db as well


@pytest.mark.anyio
@pytest.mark.order("second")
async def test_login_user():
    async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://localhost:8000/auth"
    ) as ac:
        (start_login_request, client_login_state) = opaquepy.login_client(password)
        first_response = await ac.post(
            "/login",
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "false",
            },
            json={
                "username": username,
                "login_request": start_login_request
            }
        )
        assert first_response.status_code == 200
        login_response: str = first_response.json()
        print("+++++++++++++++++++++")
        # TODO check if why the login_client_finish method is buggin
        login_result = opaquepy.login_client_finish(
            client_login_state,
            password,
            login_response,
        )
        assert login_result is not None
        (finish_login_request, session_key) = login_result
        second_response = await ac.post(
            "/login_finish",
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Credentials": "false",
            },
            json={
                "username": username,
                "login_request": finish_login_request
            }
        )
        assert second_response.status_code == 200
