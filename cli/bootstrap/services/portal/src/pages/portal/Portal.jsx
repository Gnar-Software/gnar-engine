import React from "react";
import { Routes, Route, Outlet } from 'react-router-dom';
import PortalLayout from "../../layouts/PortalLayout";
import Dashboard from "../dashboard/Dashboard";
import Products from "../products/Products";
import Reports from "../reports/Reports";
import Orders from "../orders/Orders";
import Integrations from "../integrations/Integrations";
import Contacts from "../contacts/Contacts";
import Payments from "../payments/Payments";
import Settings from "../settings/Settings";
import Users from "../users/Users";
import Subscriptions from "../subscriptions/Subscriptions";
import RaffleEntries from "../raffleEntries/RaffleEntries";
import Raffles from "../raffles/Raffles";


const Portal = () => {

    return (
        <PortalLayout>
            
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/raffles" element={<Raffles />} />
                <Route path="/raffle-entries" element={<RaffleEntries />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/users" element={<Users />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>

            <Outlet />
        </PortalLayout>
    );
}

export default Portal;