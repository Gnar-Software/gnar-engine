import { useEffect, useState } from "react";

const BillingShipping = ({ order }) => {

    const [isEditingBilling, setIsEditingBilling] = useState(false);
    const [isEditingShipping, setIsEditingShipping] = useState(false);
    
    const [billingAddress, setBillingAddress] = useState(order?.billingAddress || {});
    const [shippingAddress, setShippingAddress] = useState(order?.shippingAddress || {});

    const handleInputChange = (e, addressType, field) => {
        const value = e.target.value;
        if (addressType === 'billing') {
            setBillingAddress((prev) => ({ ...prev, [field]: value }));
        } else {
            setShippingAddress((prev) => ({ ...prev, [field]: value }));
        }
    };

    return (
        <div className="card">
            <div className='card-header'>
                <h2>Billing & Shipping</h2>
            </div>
            <div className='card-content'>
                <div className="billing-shipping-cont">
                    <div className="billing-cont">
                        <div className="billing-header">
                            <h2>Billing Address</h2>
                        </div>
                        <div className="billing-body">
                            {isEditingBilling ? (
                                <div>
                                    <input 
                                        type="text" 
                                        placeholder="First Name"
                                        value={billingAddress.firstName || ''} 
                                        onChange={(e) => handleInputChange(e, 'billing', 'firstName')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Last Name"
                                        value={order?.billingAddress.lastName} 
                                        onChange={(e) => handleInputChange(e, 'billing', 'lastName')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Address Line 1"
                                        value={order?.billingAddress.addressLine1} 
                                        onChange={(e) => handleInputChange(e, 'billing', 'addressLine1')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Address Line 2"
                                        value={order?.billingAddress.addressLine2} 
                                        onChange={(e) => handleInputChange(e, 'billing', 'addressLine2')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="City"
                                        value={order?.billingAddress.city} 
                                        onChange={(e) => handleInputChange(e, 'billing', 'city')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Postcode"
                                        value={order?.billingAddress.postcode} 
                                        onChange={(e) => handleInputChange(e, 'billing', 'postcode')} 
                                    />
                                    <br />
                                    <p>{order?.billingAddress.email}</p>
                                    <p>{order?.billingAddress.phone}</p>
                                </div>
                            ) : (
                                <div>
                                    <p>{order?.billingAddress.firstName} {order?.billingAddress.lastName}</p>
                                    <p>{order?.billingAddress.addressLine1}</p>
                                    <p>{order?.billingAddress.addressLine2}</p>
                                    <p>{order?.billingAddress.city}</p>
                                    <p>{order?.billingAddress.postcode}</p>
                                    <br />
                                    <p>{order?.billingAddress.email}</p>
                                    <p>{order?.billingAddress.phone}</p>
                                </div>
                            )}
                            <button
                                onClick={() => setIsEditingBilling((prev) => !prev)} 
                            >
                                {isEditingBilling ? 'Save' : 'Edit'}
                            </button>
                        </div>
                    </div>

                    <div className="shipping-cont">
                        <div className="shipping-header">
                            <h2>Shipping Address</h2>
                        </div>
                        <div className="shipping-body">
                            {isEditingShipping ? (
                                <div>
                                    <input 
                                        type="text"
                                        placeholder="First Name" 
                                        value={shippingAddress.firstName} 
                                        onChange={(e) => handleInputChange(e, 'shipping', 'firstName')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Last Name"
                                        value={shippingAddress.lastName} 
                                        onChange={(e) => handleInputChange(e, 'shipping', 'lastName')} 
                                    />
                                    <input 
                                        type="text"
                                        placeholder="Address Line 1" 
                                        value={shippingAddress.addressLine1} 
                                        onChange={(e) => handleInputChange(e, 'shipping', 'addressLine1')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Address Line 2"
                                        value={shippingAddress.addressLine2} 
                                        onChange={(e) => handleInputChange(e, 'shipping', 'addressLine2')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="City"
                                        value={shippingAddress.city} 
                                        onChange={(e) => handleInputChange(e, 'shipping', 'city')} 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Postcode"
                                        value={shippingAddress.postcode} 
                                        onChange={(e) => handleInputChange(e, 'shipping', 'postcode')} 
                                    />
                                </div>
                            ) : (
                                <div>
                                    <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                                    <p>{shippingAddress.addressLine1}</p>
                                    <p>{shippingAddress.addressLine2}</p>
                                    <p>{shippingAddress.city}</p>
                                    <p>{shippingAddress.postcode}</p>
                                </div>
                            )}
                            <button 
                                onClick={() => setIsEditingShipping((prev) => !prev)} 
                            >
                                {isEditingShipping ? 'Save' : 'Edit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BillingShipping;