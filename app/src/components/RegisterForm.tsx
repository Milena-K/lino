import { useState } from "react";
import { useAuthWorker } from "./useAuthWorker";
import "./Form.scss";
import { useNavigate } from "react-router";


function RegisterForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { register } = useAuthWorker();
    const navigate = useNavigate();

    const handleRegister = (event) => {
        event.preventDefault();
        register(username, password);
        navigate("/");
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