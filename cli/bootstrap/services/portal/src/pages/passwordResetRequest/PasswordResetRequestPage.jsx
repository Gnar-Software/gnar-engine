import React from "react";
import LoginLayout from "../../layouts/LoginLayout";
import PasswordResetRequestForm from "../../features/passwordReset/PasswordResetRequestForm";

const PasswordResetRequestPage = () => {
    return (
        <LoginLayout>

            <PasswordResetRequestForm />

        </LoginLayout>
    );
}

export default PasswordResetRequestPage;