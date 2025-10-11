import { useEffect, useState } from "react";
import gnarEngine from '@gnar-engine/js-client';
import SaveButton from "../../ui/saveButton/SaveButton";
import Repeater from "../../ui/repeater/Repeater";
import Notes from "../notes/Notes";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import { orderTypes, subscriptionStatuses } from '../../data/data';
import { Link } from "react-router-dom";
import BillingShipping from "../billingShipping/BillingShipping";
import SubscriptionSchedule from "../subscriptionSchedule/SubscriptionSchedule";
import LineItems from "../lineItems/LineItems";


const CrudSubscriptionSingle = ({ loading, setLoading, subscription, setView, refreshSelectedSubscription, setSubscription, fetchSubscriptions, setSelectedSingleItemId, formatDate }) => {

    const [formData, setFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState([]);
    const [orderType, setOrderType] = useState(null);
    const [orderStatus, setOrderStatus] = useState(null);

    useEffect(() => {
        if (subscription && subscription._id) {
            setFormData({
                 ...subscription,
            });

            // set order type
            const existingOrderType = orderTypes.find(type => type.id === subscription.type);
            setOrderType(existingOrderType);

            // set order status
            const existingSubscriptionStatus = subscriptionStatuses.find(status => status.id === subscription.status);
            setOrderStatus(existingSubscriptionStatus);

        } else {
            setFormData({
                ...formData,
                userId: '',
                notes: [],
                type: null,
                status: null,
                billingAddress: {
                    firstName: '',
                    lastName: '',
                    addressLine1: '',
                    addressLine2: '',
                    city: '',
                    postcode: '',
                    email: '',
                    phone: '',
                },
                shippingAddress: {
                    firstName: '',
                    lastName: '',
                    addressLine1: '',
                    addressLine2: '',
                    city: '',
                    postcode: '',
                },
                lineItems: [],
                currency: 'GBP',
                subTotal: 0,
                shipping: 0,
                tax: 0,
                total: 0,
            });
        }
    }, [subscription]);

                
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading('loading');
        setValidationErrors([]);

        try {

            // parse ints
            formData.retryAttempt = parseInt(formData.retryAttempt) || 0;

            if (subscription) {
                const response = await gnarEngine.subscription.updateSubscription(subscription._id, formData);
                console.log('response:', response);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                    fetchSubscriptions();
                    refreshSelectedSubscription();
                }, 3000);

                refreshSelectedSubscription();
            } else {
                
                const response = await gnarEngine.subscription.createSubscription([formData]);
                console.log('response:', response);

                if (response.error) {
                    setValidationErrors(response.error);
                } else {
                    setSubscription(response.subscription);
                    refreshSelectedSubscription();
                    setView('list');
                }
            }
        }
        catch (error) {
            console.error('Error updating subscription:', error);
            setValidationErrors(['Error updating subscription']);
            setTimeout(() => {
                setLoading(null);
            }, 3000);
        }


    }

    // handle delete user
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this subscription?')) {
            try {
                setLoading('loading');

                await gnarEngine.subscription.deleteSubscription(subscription._id);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);

                refreshSelectedSubscription();  
                setView('list');  

            } catch (error) {

                setLoading('error');
                console.error('Error deleting subscription:', subscription);
            }
        } else {
            console.log('Deletion canceled');
        }
    };

    // check order being passed in
    useEffect(() => {
        console.log('subscription:', subscription);
    }, [subscription]);


    const handleStatusChange = (selectedOption) => {
        setOrderStatus(selectedOption);
        setFormData({
            ...formData,
            status: selectedOption.id,
        });
    }


    return (

        <div className="single-edit subscriptions">
            {validationErrors.length > 0 &&
                <div className="error-messages">
                    {validationErrors.map((error, index) => {
                        return <p key={index}>{error}</p>
                    })}
                </div>
            }

            <div className='single-edit-header'>
                <div className='single-edit-header-left'>
                    <p><strong>{subscription ? 'Subscription ID# ' + subscription._id : 'Add New Subscription'}</strong></p>
                    <p>Date Added: {formatDate(subscription?.createdAt)}</p>
                    <label htmlFor="orderStatus">Order Status</label>
                    <CustomSelect
                        name="status"
                        labelKey="status"
                        placeholder="Select subscription status"
                        options={subscriptionStatuses}
                        setSelectedOption={handleStatusChange}
                        selectedOption={orderStatus}
                    />
                    <div className="input-cont flex-row flex-row-end">
                        <div>
                            <label htmlFor="userId">User ID</label>
                            <input
                                type="text"
                                name="userId"
                                placeholder="User ID"
                                value={formData.userId}
                                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                            />
                        </div>
                        <Link to={`/portal/users?view=single&id=${subscription?.userId}`}>
                            <button className="mainButton">View / Edit</button>
                        </Link>
                    </div> 

                </div>
                <div className='single-edit-header-right'>
                    <div className="flex-row-buttons-cont">
                        <button onClick={() => {
                            setView('list');
                            setSubscription(null);
                            setSelectedSingleItemId(null);
                            }} className="secondaryButton">
                                Back
                        </button>
                        <button onClick={handleDelete} className="secondaryButton">Delete</button>
                        <SaveButton
                            save={handleSubmit}
                            loading={loading}
                            textCreate="Add Subscription"
                            textCreateLoading="Saving..."
                            textCreateSuccess="Saved"
                            textCreateError="Error"
                            textUpdate="Save"
                            textUpdateLoading="Updating..."
                            textUpdateSuccess="Updated"
                            textUpdateError="Error"
                            isUpdating={!!subscription} 
                        />
                    </div>
                </div>
            </div>

            <BillingShipping
                order={subscription}
            />

            <SubscriptionSchedule
                subscription={subscription}
                formData={formData}
                onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
            />

            <LineItems
                order={subscription}
            />

            <div className="card">
                <div className='card-header'>
                    <h2>Orders</h2>
                </div>
                <div className='card-content'>
                    <div className="subscription-details-cont">
                        <p><strong>Parent Order ID:</strong> {subscription?.originalSubscriptionOrderId}</p>
                        <Link to={`/portal/orders?view=single&id=${subscription?.originalSubscriptionOrderId}`}>
                            <button className="secondaryButton">View / Edit</button>
                        </Link>
                    </div>
                </div>
            </div>

        </div>

    );

};

export default CrudSubscriptionSingle;