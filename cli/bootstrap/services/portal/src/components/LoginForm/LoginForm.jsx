import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearAuthError } from '../../slices/authSlice';

function LoginForm() {
    const dispatch = useDispatch();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const authError = useSelector((state) => state.auth.authError);

    const clearErrors = () => {
        setLocalError('');
        dispatch(clearAuthError());
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (username === '' || password === '') {
            setLocalError('Please enter your email and password');
            return;
        }

        dispatch(login({ username, password }));
    };

    return (
        <form className="login-form" onSubmit={handleLogin}>
            <input
                type="text"
                name="username"
                placeholder="username / email"
                className="username"
                value={username}
                onChange={(e) => {
                    setUsername(e.target.value);
                    clearErrors();
                }}
            />
            <input
                type="password"
                name="password"
                placeholder="password"
                className="password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    clearErrors();
                }}
            />
            <button type="submit">Login</button>
            {(localError || authError) && <div id="login-message">{localError || authError}</div>}
            <Link to="/portal/forgotten-password" className="text-link forgotten-password">
                Forgotten Password?
            </Link>
        </form>
    );
}

export default LoginForm;
