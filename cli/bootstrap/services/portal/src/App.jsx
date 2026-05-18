import { useEffect, useState } from 'react'
import { Outlet } from "react-router-dom";
import { Provider } from 'react-redux';
import store from './store/configureStore';
import { getAuthToken, getAuthUser } from './services/storage';


function App() {
    const [canRender, setCanRender] = useState(() => {
        if (window.location.pathname.includes('/portal/login')) return true;
        // Block protected content before effects/API calls can run.
        return Boolean(getAuthToken() && getAuthUser());
    });

    useEffect(() => {
        // redirect to login if not logged in
        if (!window.location.pathname.includes('/portal/login')) {
            let AuthToken = getAuthToken();
            let AuthUser = getAuthUser();

            if (!AuthToken || !AuthUser) {
                setCanRender(false);
                window.location.href = '/portal/login';
                return;
            }
        }

        setCanRender(true);
    }, []);

    if (!canRender) return null;

    return  (
        <>
            <Provider store={store}>
                <Outlet />
            </Provider>
        </>
    )
}

export default App
