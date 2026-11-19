import { useState } from "react";
import "./Form.scss";
import { useAuthWorker } from "./useAuthWorker";
import { useNavigate } from "react-router";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { login, logout } = useAuthWorker();
    const navigate = useNavigate();


    const handleLogin = (e) => {
        e.preventDefault()
        login(username, password)
        navigate("/")
    }

    const handleLogOut = (e) => {
        e.preventDefault()
        logout(username)
        // navigate("/login")
    }

    return (
        <div className="login">
            <form className="login-form">
                <h3 className="form-title">Log in</h3>
                <input className="input-field" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input className="input-field" type="text" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button className="submit-btn" onClick={handleLogin}>Log in</button>
                <button className="submit-btn" onClick={handleLogOut}>Log out</button>
            </form>
        </div>
    )
}

export default LoginForm
