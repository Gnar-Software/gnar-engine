
import { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import Card from '../../layouts/Card/Card';
import SaveButton from '../../elements/SaveButton/SaveButton';
import TextInput from '../../elements/TextInput/TextInput';
import CustomSelect from '../../elements/CustomSelect/CustomSelect';
import { user } from '../../services/user.js';
import { roles } from '../../data/roles.data.js';

function UserSinglePage() {

    const { id } = useParams();
    const [userId, setUserId] = useState('');
    const [userDetails, setUserDetails] = useState({
        username: '',
        email: '',
        role: roles[0].id,
        password: '',
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    const selectedRole = roles.find(role => role.id === userDetails.role) || roles[0];

    useEffect(() => {
        if (id && id !== 'new') {
            (async () => {
                setLoading(true);

                try {
                    const userData = await user.getUser({ userId: id });
                    const fetchedUser = userData.user || {};

                    setUserId(fetchedUser.id || '');
                    setUserDetails({
                        username: fetchedUser.username || '',
                        email: fetchedUser.email || '',
                        role: fetchedUser.role || roles[0].id,
                        password: '',
                    });
                    setErrors([]);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setErrors([error]);
                }

                setLoading(false);
            })();
        }
    }, [id]);

    const updateUserDetails = (key, value) => {
        setErrors([]);
        setUserDetails({
            ...userDetails,
            [key]: value,
        });
    };

    const save = async () => {
        setLoading(true);

        const nextUser = {
            username: userDetails.username,
            email: userDetails.email,
            role: userDetails.role,
        };

        if (!userId && userDetails.password) {
            nextUser.password = userDetails.password;
        }

        if (!userId) {
            try {
                const response = await user.createUser({ user: nextUser });
                const createdUser = response?.users?.[0];

                if (createdUser?.id) {
                    setUserId(createdUser.id);
                }

                setErrors([]);
            } catch (error) {
                console.error('Error creating user:', error);
                setErrors([error]);
            }
        } else {
            try {
                await user.update({
                    id: userId,
                    user: nextUser,
                });
                setErrors([]);
            } catch (error) {
                console.error('Error updating user:', error);
                setErrors([error]);
            }
        }

        setLoading(false);
    };

    return (
        <div className="single-crud-page">
            <h1>Create / Update User</h1>

            <div className="flex-row top-bar">
                <p className="single-crud-id">{userId || 'Creating new user...'}</p>
                <div className="button-group">
                    <button onClick={() => window.history.back()} className="secondary-btn">Back</button>
                    <button onClick={save}>Save</button>
                </div>
            </div>

            <div className="card-columns">
                <div className="col-66">
                    <Card title="User details">
                        <div className="flex-col">
                            <TextInput
                                label="Username"
                                placeholder="Enter username"
                                value={userDetails.username}
                                onChange={(e) => updateUserDetails('username', e.target.value)}
                            />

                            <TextInput
                                label="Email"
                                placeholder="Enter email"
                                value={userDetails.email}
                                onChange={(e) => updateUserDetails('email', e.target.value)}
                            />

                            <CustomSelect
                                label='Role'
                                name='user-role'
                                placeholder={selectedRole.name}
                                options={roles}
                                labelKey='name'
                                selectedOption={selectedRole}
                                setSelectedOption={(option) => updateUserDetails('role', option.id)}
                            />

                            {!userId && (
                                <TextInput
                                    label="Password"
                                    placeholder="Enter password"
                                    type="password"
                                    value={userDetails.password}
                                    onChange={(e) => updateUserDetails('password', e.target.value)}
                                />
                            )}
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

            <div>
                {errors.length > 0 && (
                    <div className="error-messages">
                        <ul>
                            {errors.map((error, index) => (
                                <li key={index}>{error.message || error}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserSinglePage;
