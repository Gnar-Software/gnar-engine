import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from '../../slices/authSlice';
import userIcon from '../../assets/user.svg';


const User = () => {

    const user = useSelector(state => state.auth.authUser);
    const authState = useSelector(state => state.auth);
    const dispatch = useDispatch();
    const [userInitials, setUserInitials] = useState('?');

    useEffect(() => {
        if (user?.name) {
            const initials = user.name.split(' ').map(name => name.charAt(0)).join('');
            setUserInitials(initials);
        }
    }, [user]);

    const handleLogout = () => {
        dispatch(logout());
    };

    useEffect(() => {

        console.log('Redux auth state:', authState);

    }, [user]);
    
    

    return (
        <div className="user-avatar-container">
            <div className="user-info">
                <div className="userAvatar">
                    <span><img src={userIcon} alt="user icon" /></span>
                </div>

                {user && user.username && (
                    <div className="userName">
                        <span>{user.username}</span>
                    </div>
                )}

                {user && (
                    <a onClick={handleLogout} className="log-out">Log out</a>
                )}
            </div>
        </div>
    );
}

export default User;