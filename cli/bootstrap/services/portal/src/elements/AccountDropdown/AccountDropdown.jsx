import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../slices/authSlice';
import { useSelector, useDispatch } from 'react-redux';

import keyIcon from '../../assets/icons/key-icon-02.svg';
import UserInfo from '../../components/UserInfo/UserInfo';
import userEditIcon from '../../assets/icons/user-edit.svg';


export default function AccountDropdown({ isOpen, onClose }) {
    const [shouldRender, setShouldRender] = useState(false);
    const { authUser } = useSelector((state) => state.auth);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    // use effect to handle delayed unmount for animation
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    // Handle logout action
    const handleLogout = () => {
        dispatch(logout());
        onClose();
    }

    return (
        <>
            <div className="account-dropdown-backdrop" onClick={onClose} />

            <div className={`account-dropdown ${isOpen ? 'open' : ''}`}>
                <div className="account-dropdown-content">

                    <div className="account-dropdown-info">
                        <div className="account-avatar">
                            <UserInfo />
                        </div>
                        <div className="account-details">
                            <p className="account-name">{authUser?.username || authUser?.email}</p>
                            <p className="account-email">{authUser?.email}</p>
                        </div>
                    </div>
                    <div className='menu-divider'></div>

                    <div className="account-dropdown-menu">
                        <div
                            className="menu-item"
                            onClick={() => { navigate('/portal/account'); onClose(); }}
                        >
                            <img
                                className='small-icon'
                                src={userEditIcon}
                                alt="My Account"
                            />
                            My Account
                        </div>

                        <div className="menu-item" onClick={handleLogout}>
                            <img
                                className='small-icon'
                                src={keyIcon}
                                alt="Log Out"
                            />
                            Log Out
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
