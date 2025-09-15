import React, { useState, useEffect } from 'react';
import gnarEngine from '@gnar-engine/js-client';
import dotsVertical from '../../assets/dots-vertical.svg';
import CustomCheckbox from '../../ui/customCheckbox/CustomCheckbox';

const CrudUserList = ({ setSelectedSingleItemId, setView, selectedUserIds, setSelectedUserIds, users, message }) => {

    const allSelected = users.length > 0 && selectedUserIds.size === users.length;

    const handleEditClick = (user) => {
        setSelectedSingleItemId(user.id);
        setView('single');
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };


    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(users.map(user => user.id)));
        }
    };
    

    const columns = [
        { columnLabel: 'ID', dataKey: 'id' },
        { columnLabel: 'Username', dataKey: 'username' },
        { columnLabel: 'Email', dataKey: 'email' },
        { columnLabel: 'User Role', dataKey: 'userRole' },
        { columnLabel: 'Date Added', dataKey: 'createdAt' }
    ];

    return (
        <div className="">
            <div className='pagination-labels-cont'>
                <div className='pagination-count'>
                    Showing {users.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                </div>
                <div className="pagination-count">
                    {selectedUserIds.size} of {users.length} user{users.length !== 1 ? 's' : ''} selected
                </div>
            </div>

            <div className='crud-list'>
                <table className='custom-table'>
                    <thead>
                        <tr>
                            <th className="checkbox">
                                <CustomCheckbox
                                    name="select-all"
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
                            users.length > 0 ? (
                                users.map(user => (
                                    <tr key={user.id} onClick={() => handleEditClick(user)}>
                                        <td onClick={(e) => e.stopPropagation()}>
                                        <CustomCheckbox
                                            name={`checkbox-${user.id}`}
                                            checked={selectedUserIds.has(user.id)}
                                            setChecked={() => toggleUserSelection(user.id)}
                                        />
                                        </td>
                                        {columns.map(column => (
                                            <td key={column.dataKey}>{user[column.dataKey]}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1}>No users found</td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CrudUserList;
