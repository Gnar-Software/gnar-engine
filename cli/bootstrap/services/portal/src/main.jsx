import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/style.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AuthGuard from './routeGuards/AuthGuard.jsx'
import LoginPage from './pages/LoginPage/LoginPage.jsx'
import PortalLayout from './layouts/PortalLayout/PortalLayout.jsx'
import DashboardPage from './pages/DashboardPage/DashboardPage.jsx'
import UsersPage from './pages/UsersPage/UsersPage.jsx'
import UserSinglePage from './pages/UserSinglePage/UserSinglePage.jsx'
import PagesPage from './pages/PagesPage/PagesPage.jsx'
import PageSinglePage from './pages/PageSinglePage/PageSinglePage.jsx'
import BlocksPage from './pages/BlocksPage/BlocksPage.jsx'
import BlockSinglePage from './pages/BlockSinglePage/BlockSinglePage.jsx'
import AgentPage from './pages/AgentPage/AgentPage.jsx'

const router = createBrowserRouter([
    {
        path: "portal",
        element: <App />,
        children: [
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                element: <AuthGuard />,
                children: [
                    {
                        path: "",
                        element: <PortalLayout />,
                        children: [
                            { index: true, element: <DashboardPage /> },
                            { path: "dashboard", element: <DashboardPage /> },

                            // Users
                            { path: "users", element: <UsersPage /> },
                            { path: "users/:id", element: <UserSinglePage /> },

                            // CMS / Pages
                            { path: "pages", element: <PagesPage /> },
                            { path: "pages/:id", element: <PageSinglePage /> },
                            { path: "blocks", element: <BlocksPage /> },
                            { path: "blocks/:id", element: <BlockSinglePage /> }
                             
                            // Agent
                            { path: "agent", element: <AgentPage /> }
                        ]
                    }
                ]
            }
        ]
    }
]);

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
)
