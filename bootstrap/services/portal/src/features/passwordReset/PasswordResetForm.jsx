import React, { useState } from "react"
import gnarEngine from "@gnar-engine/js-client";
import { Link } from "react-router-dom";

const PasswordResetForm = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const handlePasswordResetSubmit = async (e) => {

        e.preventDefault();
        setLoading(true);

        // get token from url
        const path = window.location.pathname;
        const token = path.split('/').pop();

        if (email === "") {
            setMessage("Please enter your email address");
            return;
        }

        if (token === "") {
            setMessage("Invalid password reset link");
            return;
        }

        if (password === "") {
            setMessage("Please enter a new password");
            return;
        }

        if (confirmPassword === "" || password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        (async () => {
            try {
                console.log('Resetting password for email:', email, 'with token:', token);
                // change password
                await gnarEngine.user.changePassword({email, token , password});
                await gnarEngine.user.authenticate(email, password);

                setMessage('');
                setSuccess(true);
            } catch (error) {
                if (error.response.data.message) {
                    setMessage("Error resetting password: " + error.response.data.message);
                    console.error('Error resetting password:', error);
                } else if (error.response.data) {
                    setMessage("Error resetting password: " + error.response.data);
                    console.error('Error resetting password:', error);
                }
            } finally {
                setLoading(false);
            }
        })();
    }

    return (
        <div className="login">
            <h2>Password reset</h2>

            <form className="login-form" onSubmit={handlePasswordResetSubmit}>
                <input type="email" placeholder="Email address" className="email-input-icon" value={email} onChange={(e) => { setEmail(e.target.value); setMessage(''); }}/>
                <input type="password" placeholder="Enter new password" className="password-input-icon" value={password} onChange={(e) => { setPassword(e.target.value); setMessage(''); }}/>
                <input type="password" placeholder="Confirm new password" className="password-input-icon" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setMessage(''); }}/>
                <div class="password-requirements">
                    <p>To ensure the security of your account, your new password must meet the following criteria:</p>
                    <ul>
                        <li><strong>Minimum Length</strong>: Your password must be at least <strong>8 characters</strong> long.</li>
                        <li><strong>Uppercase Letters</strong>: Include at least <strong>one uppercase letter</strong> (A-Z).</li>
                        <li><strong>Lowercase Letters</strong>: Include at least <strong>one lowercase letter</strong> (a-z).</li>
                        <li><strong>Numbers</strong>: Include at least <strong>one number</strong> (0-9).</li>
                        <li><strong>Special Characters</strong>: Include at least <strong>one special character</strong> from the following: <strong>@, $, !, %, *, ?, &</strong>.</li>
                    </ul>
                    <p>Please ensure your password meets all of these requirements before submitting.</p>
                </div>
                <button type="submit" disabled={loading}>Update password</button>
                <span id="login-message">{message}</span>

                {success && 
                    <span id="login-message">Password reset successful. <Link to="/login">Click here to login</Link></span>
                }
            </form>
        </div>
    );
}

export default PasswordResetForm;