import { useState } from "react";
import "./Form.scss";


function RegisterForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const worker = new Worker(new URL("../auth-worker.js", import.meta.url), {type: "module"});

    const handleRegister = (e) => {
        e.preventDefault();

        if (window.Worker) {
            worker.postMessage({ action: "register", id: username, pw: password })
            worker.onmessage = function (e) {
                if (e.data.printErr)
                    console.log(e.data.printErr)
                if (e.data.print)
                    console.log(e.data.print)
            };
        }
    }


    return (
        <div className="register">
            <form className="register-form">
                <h3 className="form-title">create an account</h3>
                <input className="input-field" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                <input className="input-field" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button className="submit-btn" onClick={handleRegister}>create</button>
            </form>
        </div>
    )
}

export default RegisterForm
