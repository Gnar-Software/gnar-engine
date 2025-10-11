import React, { useState, useEffect } from "react";
import CrudLayout from "../../layouts/CrudLayout";
import gnarEngine from "@gnar-engine/js-client";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import arrow from '../../assets/arrow.svg';
import CrudOrderList from "../../features/crudOrder/CrudOrderList";
import CrudOrderSingle from "../../features/crudOrder/CrudOrderSingle";

const Orders = () => {

    const [view, setView] = useState("list");
    const [selectedSingleItemId, setSelectedSingleItemId] = useState(null);
    const [selectedOrder, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchOrders = async () => {
        try {
            const data = await gnarEngine.order.getOrders();
            console.log('data:', data);

            const ordersList = data.orders.map(order => ({
                id: order._id,
                type: order.type,
                firstName: order.billingAddress.firstName,
                lastName: order.billingAddress.lastName,
                date: new Date(order.createdAt).toLocaleDateString(),
                status: order.status,
                total: '£' + order.total?.toFixed(2),
                createdAt: formatDate(order.createdAt),
            }));

            setOrders(ordersList);
            setMessage(ordersList.length > 0 ? '' : 'No orders found');
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
        }
    }

    useEffect(() => {
        fetchOrders();
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
        setOrder(null);
    }

    const refreshSelectedOrder = () => {
        if (!selectedSingleItemId) {
            return;
        }
        (async () => {
            try {
                const data = await gnarEngine.order.getOrder(selectedSingleItemId);
                setOrder(data.order);
            } catch (error) {
                console.error('Error fetching orders:', error);
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
                const data = await gnarEngine.order.getOrder(selectedSingleItemId);
                setOrder(data.order);

            } catch (error) {
                console.error('Error fetching order:', error);
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
        if (selectedOrderIds.size === 0) {
            alert("Please select an order to delete first!");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${selectedOrderIds.size} order(s)?`)) {
            return;
        }
        (async () => {
            try {
                for (const orderId of selectedOrderIds) {
                    await gnarEngine.order.deleteOrder(orderId);
                }
                setSelectedOrderIds(new Set());
                setSelectedAction(null);
                await fetchOrders();
            } catch (error) {
                console.error('Error deleting order:', error);
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
                        <CrudOrderList 
                            setSelectedSingleItemId={setSelectedSingleItemId} 
                            setView={() => setView('single')}
                            selectedOrderIds={selectedOrderIds}
                            setSelectedOrderIds={setSelectedOrderIds}
                            orders={orders}
                            message={message} 
                        />
                    </div>
                ) : (
                    <CrudOrderSingle 
                        loading={loading} 
                        setLoading={setLoading} 
                        order={selectedOrder} 
                        setView={() => setView('list')} 
                        refreshSelectedOrder={refreshSelectedOrder} 
                        setOrder={setOrder}
                        fetchOrders={fetchOrders}
                        formatDate={formatDate}
                        setSelectedSingleItemId={setSelectedSingleItemId}
                    />
                )}
            </div>
        </CrudLayout>
    );
}

export default Orders;