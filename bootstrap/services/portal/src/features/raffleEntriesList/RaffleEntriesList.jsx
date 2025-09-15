import React from 'react';
import CustomCheckbox from '../../ui/customCheckbox/CustomCheckbox';

const RaffleEntriesList = ({setSelectedSingleItemId, setView, selectedEntryIds, setSelectedEntryIds, raffleEntries, message }) => {

    const allSelected = raffleEntries.length > 0 && selectedEntryIds.size === raffleEntries.length;

    const toggleEntrySelection = (entryId) => {
        setSelectedEntryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) {
                newSet.delete(entryId);
            } else {
                newSet.add(entryId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedEntryIds(new Set());
        } else {
            setSelectedEntryIds(new Set(raffleEntries.map(entry => entry.id)));
        }
    };

    const columns = [
        { columnLabel: 'Name', dataKey: 'user_name' },
        { columnLabel: 'Entry ID', dataKey: 'entry_id' },
        { columnLabel: 'Email', dataKey: 'user_email' },
        { columnLabel: 'Order ID', dataKey: 'order_id' },
        { columnLabel: 'Subscription ID', dataKey: 'subscription_id' },
        { columnLabel: 'Multiplier', dataKey: 'multiplier' }
    ];

    return (
        <div className="">
            <div className='pagination-labels-cont'>
                <div className='pagination-count'>
                    Showing {raffleEntries.length} of {raffleEntries.length} raffle entr{raffleEntries.length !== 1 ? 'ies' : 'y'}
                </div>
                <div className="pagination-count">
                    {selectedEntryIds.size} of {raffleEntries.length} selected
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
                            <th key={column.dataKey}>{column.columnLabel}</th>
                        ))}
                        </tr>
                    </thead>

                    <tbody>
                        {message ? (
                            <tr>
                                <td colSpan={columns.length + 1}>{message}</td>
                            </tr>
                        ) : (
                            raffleEntries.length > 0 ? (
                                raffleEntries.map(entry => (
                                    <tr key={entry.id}>
                                        <td>
                                            <CustomCheckbox
                                                name={`checkbox-${entry.id}`}
                                                checked={selectedEntryIds.has(entry.id)}
                                                setChecked={() => toggleEntrySelection(entry.id)}
                                            />
                                        </td>
                                        {columns.map(column => (
                                            <td key={column.dataKey}>{entry[column.dataKey]}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1}>{message}</td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RaffleEntriesList;
