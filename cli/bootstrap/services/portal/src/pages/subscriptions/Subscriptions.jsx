import React, { useState, useEffect } from "react";
import CrudLayout from "../../layouts/CrudLayout";
import gnarEngine from "@gnar-engine/js-client";
import CustomSelect from "../../ui/customSelect/CustomSelect";
import arrow from '../../assets/arrow.svg';
import CrudSubscriptionList from "../../features/crudSubscription/CrudSubscriptionList";
import CrudSubscriptionSingle from "../../features/crudSubscription/CrudSubscriptionSingle";

const Subscriptions = () => {

    const [view, setView] = useState("list");
    const [selectedSingleItemId, setSelectedSingleItemId] = useState(null);
    const [selectedSubscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState(new Set());
    const [subscriptions, setSubscriptions] = useState([]);
    const [message, setMessage] = useState('');
    const [currentPage, setCurrentPage] = useState(1);


    const fetchSubscriptions = async () => {
        try {
            const data = await gnarEngine.subscription.getSubscriptions();
            console.log('data:', data);

            const subscriptionsList = data.subscriptions.map(order => ({
                id: order._id,
                firstName: order.billingAddress.firstName,
                lastName: order.billingAddress.lastName,
                date: new Date(order.createdAt).toLocaleDateString(),
                status: order.status,
                total: '£' + order.total?.toFixed(2),
                createdAt: formatDate(order.createdAt),
            }));

            setSubscriptions(subscriptionsList);
            setMessage(subscriptionsList.length > 0 ? '' : 'No subscriptions found');
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            setSubscriptions([]);
        }
    }

    useEffect(() => {
        fetchSubscriptions();
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
        setSubscription(null);
    }

    const refreshSelectedSubscription = () => {
        if (!selectedSingleItemId) {
            return;
        }
        (async () => {
            try {
                const data = await gnarEngine.subscription.getSubscriptions(selectedSingleItemId);
                setSubscription(data.subscription);
            } catch (error) {
                console.error('Error fetching subscription:', error);
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
                const data = await gnarEngine.subscription.getSubscription(selectedSingleItemId);
                setSubscription(data.subscription);

            } catch (error) {
                console.error('Error fetching subscription:', error);
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
        if (selectedSubscriptionIds.size === 0) {
            alert("Please select a subscription to delete first!");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${selectedSubscriptionIds.size} subscription(s)?`)) {
            return;
        }
        (async () => {
            try {
                for (const subscriptionId of selectedSubscriptionIds) {
                    await gnarEngine.subscription.deleteSubscription(subscriptionId);
                }
                setSelectedSubscriptionIds(new Set());
                setSelectedAction(null);
                await fetchSubscriptions();
            } catch (error) {
                console.error('Error deleting subscription:', error);
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
                        <CrudSubscriptionList 
                            setSelectedSingleItemId={setSelectedSingleItemId} 
                            setView={() => setView('single')}
                            selectedSubscriptionIds={selectedSubscriptionIds}
                            setSelectedSubscriptionIds={setSelectedSubscriptionIds}
                            subscriptions={subscriptions}
                            message={message} 
                        />
                    </div>
                ) : (
                    <CrudSubscriptionSingle 
                        loading={loading} 
                        setLoading={setLoading} 
                        subscription={selectedSubscription} 
                        setView={() => setView('list')} 
                        refreshSelectedSubscription={refreshSelectedSubscription} 
                        setSubscription={setSubscription}
                        fetchSubscriptions={fetchSubscriptions}
                        setSelectedSingleItemId={setSelectedSingleItemId}
                        formatDate={formatDate}
                    />
                )}
            </div>
        </CrudLayout>
    );
}

export default Subscriptions;