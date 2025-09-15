import React, { useState } from "react"
import gnarEngine from "@gnar-engine/js-client";


const PasswordResetForm = () => {

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(null);
    
    const handleRequestSubmit = async (e) => {

        e.preventDefault();

        setLoading('loading');

        if (email === "") {
            setMessage("Please enter your email address")

            setLoading('error');
            setTimeout(() => {
                setLoading(null);
            }, 3000);
            return;
        }

        (async () => {
            try {
                // reset password
                await gnarEngine.sendPasswordReset({email});

                setSuccess(true);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);

            } catch (error) {
                if (error.response.data.message) {
                    setMessage("Error requesting password reset: " + error.response.data.message);
                    console.error('Error requesting password reset:', error);
                } else if (error.response.data) {
                    setMessage("Error requesting password reset: " + error.response.data);
                    console.error('Error requesting password reset:', error);
                }

                setLoading('error');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);
            }
        })();
    }

    return (
        <div className="login">
            <h2>Password reset</h2>

            <form className="login-form" onSubmit={handleRequestSubmit}>
                <input type="email" placeholder="Email address" className="email-input-icon" value={email} onChange={(e) => { setEmail(e.target.value); setMessage(''); }}/>
                <button className={loading} type="submit">Reset password</button>
                <span id="login-message">{message}</span>

                {success && 
                    <span id="login-message">A reset password link will be emailed to this email if it exists as a user.</span>
                }
            </form>
        </div>
    );
}

export default PasswordResetForm;