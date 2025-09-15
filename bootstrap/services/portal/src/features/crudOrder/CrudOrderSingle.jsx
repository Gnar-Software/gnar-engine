import { useEffect, useState } from "react";
import gnarEngine from '@gnar-engine/js-client';
import SaveButton from "../../ui/saveButton/SaveButton";
import Repeater from "../../ui/repeater/Repeater";
import Notes from "../notes/Notes";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import { orderTypes, orderStatuses } from '../../data/data';
import { Link } from "react-router-dom";
import BillingShipping from "../billingShipping/BillingShipping";
import LineItems from "../lineItems/LineItems";


const CrudOrderSingle = ({ loading, setLoading, order, setView, refreshSelectedOrder, setOrder, formatDate, setSelectedSingleItemId }) => {

    const [formData, setFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState([]);
    const [orderType, setOrderType] = useState(null);
    const [orderStatus, setOrderStatus] = useState(null);
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        if (order && order._id) {
            setFormData(prevFormData => ({
                ...prevFormData,
                userId: order.userId,
                type: order.type,
                status: order.status,
                billingAddress: order.billingAddress,
                shippingAddress: order.shippingAddress,
                lineItems: order.lineItems,
                currency: order.currency,
                subTotal: order.subTotal,
                shipping: order.shipping,
                tax: order.tax,
                total: order.total,
            }));

            setNotes(order.notes || []);

            // set order type
            const existingOrderType = orderTypes.find(type => type.id === order.type);
            setOrderType(existingOrderType);

            // set order status
            const existingOrderStatus = orderStatuses.find(status => status.id === order.status);
            setOrderStatus(existingOrderStatus);

        } else {
            setFormData({
                ...formData,
                userId: '',
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
            setNotes([]);
        }
    }, [order]);

                
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading('loading');
        setValidationErrors([]);

        try {
            const updatedOrder = {
                ...formData,
                notes: notes,
            };

            if (order) {
                const response = await gnarEngine.order.updateOrder(order._id,{
                    ...order,
                    ...updatedOrder
                });
                console.log('response:', response);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);

                refreshSelectedOrder();
            } else {
                
                const response = await gnarEngine.order.createOrder([updatedOrder]);
                console.log('response:', response);

                if (response.error) {
                    setValidationErrors(response.error);
                } else {
                    setOrder(response.order);
                    refreshSelectedOrder();
                    setView('list');
                }
            }
        }
        catch (error) {
            console.error('Error updating order:', error);
            setValidationErrors(['Error updating order']);
            setTimeout(() => {
                setLoading(null);
            }, 3000);
        }


    }

    // handle delete user
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            try {
                setLoading('loading');

                await gnarEngine.order.delete(order._id);

                setLoading('success');
                setTimeout(() => {
                    setLoading(null);
                }, 3000);

                refreshSelectedOrder();  
                setView('list');  

            } catch (error) {

                setLoading('error');
                console.error('Error deleting order:', error);
            }
        } else {
            console.log('Deletion canceled');
        }
    };

    // check order being passed in
    useEffect(() => {
        console.log('order:', order);
    }, [order]);


    const handleTypeChange = (selectedOption) => {
        setOrderStatus(selectedOption);
        setFormData({
            ...formData,
            type: selectedOption.id,
        });
    }

    const handleStatusChange = (selectedOption) => {
        setOrderStatus(selectedOption);
        setFormData({
            ...formData,
            status: selectedOption.id,
        });
    }


    return (

        <div className="single-edit order">
            {validationErrors.length > 0 &&
                <div className="error-messages">
                    {validationErrors.map((error, index) => {
                        return <p key={index}>{error}</p>
                    })}
                </div>
            }

            <div className='single-edit-header'>
                <div className='single-edit-header-left'>
                    <p><strong>{order ? 'Order# ' + order._id : 'Add New Order'}</strong></p>
                    <p>Date Added: {formatDate(order?.createdAt)}</p>
                    <label>Order Type</label>
                    <CustomSelect
                        name="type"
                        labelKey="type"
                        placeholder="Select order type"
                        options={orderTypes}
                        setSelectedOption={handleTypeChange}
                        selectedOption={orderType}
                    />
                    <label>Order Status</label>
                    <CustomSelect
                        name="status"
                        labelKey="status"
                        placeholder="Select order status"
                        options={orderStatuses}
                        setSelectedOption={handleStatusChange}
                        selectedOption={orderStatus}
                    />
                    <div className="input-cont flex-row flex-row-end">
                        <div>
                            <label>User ID</label>
                            <input
                                type="text"
                                name="userId"
                                placeholder="User ID"
                                value={formData.userId}
                                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                            />
                        </div>
                        <Link to={`/portal/users?view=single&id=${order?.userId}`}>
                            <button className="mainButton">View / Edit</button>
                        </Link>
                    </div> 

                </div>
                <div className='single-edit-header-right'>
                    <div className="flex-row-buttons-cont">
                        <button onClick={() => {
                            setView('list');
                            setOrder(null);
                            setSelectedSingleItemId(null);
                            }} className="secondaryButton">
                                Back
                        </button>
                        <button onClick={handleDelete} className="secondaryButton">Delete</button>
                        <SaveButton
                            save={handleSubmit}
                            loading={loading}
                            textCreate="Add Order"
                            textCreateLoading="Saving..."
                            textCreateSuccess="Saved"
                            textCreateError="Error"
                            textUpdate="Save"
                            textUpdateLoading="Updating..."
                            textUpdateSuccess="Updated"
                            textUpdateError="Error"
                            isUpdating={!!order} 
                        />
                    </div>
                </div>
            </div>
            
            <BillingShipping 
                order={order}
            />

            <LineItems  
                order={order}
            />

            <div className="card">
                <div className='card-header'>
                    <h2>Order Notes</h2>
                </div>
                <div className='card-content'>
                    <div className="order-notes-cont">
                        <Repeater
                            items={notes}
                            setItems={setNotes}
                            defaultItem={{ note: '' }}
                            renderRow={(item, index, onChange, remove) => (
                                <Notes key={index} item={item} onChange={onChange} remove={remove} />
                            )}
                            buttonText="Add Note"
                        />
                    </div>
                </div>
            </div>

            {order && order.subscriptions && (
                <div className="card">
                    <div className='card-header'>
                        <h2>Subscriptions</h2>
                    </div>
                    <div className='card-content'>
                        {order.subscriptions.length > 0 ? (
                            <>
                                {order.subscriptions.map((subscription, index) => (
                                    <div className="subscription-details-cont" key={index}>
                                        <p><strong>Subscription ID:</strong> {subscription?._id}</p>
                                        <Link to={`/portal/subscriptions?view=single&id=${subscription._id}`}>
                                            <button className="secondaryButton">View / Edit</button>
                                        </Link>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <p>No subscriptions found.</p>
                        )}
                    </div>
                </div>
            )}
        </div>

    );

};

export default CrudOrderSingle;