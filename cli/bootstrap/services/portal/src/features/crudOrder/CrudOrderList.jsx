import React, { useState, useEffect } from 'react';
import gnarEngine from '@gnar-engine/js-client';
import CustomCheckbox from '../../ui/customCheckbox/CustomCheckbox';

const CrudOrderList = ({ setSelectedSingleItemId, setView, selectedOrderIds, setSelectedOrderIds, orders, message }) => {

    const allSelected = orders.length > 0 && selectedOrderIds.size === orders.length;

    const toggleContactSelection = (orderId) => {
        setSelectedOrderIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };


    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(orders.map(order => order.id)));
        }
    };

    const handleEditClick = (product) => {
        setSelectedSingleItemId(product.id);
        setView('single');
    };

    const columns = [
        { columnLabel: 'Order', dataKey: 'id' },
        { columnLabel: 'Type', dataKey: 'type' },
        { columnLabel: 'First Name', dataKey: 'firstName' },
        { columnLabel: 'Last Name', dataKey: 'lastName' },
        { columnLabel: 'Status', dataKey: 'status' },
        { columnLabel: 'Total', dataKey: 'total' },
        { columnLabel: 'Date added', dataKey: 'createdAt' },
    ];


    return (
        <div className="">
            <div className='pagination-labels-cont'>
                <div className='pagination-count'>
                    Showing {orders.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
                </div>
                <div className="pagination-count">
                        {selectedOrderIds.size} of {orders.length} order{orders.length !== 1 ? 's' : ''} selected
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
                            orders.length > 0 ? (
                                orders.map(order => (
                                    <tr key={order.id} onClick={() => handleEditClick(order)}>
                                        <td>
                                            <CustomCheckbox 
                                                name={`checkbox-${order.id}`}
                                                checked={selectedOrderIds.has(order.id)}
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

export default CrudOrderList;