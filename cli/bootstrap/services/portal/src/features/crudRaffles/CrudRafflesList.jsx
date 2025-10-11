import React from 'react';
import CustomCheckbox from '../../ui/customCheckbox/CustomCheckbox';

const CrudRafflesList = ({ setSelectedSingleItemId, setView, selectedRaffleIds, setSelectedRaffleIds, raffles, message }) => {

    const allSelected = raffles.length > 0 && selectedRaffleIds.size === raffles.length;

    const toggleContactSelection = (raffleId) => {
        setSelectedRaffleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(raffleId)) {
                newSet.delete(raffleId);
            } else {
                newSet.add(raffleId);
            }
            return newSet;
        });
    };


    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedRaffleIds(new Set());
        } else {
            setSelectedRaffleIds(new Set(raffles.map(raffle => raffle.id)));
        }
    };

    const handleEditClick = (raffle) => {
        setSelectedSingleItemId(raffle.id);
        setView('single');
    };

    const columns = [
        { columnLabel: 'Raffle', dataKey: 'id' },
        { columnLabel: 'Name', dataKey: 'name' },
        { columnLabel: 'Date added', dataKey: 'created_at' },
    ];


    return (
        <div className="">
            <div className='pagination-labels-cont'>
                <div className='pagination-count'>
                    Showing {raffles.length} of {raffles.length} raffle{raffles.length !== 1 ? 's' : ''}
                </div>
                <div className="pagination-count">
                        {selectedRaffleIds.size} of {raffles.length} raffle{raffles.length !== 1 ? 's' : ''} selected
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
                            raffles.length > 0 ? (
                                raffles.map(raffle => (
                                    <tr key={raffle.id} onClick={() => handleEditClick(raffle)}>
                                        <td>
                                            <CustomCheckbox 
                                                name={`checkbox-${raffle.id}`}
                                                checked={selectedRaffleIds.has(raffle.id)}
                                                setChecked={() => toggleContactSelection(raffle.id)}
                                            />
                                        </td>
                                        {columns.map(column => (
                                            <td key={column.dataKey}>{raffle[column.dataKey]}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1}>No raffles found</td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );

};

export default CrudRafflesList;