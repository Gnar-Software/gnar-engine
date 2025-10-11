import React, { useEffect} from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/login/Login';
import Portal from './pages/portal/Portal';
import './css/style.css';
import PasswordResetPage from './pages/passwordReset/PasswordResetPage';
import PasswordResetRequestPage from './pages/passwordResetRequest/PasswordResetRequestPage';
import client, { initialiseGnarSdk } from '@gnar-engine/js-client/src/client';
import { getAuthToken, getAuthUser } from '@gnar-engine/js-client/src/storage';
// import NotFound from './pages/notFound/NotFound';


function App() {

  const dispatch = useDispatch();

  useEffect(() => {

    // redirect to login if not logged in
    if (!window.location.pathname.includes('/login')) {
      let AuthToken = getAuthToken();
      let AuthUser = getAuthUser();
  
      if (!AuthToken || !AuthUser) {
        window.location.href = '/login';
      }
    }

  }, []);

  useEffect(() => {
      initialiseGnarSdk({
          baseApiUrl: client.defaults.baseURL,
      });
  }, []);

  return (
    <>
      {/* {authLoading ? <Loader /> : */}
        <Router>
          <Routes>
            <Route path="/login/password-reset/:token" element={<PasswordResetPage />} key="password-reset"/>
            <Route path="/login/forgotten-password" element={<PasswordResetRequestPage />} key="forgotten-password"/>
            <Route path="/login" element={<LoginPage />} key="login"/>
            <Route path="/portal/*" element={<Portal />} key="portal"/>
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </Router>
      {/* } */}
    </>
  );
}

export default App;
