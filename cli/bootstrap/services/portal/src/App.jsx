import { useEffect, useState } from 'react'
import { Outlet } from "react-router-dom";
import { Provider } from 'react-redux';
import store from './store/configureStore';
import { getAuthToken, getAuthUser } from './services/storage';

function App() {
    const publicPaths = ['/portal/login', '/portal/forgotten-password', '/portal/password-reset'];
    const isPublicPath = (pathname) => publicPaths.some((publicPath) => pathname.includes(publicPath));

    const [canRender, setCanRender] = useState(() => {
        if (isPublicPath(window.location.pathname)) return true;
        return Boolean(getAuthToken() && getAuthUser());
    });

    useEffect(() => {
        if (!isPublicPath(window.location.pathname)) {
            const authToken = getAuthToken();
            const authUser = getAuthUser();

            if (!authToken || !authUser) {
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
