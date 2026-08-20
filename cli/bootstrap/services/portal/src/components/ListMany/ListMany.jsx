import { useEffect, useRef, useState } from 'react';


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
 * @param {Boolean} defaultSelectAll - Select all rows when data changes (default: false)
 * @param {Boolean} isLoading - Show a loading state in the table body (default: false)
 * @param {String} loadingMessage - Loading message shown in the table body
 * @param {String|Number} selectionResetKey - Reset default selection when this value changes
 * @param {Array} selectedRowIds - Optional controlled list of row ids to show as selected
 * @param {String} rowKey - Row key used with selectedRowIds
 * @param {String} classNames - Additional CSS class names for the component ( default: '' )
 * @param {Object} orderBy - Active order by: { key, direction: 'ASC' | 'DESC' }
 * @param {Function} onColumnHeaderClick - Callback when a sortable header is clicked: (columnKey) => {}
 */
export default function ListMany({
    columns = [],
    data = [],
    onSelectionChange,
    onRowClick,
    showSelectAll = true,
    defaultSelectAll = false,
    isLoading = false,
    loadingMessage = 'Loading...',
    selectionResetKey = data,
    selectedRowIds = null,
    rowKey = 'id',
    classNames = '',
    orderBy = null,
    onColumnHeaderClick = null,
}) {
    const [selectedRows, setSelectedRows] = useState(new Set());
    const scrollRef = useRef(null);
    const dragState = useRef({ active: false, dragged: false, startX: 0, startScrollLeft: 0 });

    const selectedRowsRef = useRef(selectedRows);

    useEffect(() => {
        selectedRowsRef.current = selectedRows;
    }, [selectedRows]);

    // Some workflows, like AP payment creation, need rows selected by default
    // when fresh data is loaded. selectionResetKey lets the parent intentionally
    // replay that default selection without tying it to every render of data.
    useEffect(() => {
        if (Array.isArray(selectedRowIds)) {
            return;
        }

        if (!defaultSelectAll || !data.length) {
            if (!selectedRowsRef.current.size) {
                return;
            }

            const emptySelection = new Set();
            selectedRowsRef.current = emptySelection;
            setSelectedRows(emptySelection);

            if (onSelectionChange) {
                onSelectionChange([]);
            }

            return;
        }

        const allIndexes = new Set(data.map((_, index) => index));
        const isAlreadySelected = selectedRowsRef.current.size === allIndexes.size
            && data.every((_, index) => selectedRowsRef.current.has(index));

        if (isAlreadySelected) {
            return;
        }

        selectedRowsRef.current = allIndexes;
        setSelectedRows(allIndexes);

        if (onSelectionChange) {
            onSelectionChange(data);
        }
    }, [selectionResetKey, defaultSelectAll, selectedRowIds]);

    useEffect(() => {
        if (!Array.isArray(selectedRowIds)) {
            return;
        }

        // Mirror parent-controlled selection onto row indexes used by the table checkboxes.
        const selectedIds = new Set(selectedRowIds);
        setSelectedRows(new Set(data
            .map((row, index) => selectedIds.has(row[rowKey]) ? index : null)
            .filter(index => index !== null)
        ));
    }, [selectedRowIds, data, rowKey]);

    // Handle individual row selection
    const handleRowSelect = (rowIndex) => {
        const newSelected = new Set(selectedRows);

        if (newSelected.has(rowIndex)) {
            newSelected.delete(rowIndex);
        } else {
            newSelected.add(rowIndex);
        }

        selectedRowsRef.current = newSelected;
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
            const emptySelection = new Set();
            selectedRowsRef.current = emptySelection;
            setSelectedRows(emptySelection);

            if (onSelectionChange) {
                onSelectionChange([]);
            }
        } else {
            // Select all
            const allIndexes = new Set(data.map((_, index) => index));
            selectedRowsRef.current = allIndexes;
            setSelectedRows(allIndexes);

            if (onSelectionChange) {
                onSelectionChange(data);
            }
        }
    };


    // Wide tables can be scrolled horizontally with Ctrl + click and drag,
    // as an alternative to the bottom scrollbar.
    const handleScrollMouseDown = (event) => {
        dragState.current.dragged = false;

        if (!event.ctrlKey || !scrollRef.current) {
            return;
        }

        dragState.current = {
            active: true,
            dragged: false,
            startX: event.pageX,
            startScrollLeft: scrollRef.current.scrollLeft,
        };
        scrollRef.current.classList.add('drag-scrolling');
        event.preventDefault();
    };

    const handleScrollMouseMove = (event) => {
        if (!dragState.current.active || !scrollRef.current) {
            return;
        }

        dragState.current.dragged = true;
        scrollRef.current.scrollLeft = dragState.current.startScrollLeft - (event.pageX - dragState.current.startX);
    };

    const stopScrollDrag = () => {
        dragState.current.active = false;
        scrollRef.current?.classList.remove('drag-scrolling');
    };

    // Suppress the click that fires at the end of a ctrl + drag scroll
    const handleCellClick = (row, rowIndex) => {
        if (dragState.current.dragged) {
            return;
        }

        onRowClick({ rowId: row.id, rowIndex });
    };


    const isAllSelected = selectedRows.size === data.length && data.length > 0;
    const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length;
    const tableColumnCount = columns.length + (showSelectAll ? 1 : 0);

    return (
        <div
            className={`many-details ${classNames}`}
            ref={scrollRef}
            onMouseDown={handleScrollMouseDown}
            onMouseMove={handleScrollMouseMove}
            onMouseUp={stopScrollDrag}
            onMouseLeave={stopScrollDrag}
        >
            <table className="many-details-table">
                <thead>
                    <tr>
                        {showSelectAll && (
                            <th className={`select-all-column ${classNames ?? ''}`}>
                                {data.length > 0 && (
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
                        )}
                        {columns.map((column, index) => {
                            // Joined/computed columns can point sorting at a real orderable
                            // column via sortKey
                            const sortKey = column.sortKey || column.key;
                            // A column is sortable when a handler is provided and the column
                            // does not opt out (e.g. computed columns with no backing db field).
                            const isSortable = typeof onColumnHeaderClick === 'function' && column.sortable !== false;
                            const isSorted = isSortable && orderBy?.key === sortKey;

                            return (
                                <th
                                    key={column.key || index}
                                    className={`${column.classNames ?? ''} ${isSortable ? 'sortable-column' : ''} ${isSorted ? 'sorted-column' : ''}`}
                                    onClick={isSortable ? () => onColumnHeaderClick(sortKey) : undefined}
                                >
                                    {column.label}
                                    {isSorted &&
                                        <span className={`sort-chevron ${orderBy.direction === 'DESC' ? 'descending' : 'ascending'}`}>
                                            {orderBy.direction === 'DESC' ? '▾' : '▴'}
                                        </span>
                                    }
                                    {column.header &&
                                        <div className="column-header-extra">
                                            {column.header}
                                        </div>
                                    }
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={tableColumnCount} className="loading-state">
                                {loadingMessage}
                            </td>
                        </tr>
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={tableColumnCount} className="empty-state">
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
                                {showSelectAll &&
                                    <td className="select-row-column">
                                        <label className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={selectedRows.has(rowIndex)}
                                                onChange={() => handleRowSelect(rowIndex)}
                                            />
                                        </label>
                                    </td>
                                }
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={column.key || colIndex}
                                        data-column={column.key}
                                        onClick={() => handleCellClick(row, rowIndex)}
                                        className={`${column.classNames ?? ''}`}
                                    >

                                        {/* Currency columns get the calculator-style money input, which formats to two decimals on entry */}
                                        {column.type === 'input' ?
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
