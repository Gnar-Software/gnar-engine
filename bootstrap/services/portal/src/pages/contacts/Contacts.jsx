import React, { useState, useEffect } from "react";
import CrudLayout from "../../layouts/CrudLayout";
import gnarEngine from "@gnar-engine/js-client";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import arrow from '../../assets/arrow.svg';
import CrudContactSingle from "../../features/crudContact/CrudContactSingle";
import CrudContactList from "../../features/crudContact/CrudContactList";

const Contacts = () => {

    const [view, setView] = useState(null);
    const [selectedSingleItemId, setSelectedSingleItemId] = useState(null);
    const [selectedContact, setContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedContactIds, setSelectedContactIds] = useState(new Set());
    const [contacts, setContacts] = useState([]);
    const [message, setMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchContacts = async () => {
        try {
            const data = await gnarEngine.contacts.getMany();
            console.log('data:', data);

            const contactsList = data.contacts.map(contact => ({
                id: contact._id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                dateOfBirth: contact.dateOfBirth,
                createdAt: formatDate(contact.createdAt),
            }));

            setContacts(contactsList);
            setMessage(contactsList.length > 0 ? '' : 'No contacts found');
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setContacts([]);
        }
    };

    useEffect(() => {
        fetchContacts();
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
        setContact(null);
    }

    const refreshSelectedContact = () => {
        if (!selectedSingleItemId) {
            return;
        }
        (async () => {
            try {
                const data = await gnarEngine.contacts.getContact(selectedSingleItemId);
                setContact(data.contact);
            } catch (error) {
                console.error('Error fetching contact:', error);
            }
        })();
    }

    useEffect(() => {
        (async () => {
            if (!selectedSingleItemId) {
                return;
            }
            try {
                // fetch contact data
                const data = await gnarEngine.contacts.getContact(selectedSingleItemId);
                setContact(data.contact);

            } catch (error) {
                console.error('Error fetching contact:', error);
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
        if (selectedContactIds.size === 0) {
            alert("Please select a contact to delete first!");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${selectedContactIds.size} contact(s)?`)) {
            return;
        }
        (async () => {
            try {
                for (const contactId of selectedContactIds) {
                    await gnarEngine.contacts.delete(contactId);
                }
                setSelectedContactIds(new Set());
                setSelectedAction(null);
                await fetchContacts();
            } catch (error) {
                console.error('Error deleting contact:', error);
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
                                    name="filter-contacts"
                                    placeholder="filter by"
                                    options={[
                                        { id: "all", name: "All" },
                                        { id: "admin", name: "Admin" },
                                        { id: "contact", name: "User" }
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
                        <CrudContactList 
                            setSelectedSingleItemId={setSelectedSingleItemId} 
                            setView={() => setView('single')}
                            selectedContactIds={selectedContactIds}
                            setSelectedContactIds={setSelectedContactIds}
                            contacts={contacts}
                            message={message}
                        />
                    </div>
                ) : (
                    <CrudContactSingle 
                        loading={loading} 
                        setLoading={setLoading} 
                        contact={selectedContact} 
                        setView={() => setView('list')} 
                        refreshSelectedContact={refreshSelectedContact} 
                        setContact={setContact}
                        fetchContacts={fetchContacts}
                        formatDate={formatDate}
                        setSelectedSingleItemId={setSelectedSingleItemId}
                    />
                )}
            </div>
        </CrudLayout>
    );
}

export default Contacts;