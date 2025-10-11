import { useEffect, useState } from "react";
import gnarEngine from '@gnar-engine/js-client';
import DatePicker from "react-datepicker";
import SaveButton from "../../ui/saveButton/SaveButton";

const CrudContactSingle = ({ loading, setLoading, contact, setView, refreshSelectedContact, setContact, fetchContacts, formatDate, setSelectedSingleItemId }) => {

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        marketingOptIn: false,
    });
    const [validationErrors, setValidationErrors] = useState([]);


    // Load contact details if editing
    useEffect(() => {
        if (contact) {
            setFormData({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                dateOfBirth: contact.dateOfBirth,
                marketingOptIn: contact.marketingOptIn || false,
            });
        }
    }, [contact]);

    

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading('loading');
        setValidationErrors([]);

        try {

            if (contact) {
                const response = await gnarEngine.contacts.update(contact._id, formData);
                console.log('response:', response);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                    fetchContacts();
                    refreshSelectedContact();
                }, 3000);

                refreshSelectedContact();
            } else {
                
                const response = await gnarEngine.contacts.createContact({
                    contacts : [formData]
                });
                console.log('response:', response);

                if (response.error) {
                    setValidationErrors(response.error);
                } else {

                    setLoading('success');
                    setTimeout(() => {
                        setLoading(null);
                        fetchContacts();
                        setView('list');
                    }, 3000);

                }
            }
        }
        catch (error) {
            console.error('Error updating contact:', error);
            setValidationErrors(['Error updating contact']);
            setTimeout(() => {
                setLoading(null);
            }, 3000);
        }


    }

    // handle delete user
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
            try {
                setLoading('loading');

                await gnarEngine.contacts.delete(contact._id);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);

                refreshSelectedContact();  
                setView('list');  

            } catch (error) {

                setLoading('error');
                console.error('Error deleting contact:', error);
            }
        } else {
            console.log('Deletion canceled');
        }
    };





    return (

        <div className="single-edit contact">
            {validationErrors.length > 0 &&
                <div className="error-messages">
                    {validationErrors.map((error, index) => {
                        return <p key={index}>{error}</p>
                    })}
                </div>
            }

            <div className='single-edit-header'>
                <div className='single-edit-header-left'>
                    <h2>{contact ? 'Edit Contact' : 'Add New Contact'}</h2>
                </div>
                <div className='single-edit-header-right'>
                    <div className="flex-row-buttons-cont">
                        <button onClick={() => {
                            setView('list');
                            setContact(null);
                            setSelectedSingleItemId(null);
                            }} className="secondaryButton">
                                Back
                        </button>
                        <button onClick={handleDelete} className="secondaryButton">Delete</button>
                        <SaveButton
                            save={handleSubmit}
                            loading={loading}
                            textCreate="Add Contact"
                            textCreateLoading="Saving..."
                            textCreateSuccess="Saved"
                            textCreateError="Error"
                            textUpdate="Save"
                            textUpdateLoading="Updating..."
                            textUpdateSuccess="Updated"
                            textUpdateError="Error"
                            isUpdating={!!contact} 
                        />
                    </div>
                </div>
            </div>
            <div className="card">
                <div className='card-header'>
                    <h2>Contact Details</h2>
                </div>
                <div className='card-content'>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input 
                                type="text" 
                                id="firstName" 
                                name="firstName" 
                                value={formData.firstName} 
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input 
                                type="text" 
                                id="lastName" 
                                name="lastName" 
                                value={formData.lastName} 
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input 
                                type="text" 
                                id="phone" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth (DD/MM/YYYY)</label>
                            <DatePicker
                                selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                                onChange={(date) => {
                                    const formattedDate = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
                                    setFormData({ ...formData, dateOfBirth: formattedDate });
                                }}
                                dateFormat="dd/MM/yyyy"
                            />
                        </div>
                        {/* marketingOptIn */}
                        <div className="form-group">
                            <label htmlFor="marketingOptIn">
                                <input 
                                    type="checkbox" 
                                    id="marketingOptIn" 
                                    name="marketingOptIn" 
                                    checked={formData.marketingOptIn} 
                                    onChange={(e) => setFormData({ ...formData, marketingOptIn: e.target.checked })} 
                                />
                                Marketing Opt-In
                            </label>

                        </div>
                    </form>
                    <div>
                        <p><strong>Date Added: </strong>{formatDate(contact?.createdAt)}</p>
                    </div>
                </div>



            </div>
        </div>

    );

};

export default CrudContactSingle;