import React, {useState, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import { login } from "../../slices/authSlice";
import { Link } from "react-router-dom";

const LoginForm = () => {

    const saltRounds = 12;
    const dispatch = useDispatch();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginMessage, setLoginMessage] = useState("");
    const {authError} = useSelector(state => state.auth);
    
    const handleLogin = async (e) => {
        e.preventDefault();

        if (username === "" || password === "") {
            setLoginMessage("Please enter your email and password");
            return;
        }
        try {
            dispatch(login({username, password}));

        } catch (error) {
            setLoginMessage("Error logging in: " + error.response?.data?.message || "Unknown error");
            console.error('Error logging in:', error);
        }
    }

    useEffect(() => {
        if (authError) {
            setLoginMessage(authError);
        }
    }, [authError])

    return (
        <div className="login">
            <form className="login-form" onSubmit={handleLogin}>
                <div className="input-container">
                    <input type="text" placeholder="Email address / Username" className="email-input-icon" value={username} onChange={(e) => { setUsername(e.target.value); setLoginMessage(''); }} />
                </div>
                <div className="input-container">
                    <input type="password" placeholder="Password" className="password-input-icon" value={password} onChange={(e) => { setPassword(e.target.value); setLoginMessage(''); }}/>
                </div>
                <div>
                    <button type="submit">Sign in</button>
                    <Link to="/login/forgotten-password">password reset</Link>
                </div>
                <span id="login-message">{loginMessage}</span>
            </form>
        </div>
    );
}

export default LoginForm;