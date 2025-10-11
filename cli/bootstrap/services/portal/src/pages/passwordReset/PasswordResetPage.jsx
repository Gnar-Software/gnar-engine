import React from "react";
import LoginLayout from "../../layouts/LoginLayout";
import PasswordResetForm from "../../features/passwordReset/PasswordResetForm";

const PasswordResetPage = () => {
    return (
        <LoginLayout>

            <PasswordResetForm />

        </LoginLayout>
    );
}

export default PasswordResetPage;