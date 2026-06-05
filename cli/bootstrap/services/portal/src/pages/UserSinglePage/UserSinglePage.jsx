import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../layouts/Card/Card';
import SaveButton from '../../elements/SaveButton/SaveButton';
import TextInput from '../../elements/TextInput/TextInput';
import CustomSelect from '../../elements/CustomSelect/CustomSelect';
import { user as userService } from '../../services/user.js';
import { defaultRole, defaultRoles } from '../../data/user.data.js';

function UserSinglePage() {

    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [userId, setUserId] = useState('');
    const [roles, setRoles] = useState(defaultRoles);
    const [userDetails, setUserDetails] = useState({
        email: '',
        username: '',
        role: defaultRole,
        password: ''
    });
    const [messages, setMessages] = useState([]);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const data = await userService.getEnums();
                const roleOptions = data?.enums?.roles?.map(role => ({
                    name: role.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
                    role
                }));

                if (roleOptions?.length) {
                    setRoles(roleOptions);
                }
            } catch (error) {
                console.error('Error fetching user enums:', error);
            }
        })();
    }, []);

    useEffect(() => {
        if (!id || isNew) {
            setUserId('');
            setUserDetails({
                email: '',
                username: '',
                role: defaultRole,
                password: ''
            });
            return;
        }

        (async () => {
            setLoading(true);
            try {
                const userData = await userService.getUser({ userId: id });
                const selectedUser = userData.user || {};

                setUserId(selectedUser.id || '');
                setUserDetails({
                    email: selectedUser.email || '',
                    username: selectedUser.username || '',
                    role: defaultRoles.some(role => role.role === selectedUser.role) ? selectedUser.role : defaultRole,
                    password: ''
                });
                setErrors([]);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setErrors(['There was a problem loading this user.']);
            }
            setLoading(false);
        })();
    }, [id, isNew]);

    const setField = (field, value) => {
        setMessages([]);
        setErrors([]);
        setUserDetails({
            ...userDetails,
            [field]: value
        });
    };

    const getCreatePayload = () => {
        const payload = {
            email: userDetails.email,
            role: userDetails.role
        };

        if (userDetails.role !== 'service_admin') {
            payload.username = userDetails.username;

            if (userDetails.password) {
                payload.password = userDetails.password;
            }
        }

        return payload;
    };

    const save = async () => {
        setLoading(true);
        setMessages([]);

        try {
            if (!userId) {
                const payload = getCreatePayload();

                if (payload.password || payload.role === 'service_admin') {
                    await userService.createUser({ user: payload });
                } else {
                    await userService.createUserWithRandomPassword({ user: payload });
                }
            } else {
                await userService.update({
                    id: userId,
                    user: userDetails.role === 'service_admin'
                        ? {
                            email: userDetails.email,
                            role: userDetails.role
                        }
                        : {
                            email: userDetails.email,
                            username: userDetails.username,
                            role: userDetails.role
                        }
                });
            }

            setErrors([]);
            navigate('/portal/users');
        } catch (error) {
            console.error('Error saving user:', error);
            setErrors(['There was a problem saving this user.']);
        }

        setLoading(false);
    };

    const sendPasswordReset = async () => {
        if (!userDetails.email) {
            setErrors(['A user email is required before sending a password reset.']);
            return;
        }

        setActionLoading(true);
        setMessages([]);

        try {
            await userService.sendPasswordReset({ email: userDetails.email });
            setErrors([]);
            setMessages(['Password reset sent.']);
        } catch (error) {
            console.error('Error sending password reset:', error);
            setErrors(['There was a problem sending the password reset.']);
        }

        setActionLoading(false);
    };

    const deleteUser = async () => {
        if (!userId || !window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setActionLoading(true);
        setMessages([]);

        try {
            await userService.delete({ userId });
            setErrors([]);
            navigate('/portal/users');
        } catch (error) {
            console.error('Error deleting user:', error);
            setErrors(['There was a problem deleting this user.']);
        }

        setActionLoading(false);
    };

    return (
        <div className="single-crud-page user-single-page">
            <h1>{isNew ? 'Create User' : 'Update User'}</h1>

            <div className="flex-row top-bar user-actions-bar">
                <div className="button-group">
                    <button onClick={() => window.history.back()} className="secondary-btn">Back</button>
                    <button onClick={save} disabled={loading}>Save</button>
                </div>
            </div>

            <div className="card-columns">
                <div className="col-66">
                    <Card title="User details">
                        <div className="flex-col user-details-form">
                            <TextInput
                                label="Email"
                                placeholder="Enter email"
                                value={userDetails.email}
                                onChange={(e) => setField('email', e.target.value)}
                            />

                            <TextInput
                                label={isNew ? 'Username' : 'Username'}
                                placeholder="Enter username"
                                value={userDetails.username}
                                onChange={(e) => setField('username', e.target.value)}
                            />

                            {isNew && userDetails.role !== 'service_admin' && (
                                <div className="text-input">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={userDetails.password}
                                        onChange={(e) => setField('password', e.target.value)}
                                        placeholder="Leave blank to generate one"
                                    />
                                </div>
                            )}

                            <CustomSelect
                                label="Role"
                                placeholder="Select role"
                                name="user-role-select"
                                options={roles}
                                labelKey="name"
                                setSelectedOption={(option) => setField('role', option.role)}
                                selectedOption={roles.find(role => role.role === userDetails.role)}
                            />
                        </div>
                    </Card>
                </div>

                <div className="col-33">
                    <Card title="Actions">
                        <div className="button-stack">
                            <button
                                type="button"
                                onClick={sendPasswordReset}
                                disabled={!userId || actionLoading}
                                className="secondary-btn"
                            >
                                Send password reset
                            </button>

                            <button
                                type="button"
                                onClick={deleteUser}
                                disabled={!userId || actionLoading}
                                className="danger-btn"
                            >
                                Delete user
                            </button>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="flex-row bottom-bar">
                <div className="button-group">
                    <SaveButton
                        onClick={save}
                        itemName="User"
                        loading={loading}
                        error={errors.length > 0}
                        isNew={!userId}
                    />
                </div>
            </div>

            {messages.length > 0 && (
                <div className="success-messages">
                    <ul>
                        {messages.map((message, index) => (
                            <li key={index}>{message}</li>
                        ))}
                    </ul>
                </div>
            )}

            {errors.length > 0 && (
                <div className="error-messages">
                    <ul>
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default UserSinglePage;
