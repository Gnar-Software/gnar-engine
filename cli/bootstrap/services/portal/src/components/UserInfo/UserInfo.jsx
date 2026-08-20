import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getGravatarUrl } from "../../services/gravatar";
import AccountDropdown from "../../elements/AccountDropdown/AccountDropdown.jsx";

function UserInfo() {

    const { authUser } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [gravatarUrl, setGravatarUrl] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        if (authUser && authUser.email) {
            const gravatar = getGravatarUrl(authUser.email, { size: 100 });
            setGravatarUrl(gravatar);
            setLoading(false);
        }
    }, [authUser])

    const handleDropdownToggle = () => {
        setDropdownOpen(prev => !prev);
    };

    return (
        <>
            <AccountDropdown
                isOpen={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
            />

            <div className="user-info" onClick={handleDropdownToggle}>
                {authUser && !loading && (
                    <div className="user-info-mini flex-row">
                        {gravatarUrl && (
                            <img src={gravatarUrl} alt="User Gravatar" className="gravatar-image" />
                        )}
                        <span className="email">{authUser.email}</span>
                    </div>
                )}
            </div>
        </>
    )
}

export default UserInfo;
