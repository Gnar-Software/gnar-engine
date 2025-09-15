import React, { useState, useEffect } from 'react';
import gnarEngine from '@gnar-engine/js-client';
import CustomCheckbox from '../../ui/customCheckbox/CustomCheckbox';

const CrudContactList = ({ setSelectedSingleItemId, setView, selectedContactIds, setSelectedContactIds, contacts, message}) => {

    const allSelected = contacts.length > 0 && selectedContactIds.size === contacts.length;

    const toggleContactSelection = (contactId) => {
        setSelectedContactIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contactId)) {
                newSet.delete(contactId);
            } else {
                newSet.add(contactId);
            }
            return newSet;
        });
    };


    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedContactIds(new Set());
        } else {
            setSelectedContactIds(new Set(contacts.map(contact => contact.id)));
        }
    };


    const handleEditClick = (product) => {
        setSelectedSingleItemId(product.id);
        setView('single');
    };

    const columns = [
        { columnLabel: 'ID', dataKey: 'id' },,
        { columnLabel: 'First Name', dataKey: 'firstName' },
        { columnLabel: 'Last Name', dataKey: 'lastName' },
        { columnLabel: 'Email', dataKey: 'email' },
        { columnLabel: 'Date Added', dataKey: 'createdAt' }
    ];


    return (
        <div className="">
            <div className='pagination-labels-cont'>
                <div className='pagination-count'>
                    Showing {contacts.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                </div>
                <div className="pagination-count">
                        {selectedContactIds.size} of {contacts.length} user{contacts.length !== 1 ? 's' : ''} selected
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
                            contacts.length > 0 ? (
                                contacts.map(contact => (
                                    <tr key={contact.id} onClick={() => handleEditClick(contact)}>
                                        <td>
                                            <CustomCheckbox 
                                                name={`checkbox-${contact.id}`}
                                                checked={selectedContactIds.has(contact.id)}
                                                setChecked={() => toggleContactSelection(contact.id)}
                                            />
                                        </td>
                                        {columns.map(column => (
                                            <td key={column.dataKey}>{contact[column.dataKey]}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1}>No contacts found</td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );

};

export default CrudContactList;