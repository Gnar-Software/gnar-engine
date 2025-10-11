import React from "react";

function LoginLayout({children}) {

    return (
        <div className="login-layout">
            <div className="left-cont">
                <img src={require('../assets/Logo_Anchord_White_Green.svg').default} alt="Anchord Logo" />
            </div>
            <div className="right-cont">
                {children}
            </div>
        </div>
    );
}

export default LoginLayout;