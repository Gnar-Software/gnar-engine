import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import home from '../../assets/home.svg';
import product from '../../assets/package.svg';
import activity from '../../assets/activity.svg';
import users from '../../assets/users.svg';
import settings from '../../assets/settings.svg';
import link from '../../assets/link.svg';
import wallet from '../../assets/wallet.svg';
import shoppingBag from '../../assets/shopping-bag.svg';
import contacts from '../../assets/contact.svg';
import raffle from '../../assets/raffle.svg';

const Sidebar = () => {
    const location = useLocation();
    const user = useSelector(state => state.auth.authUser);

    // Helper function to check if the link is active
    const isActive = (path) => location.pathname === path;

    return (
        <div className="sidebar">
            <Link to="/portal/" className={`menu-item ${isActive("/portal/") ? "active" : ""}`}>
                <img src={home} alt="Dashboard"/>Dashboard
            </Link>
            <Link to="/portal/products" className={`menu-item ${isActive("/portal/products") ? "active" : ""}`}>
                <img src={product} alt="Products"/>Products
            </Link>
            <Link to="/portal/orders" className={`menu-item ${isActive("/portal/orders") ? "active" : ""}`}>
                <img src={shoppingBag} alt="Order"/>Orders
            </Link>
            <Link to="/portal/subscriptions" className={`menu-item ${isActive("/portal/subscriptions") ? "active" : ""}`}>
                <img src={shoppingBag} alt="Subscriptions"/>Subscriptions
            </Link>
            <Link to="/portal/integrations" className={`menu-item ${isActive("/portal/integrations") ? "active" : ""}`}>
                <img src={link} alt="Integrations"/>Integrations
            </Link>
            <Link to="/portal/raffles" className={`menu-item ${isActive("/portal/raffles") ? "active" : ""}`}>
                <img src={raffle} alt="Raffles"/>Raffles
            </Link>
            <Link to="/portal/raffle-entries" className={`menu-item ${isActive("/portal/raffle-entries") ? "active" : ""}`}>
                <img src={raffle} alt="Raffle Entries"/>Raffle Entries
            </Link>
            <Link to="/portal/contacts" className={`menu-item ${isActive("/portal/contacts") ? "active" : ""}`}>
                <img src={contacts} alt="Contacts"/>Contacts
            </Link>
            <Link to="/portal/payments" className={`menu-item ${isActive("/portal/payments") ? "active" : ""}`}>
                <img src={wallet} alt="Payments"/>Payments
            </Link>
            <Link to="/portal/users" className={`menu-item ${isActive("/portal/users") ? "active" : ""}`}>
                <img src={users} alt="Users"/>Users
            </Link>
            <Link to="/portal/reports" className={`menu-item ${isActive("/portal/reports") ? "active" : ""}`}>
                <img src={activity} alt="Reports"/>Reports
            </Link>
            <Link to="/portal/settings" className={`menu-item ${isActive("/portal/settings") ? "active" : ""}`}>
                <img src={settings} alt="Settings"/>Settings
            </Link>
        </div>
    );
};

export default Sidebar;
