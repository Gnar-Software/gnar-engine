import { useState } from 'react';

/**
 * ListMany Component
 * 
 * A data table component with row selection via checkboxes
 * You will need to match the key properties in columns and data props, in order for data to display correctly.
 * 
 * @param {Array} columns - Array of column objects: [{ key: 'id', label: 'ID', formatter: () => {} }, { key: 'name', label: 'Name' }]
 * @param {Array} data - Array of row objects: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
 * @param {Function} onSelectionChange - Callback when selection changes: (selectedRows) => {}
 * @param {Function} onRowClick - Callback when a row is clicked: ({ rowId, rowIndex }) => {}
 * @param {Boolean} showSelectAll - Show "select all" checkbox in header (default: true)
 * @param {String} classNames - Additional CSS class names for the component ( default: '' )
 */
export default function ListMany({
    columns = [],
    data = [],
    onSelectionChange,
    onRowClick,
    showSelectAll = true,
    classNames = '',
}) {
    const [selectedRows, setSelectedRows] = useState(new Set());

    // Handle individual row selection
    const handleRowSelect = (rowIndex) => {
        const newSelected = new Set(selectedRows);

        if (newSelected.has(rowIndex)) {
            newSelected.delete(rowIndex);
        } else {
            newSelected.add(rowIndex);
        }

        setSelectedRows(newSelected);

        // Call callback with selected row data
        if (onSelectionChange) {
            const selectedData = Array.from(newSelected).map(index => data[index]);
            onSelectionChange(selectedData);
        }
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedRows.size === data.length) {
            // Deselect all
            setSelectedRows(new Set());
            if (onSelectionChange) {
                onSelectionChange([]);
            }
        } else {
            // Select all
            const allIndexes = new Set(data.map((_, index) => index));
            setSelectedRows(allIndexes);
            if (onSelectionChange) {
                onSelectionChange(data);
            }
        }
    };

    const isAllSelected = selectedRows.size === data.length && data.length > 0;
    const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length;

    return (
        <div className={`many-details ${classNames}`}>
            <table className="many-details-table">
                <thead>
                    <tr>
                        <th className={`${classNames ?? ''}`}>
                            {showSelectAll && data.length > 0 && (
                                <label className="checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        className={`checkbox-input ${isSomeSelected ? 'indeterminate' : ''}`}
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                    />
                                </label>
                            )}
                        </th>
                        {columns.map((column, index) => (
                            <th
                                key={column.key || index}
                                className={column.classNames ?? ''}
                            >
                                {column.label}
                                {column.header &&
                                    <div className="column-header-extra">
                                        {column.header}
                                    </div>
                                }
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + 1} className="empty-state">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={selectedRows.has(rowIndex) ? 'selected' : ''}
                            >
                                {/* The first column is the checkbox if the showSelectAll is true */}
                                <td>
                                    {showSelectAll &&
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={selectedRows.has(rowIndex)}
                                                onChange={() => handleRowSelect(rowIndex)}
                                            />
                                        </label>
                                    }
                                </td>
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={column.key || colIndex}
                                        data-column={column.key}
                                        onClick={() => onRowClick({ rowId: row.id, rowIndex })}
                                        className={`${column.classNames ?? ''}`}
                                    >

                                        {/* If the column has a type and that type is input, render an input field with onChange callback that comes from the column as well */}
                                        {column.type && column.type === 'input'
                                            ?
                                            <input
                                                type='text'
                                                value={row[column.key] ?? ''}
                                                onChange={(e) => column?.onChange({ rowId: row.id, columnKey: column.key, value: e.target.value })}
                                                className='table-cell-input'
                                            />
                                            :
                                            <>
                                                {/* if there is a formatter function for this column, use it */}
                                                {column.formatter ? column.formatter(row[column.key]) : (row[column.key] ?? '-')}
                                            </>
                                        }

                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
