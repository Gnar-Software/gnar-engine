import React, { useState, useEffect } from 'react';
import gnarEngine from '@gnar-engine/js-client';
import CustomCheckbox from '../../ui/customCheckbox/CustomCheckbox';

const CrudSubscriptionList = ({ setSelectedSingleItemId, setView, selectedSubscriptionIds, setSelectedSubscriptionIds, subscriptions, message}) => {

    const allSelected = subscriptions.length > 0 && selectedSubscriptionIds.size === subscriptions.length;

    const toggleContactSelection = (subscriptionId) => {
        setSelectedSubscriptionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subscriptionId)) {
                newSet.delete(subscriptionId);
            } else {
                newSet.add(subscriptionId);
            }
            return newSet;
        });
    };


    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedSubscriptionIds(new Set());
        } else {
            setSelectedSubscriptionIds(new Set(subscriptions.map(subscription => subscription.id)));
        }
    };


    const handleEditClick = (product) => {
        setSelectedSingleItemId(product.id);
        setView('single');
    };

    const columns = [
        { columnLabel: 'Subscription', dataKey: 'id' },
        { columnLabel: 'First Name', dataKey: 'firstName' },
        { columnLabel: 'Last Name', dataKey: 'lastName' },
        { columnLabel: 'Date', dataKey: 'createdAt' },
        { columnLabel: 'Status', dataKey: 'status' },
        { columnLabel: 'Total', dataKey: 'total' },
        { columnLabel: 'Date added', dataKey: 'createdAt' },
    ];


    return (
        <div className="">
            <div className='pagination-labels-cont'>
                <div className='pagination-count'>
                    Showing {subscriptions.length} of {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
                </div>
                <div className="pagination-count">
                        {selectedSubscriptionIds.size} of {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''} selected
                </div>
            </div>
            <div className='crud-list'>
                <table className='custom-table'>
                    <thead>
                        <tr>
                            <th className="checkbox">
                                <CustomCheckbox
                                    name="selectAll"
                                    checked={allSelected}
                                    setChecked={toggleSelectAll}
                                />
                            </th>
                            {columns.map(column => (
                                <th key={column.columnLabel}>{column.columnLabel}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {message ? (
                            <tr>
                                <td colSpan={columns.length + 1}>{message}</td>
                            </tr>
                        ) : (
                            subscriptions.length > 0 ? (
                                subscriptions.map(order => (
                                    <tr key={order.id} onClick={() => handleEditClick(order)}>
                                        <td>
                                            <CustomCheckbox 
                                                name={`checkbox-${order.id}`}
                                                checked={selectedSubscriptionIds.has(order.id)}
                                                setChecked={() => toggleContactSelection(order.id)}
                                            />
                                        </td>
                                        {columns.map(column => (
                                            <td key={column.dataKey}>{order[column.dataKey]}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1}>No orders found</td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );

};

export default CrudSubscriptionList;