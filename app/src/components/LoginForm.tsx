import { useState } from "react";
import "./Form.scss";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const worker = new Worker(new URL("../auth-worker.js", import.meta.url), {type: "module"});

    const handleLogin = (e) => {
        e.preventDefault()
        if (window.Worker) {
            worker.postMessage({ action: "login", id: username, pw: password })
            worker.onmessage = function (e) {
                if (e.data.printErr)
                    console.log(e.data.printErr)
                if (e.data.print)
                    console.log(e.data.print)
            };
        }
    }

    const handleLogOut = (e) => {
        e.preventDefault()
        if (window.Worker) {
            worker.postMessage({ action: "logout", id: username })
            worker.onmessage = function (e) {
                if (e.data.printErr)
                    console.log(e.data.printErr)
                if (e.data.print)
                    console.log(e.data.print)
            };
        }
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
