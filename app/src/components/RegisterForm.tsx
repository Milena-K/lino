import { useState, useEffect, useRef } from "react";
import { useAuthWorker } from "./useAuthWorker";
import "./Form.scss";


function RegisterForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { register } = useAuthWorker();

    const handleRegister = (e) => {
        e.preventDefault();
        register(username, password);
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