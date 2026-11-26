import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../slices/authSlice";

function LoginForm({ returnTo }) {

    const dispatch = useDispatch();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginMessage, setLoginMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        if (username === "" || password === "") {
            setLoginMessage("Please enter your email and password");
            return;
        }
        try {
            dispatch(login({username, password, returnTo}));
        } catch (error) {
            setLoginMessage("Error logging in: " + error.response?.data?.message || "Unknown error");
            console.error('Error logging in:', error);
        }
    }

    return (
        <form className="login-form" onSubmit={handleLogin}>
            <input
                type="text"
                name="username"
                placeholder="username / email"
                className="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                name="password"
                placeholder="password"
                className="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
            {loginMessage && <div className="login-message">{loginMessage}</div>}
            <Link
                to="/portal/forgotten-password"
                className="text-link forgotten-password"
            >
                Forgotten Password?
            </Link>
        </form>
    )
}

export default LoginForm;
