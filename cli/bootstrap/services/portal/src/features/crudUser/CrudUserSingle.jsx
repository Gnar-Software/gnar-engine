import React, { useState, useEffect } from 'react';
import CustomSelect from '../../ui/customSelect/CustomSelect';
import { userRoles } from '../../data/data';
import gnarEngine from '@gnar-engine/js-client';
import SaveButton from '../../ui/saveButton/SaveButton';
import Eye from '../../assets/eye.svg'
import EyeOff from '../../assets/eye-off.svg'
import arrow from '../../assets/arrow.svg';
import { useSelector } from 'react-redux';


const CrudUserSingle = ({selectedUser, setUser, setView, loading, setLoading, refreshSelectedUser, fetchUsers, formatDate, setSelectedSingleItemId}) => {

    const user = useSelector(state => state.auth.authUser);
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        role: '',
        apiKey: ''
    });
    const [validationErrors, setValidationErrors] = useState([]);
    const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);


    // prepare form data for editing existing user
    useEffect(() => {
        console.log('user:', selectedUser);
        // set form data for updating user
        if (selectedUser && selectedUser.id) {
            const newFormData = {...selectedUser};
            setFormData(newFormData);
        }
        
        // set back to default if no user is selected
        else {        
            setFormData({
                email: ''
            });
        }

        setLoading(null);
    }, [selectedUser]);

    // handle form data changes
    const handleChange = (e) => {
        setValidationErrors([]);
    
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };


    // handle delete user
    const handleDelete = async (selectedUser) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                setLoading('loading');

                console.log('selectedUser:', selectedUser);

                await gnarEngine.user.delete(selectedUser.id);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);

                refreshSelectedUser();
                await fetchUsers();  
                setView('list');  

            } catch (error) {

                setLoading('error');
                console.error('Error deleting user:', error);
            }
        } else {
            console.log('Deletion canceled');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationErrors([]);  // Clear any previous validation errors
    
        // Set loading state to 'loading'
        setLoading('loading');
    
        try {
            if (selectedUser) {
                // Update existing user
                const data = { ...formData };
                delete data.created_at;
                delete data.updated_at;
                delete data.id;

                const updatedUserResponse = await gnarEngine.user.update(selectedUser.id, data);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                    refreshSelectedUser(updatedUserResponse.user);
                }, 3000);
    
            } else {
                // Creating a new user
                await gnarEngine.user.createUser(formData);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                    fetchUsers();  
                    setView('list');

                }, 3000);
            }
        } catch (error) {
            // Collect server-side validation errors, if any
            const errors = [];
    
            if (error.response?.data?.errors) {
                Object.keys(error.response.data.errors).forEach((key) => {
                    errors.push(error.response.data.errors[key]);
                });
            } else if (error.response?.data?.message) {
                errors.push(error.response.data.message);
            }
    
            setValidationErrors(errors);  // Set validation errors to be displayed
            console.error('Error saving user:', error);

            setLoading('error'); 
            setTimeout(() => {
                setLoading(null);  
            }, 3000);
        }
    };

    const handleAction = () => {
        if (!selectedAction) {
            alert("Please select an action first!");
            return;
        }
    
        if (selectedAction.id === "delete") {
            handleDelete(selectedUser);
        } else if (selectedAction.id === "export") {
            console.log("Export action triggered");
        }
    };
    
    

    const handlePasswordReset = async () => {
        if (!selectedUser || !selectedUser.id) {
            return;
        }

        setPasswordResetSuccess(true);  // Show success message
        setTimeout(() => {
            setPasswordResetSuccess(false);  // Hide it after 3 seconds
        }, 3000);
        
        try {
            await gnarEngine.sendPasswordReset({ email: selectedUser.email });

        } catch (error) {
            const errors = [];

            if (error.response.data.errors) {
                Object.keys(error.response.data.errors).forEach((key) => {
                    errors.push(error.response.data.errors[key]);
                });
            } else if (error.response.data.message && error.response.data.error) {
                errors.push(error.response.data.message);
                errors.push(error.response.data.error);
            }

            setValidationErrors(errors);
            console.error('Error sending password reset:', error);
        }
    }

    const routeKey = 'manage-users';
    const handleMenuBtnClick = () => setView({ isBackToList: true });

    // add event listener to sidebar buttons to change view
    useEffect(() => {
        const sidebarButtons = document.querySelectorAll('.sidebar a[href^="/portal/' + routeKey + '"]');
        sidebarButtons.forEach(button => {
            // if it doesn't already have an event listener
            if (!button.hasEventListener) {
                button.addEventListener('click', handleMenuBtnClick);
            }
        })

        // Cleanup to prevent memory leaks and double bindings
        return () => {
            sidebarButtons.forEach(button => {
                button.removeEventListener('click', handleMenuBtnClick);
            });
        };
    }, []);

    return (
        <div className="single-edit user">
            <div className='single-edit-header'>
                <div className='single-edit-header-left'>
                    {selectedUser && selectedUser.id &&
                        <>
                            <p><strong>User ID:&nbsp;</strong>{selectedUser.id}</p>
                            <p><strong>Email:&nbsp;</strong>{selectedUser.email}</p>
                            <p><strong>Role:&nbsp;</strong>{selectedUser.role}</p>
                            <p><strong>Date Added:&nbsp;</strong>{formatDate(selectedUser?.createdAt)}</p>
                        </>
                    }
                </div>
                <div className='single-edit-header-right'>
                    <div className="flex-row-buttons-cont">
                        <button onClick={() => {
                            setView('list');
                            setUser(null);
                            setSelectedSingleItemId(null);
                            }} className="secondaryButton">
                                Back
                        </button>
                        <button onClick={() => handleDelete(selectedUser)} className="secondaryButton">Delete</button>
                        <SaveButton
                            save={handleSubmit}
                            loading={loading}
                            textCreate="Add User"
                            textCreateLoading="Saving..."
                            textCreateSuccess="Saved"
                            textCreateError="Error"
                            textUpdate="Save"
                            textUpdateLoading="Updating..."
                            textUpdateSuccess="Updated"
                            textUpdateError="Error"
                            isUpdating={!!selectedUser} 
                        />
                    </div>
                    {validationErrors.length > 0 &&
                        <div className="error-messages">
                            {validationErrors.map((error, index) => {
                                return <p key={index}>{error}</p>
                            })}
                        </div>
                    }
                </div>

            </div>
            
            <h2>Details</h2>

            <div className='card account'>
                <div className='card-header'>
                    <h2>Account</h2>
                </div>
                <div className='card-content'>
                    <form className='user-form' onSubmit={handleSubmit}>
                        <div className='form-group'>
                            <label>Email:</label>
                            <input
                                type="text"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {selectedUser && selectedUser.id &&
                        <div className='form-group'>
                            <label>Username:</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        }

                        {!selectedUser &&
                            <div>
                                <label>Password:</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        }


                        <div className='form-group'>
                            <label>User Role:</label>
                            <CustomSelect 
                                name="select-user-role" 
                                placeholder="Select User Role"
                                options={userRoles}
                                labelKey="name"
                                setSelectedOption={(option) => setFormData(prev => ({ ...prev, role: option.role }))}
                                selectedOption={userRoles.find(role => role.role === formData.role) || null}
                                required
                            />
                        </div>
                    </form>
                    {selectedUser && selectedUser.id &&
                        <div className='form-group'>
                            <a onClick={() => handlePasswordReset()} className="password-reset-btn">Send password reset</a>
                            {passwordResetSuccess && <p>Password reset email sent successfully!</p>}
                        </div>
                    }
                </div>
            </div>

            {selectedUser && selectedUser.id &&
                <div className='card contacts'>
                    <div className='card-header'>
                        <h2>Contacts</h2>
                    </div>
                    <div className='card-content'>
                        <p>Contact details associated with this user.</p>
                        <form onSubmit={handleSubmit}>
                            <div className='form-group'>
                                <label>Type</label>
                                <input
                                    type="text"
                                    name="email"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className='form-group'>
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <button className="secondaryButton">View / Edit</button>
                        </form>
                    </div>
                </div>
            }

            {user && user.id && user.role === 'service_admin' || !selectedUser &&
                <>
                    <h2>API Access (Service Admin Only)</h2>
                    <div className='card api-key'>
                        <div className='card-header'>
                            <h2>API Keys</h2>
                        </div>
                        <div className='card-content'>
                            <form onSubmit={handleSubmit}>
                                <div className='form-group'>
                                    <label>Key</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="apiKey"
                                        value={formData.apiKey}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        style={{
                                            position: "absolute",
                                            right: "0",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <img src={showPassword ? Eye : EyeOff} alt="Show password" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            }
        </div>
    );
};

export default CrudUserSingle;
