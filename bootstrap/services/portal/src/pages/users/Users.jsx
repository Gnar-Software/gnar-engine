import React, { useState, useEffect } from "react";
import CrudLayout from "../../layouts/CrudLayout";
import CrudUserList from '../../features/crudUser/CrudUserList';
import CrudUserSingle from '../../features/crudUser/CrudUserSingle';
import gnarEngine from "@gnar-engine/js-client";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import arrow from '../../assets/arrow.svg';

const ManageUsers = () => {

    const [view, setView] = useState("list");
    const [selectedSingleItemId, setSelectedSingleItemId] = useState(null);
    const [selectedUser, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchUsers = async () => {
        try {
            const data = await gnarEngine.user.getMany();
            const usersList = data.users.map(user => ({
                id: user.id,
                email: user.email,
                username: user.username,
                userRole: user.role,
                createdAt: formatDate(user.createdAt),
            }));
            setUsers(usersList);
            setMessage(usersList.length > 0 ? '' : 'No users found');
        } catch (error) {
            console.error('Error fetching users:', error);
            setMessage('Error fetching users');
            setUsers([]);
        }
    };

    
    useEffect(() => {
        fetchUsers();
    }, []);


    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
    
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "N/A"; // Checks if the date is invalid
    
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} at ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    

    const handleAddNew = () => {
        setView("single");
        setSelectedSingleItemId(null);
        setUser(null);
    }

    const refreshSelectedUser = (user) => {
        setUser(user);
    }

    useEffect(() => {
        (async () => {
            if (!selectedSingleItemId) {
                return;
            }
            try {
                // fetch user data
                const data = await gnarEngine.user.getUser(selectedSingleItemId);
                setUser(data.user);

            } catch (error) {
                console.error('Error fetching user:', error);
            }
        })();
    }, [selectedSingleItemId]);


    const handleAction = () => {
        if (!selectedAction) {
            alert("Please select an action first!");
            return;
        }
    
        if (selectedAction.id === "delete") {
            handleDelete();
        } else if (selectedAction.id === "export") {
            console.log("Export action triggered");
        }
    };
    

    const handleDelete = () => {
        if (selectedUserIds.size === 0) {
            alert("Please select at least one user to delete.");
            return;
        }
    
        if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.size} user(s)?`)) {
            return;
        }
    
        (async () => {
            try {
                setLoading(true);
                for (let userId of selectedUserIds) {
                    await gnarEngine.user.delete(userId);
                }
                setSelectedUserIds(new Set()); 
                setLoading(false);
                await fetchUsers();
            } catch (error) {
                console.error('Error deleting users:', error);
                setLoading(false);
            }
        })();
    };
    

    return (
        <CrudLayout
            view={view}
            setView={setView}
            selectedSingleItemId={selectedSingleItemId}
            setSelectedSingleItemId={setSelectedSingleItemId}    
        >
            <div className="crud-page">

                {view === "list" ? (
                    <div className="crud-list-cont">
                        <div className="crud-list-controls">
                            <div className="controls-left-col">
                                <button onClick={handleAddNew} className="add-new">Add new</button>
                            </div>
                            <div className="controls-right-col">
                                <CustomSelect
                                    name="filter-users"
                                    placeholder="filter by"
                                    options={[
                                        { id: "all", name: "All" },
                                        { id: "admin", name: "Admin" },
                                        { id: "user", name: "User" }
                                    ]}
                                    labelKey="name"
                                    setSelectedOption={() => {}}
                                    selectedOption={null}
                                />
                                <CustomSelect 
                                    name="action"
                                    placeholder="action"
                                    options={[
                                        { id: "delete", name: "Delete" },
                                        // { id: "export", name: "Export" }
                                    ]}
                                    labelKey="name"
                                    setSelectedOption={setSelectedAction}
                                    selectedOption={selectedAction}
                                />
                                <button className="arrowButton" onClick={handleAction}><img src={arrow} alt="right arrow icon" /></button>
                            </div>
                        </div>
                        <CrudUserList 
                            setSelectedSingleItemId={setSelectedSingleItemId} 
                            setView={() => setView('single')}
                            selectedUserIds={selectedUserIds}
                            setSelectedUserIds={setSelectedUserIds}
                            users={users}
                            message={message}
                        />
                    </div>
                ) : (
                    <CrudUserSingle 
                        loading={loading} 
                        setLoading={setLoading} 
                        selectedUser={selectedUser} 
                        setView={() => setView('list')} 
                        refreshSelectedUser={refreshSelectedUser} 
                        setUser={setUser}
                        fetchUsers={fetchUsers}
                        formatDate={formatDate}
                        setSelectedSingleItemId={setSelectedSingleItemId}
                    />
                )}
            </div>
        </CrudLayout>
    );
}

export default ManageUsers;