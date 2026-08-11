import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../slices/authSlice";
// import { logger } from '@gnar-engine/core';

function LoginForm() {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [errors, setErrors] = useState([]);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            setErrors(["Please enter your email and password"]);
            return;
        }

        try {
            const result = await dispatch(login(formData)).unwrap(); 

            if (result.token) {
                navigate("/portal");
            } else {
                setErrors([result.message || "Login failed"]);
            }
        } catch (err) {
            console.error("Login failed:", err);
            setErrors([err.message || "Invalid credentials"]);
            return;
        }
    };

    return (
        <>
            <form className="login-form" onSubmit={(e) => handleLogin(e)}>
                <div className="form-field">
                    <input
                        type="text"
                        name="username"
                        placeholder=" "
                        className="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        id='username'
                        onFocus={() => setErrors([])}
                    />
                    <label htmlFor="username">Email</label>
                </div>

                <div className="form-field">
                    <input
                        type="password"
                        name="password"
                        placeholder=" "
                        className="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        id='password'
                        onFocus={() => setErrors([])}
                    />
                    <label htmlFor="password">Password</label>
                </div>

                {errors && errors.length > 0 &&
                    <div className="errors-cont">
                        {errors.map((error, index) => (
                            <p key={index} className="error-message contrast-text">{error}</p>
                        ))}
                    </div>
                }

                <button className="compact" type="submit">Login</button>

            </form>
            <Link
                to="/portal/forgotten-password"
                className="text-link forgotten-password brand-subtle-text"
            >
                Forgotten Password
            </Link>
        </>
    )
}

export default LoginForm;
