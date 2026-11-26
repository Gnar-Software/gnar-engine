import { useSearchParams } from "react-router-dom";
import LoginForm from "../../components/LoginForm/LoginForm";
import gnarEngineLogo from '../../assets/gnar-engine-white-logo.svg';

function LoginPage() {

    const [searchParams] = useSearchParams();

    return (
        <div className="login-page flex-row">
            <div className="login-left-panel">
                <img src={gnarEngineLogo} className="logo" alt="Gnar Engine" />
            </div>
            <div className="login-right-panel">
                <div>
                    <h1>Admin Login</h1>
                    <LoginForm returnTo={searchParams.get('returnTo')} />
                </div>
            </div>
        </div>
    )
}

export default LoginPage;
