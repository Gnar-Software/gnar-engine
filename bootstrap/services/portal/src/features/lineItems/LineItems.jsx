const LineItems = ({order}) => {

    return (
        <div className="card">
            <div className='card-header'>
                <h2>Line Items & Totals</h2>
            </div>
            <div className='card-content'>
                <div className="line-items-totals-cont">
                    
                    {/* Line Items Section */}
                    <div className="line-items-cont">
                        <div className="line-items-body">
                            {order?.lineItems && order.lineItems.length > 0 ? (
                                <table className="line-items-table">

                                    {order?.originalSubscriptionOrderId && (
                                        <>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>SKU</th>
                                                    <th>Price</th>
                                                    <th>Quantity</th>
                                                    <th>Discount</th>
                                                    <th>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.lineItems.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.sku.replace(/-/g, ' ').toUpperCase()}</td>
                                                        <td>{item.sku}</td>
                                                        <td>£{item.price.toFixed(2)}</td>
                                                        <td>x{item.quantity}</td>
                                                        <td>£{'0.00' ||item.discount}</td>
                                                        <td>£{(item.quantity * item.price).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </>
                                    )}

                                    {order?.type === 'order' && (
                                        <>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>SKU</th>
                                                    <th>Price</th>
                                                    <th>Quantity</th>
                                                    <th>Type</th>
                                                    <th>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {order.lineItems.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.sku.replace(/-/g, ' ').toUpperCase()}</td>
                                                        <td>{item.sku}</td>
                                                        <td>£{item.price.price.toFixed(2)}</td>
                                                        <td>x{item.quantity}</td>
                                                        <td>{item.type}</td>
                                                        <td>£{(item.quantity * item.price.price).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </>
                                    )}
                                </table>
                            ) : (
                                <p>No line items found.</p>
                            )}
                        </div>
                    </div>

                    {/* Order Totals Section */}
                    <div className="totals-cont">
                        <div className="totals-body">
                            <table className="totals-table">
                                <tbody>
                                    <tr>
                                        <td>Currency:</td>
                                        <td>{order?.currency}</td>
                                    </tr>
                                    <tr>
                                        <td>Items Subtotal:</td>
                                        <td>£{(order?.subTotal ?? order?.subTotal)?.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Shipping:</td>
                                        <td>£{'0.00' || order?.shipping.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Tax:</td>
                                        <td>£{(order?.tax ?? order?.tax)?.toFixed(2)}</td>
                                    </tr>
                                    <tr className="order-total">
                                        <td><strong>Total:</strong></td>
                                        <td><strong>£{order?.total?.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default LineItems;