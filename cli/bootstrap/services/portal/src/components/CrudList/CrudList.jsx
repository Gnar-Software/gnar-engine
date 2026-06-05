import React, { useEffect, useState } from 'react';
import { usePaginate } from '../../hooks/usePaginate.jsx';
import { useTablesColumns } from '../../hooks/useTablesColumns.jsx';
import { pageSizeOptions } from '../../data/paginationConfig.js';
import ListMany from '../ListMany/ListMany.jsx';
import Paginator from '../../elements/Paginator/Paginator.jsx';
import ActionLink from '../../elements/ActionLink/ActionLink.jsx';
import CustomSelect from '../../elements/CustomSelect/CustomSelect.jsx';
import CustomMultiSelect from '../../elements/CustomMultiSelect/CustomMultiSelect.jsx';
import PageActionsBar from '../PageActionsBar/PageActionsBar.jsx';

function CrudList({
    entityKey,
    fetchData,
    entitySingleName,
    entityPluralName,
    columns
}) {
    const [items, setItems] = useState([]);
    const {
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        totalPages,
        setTotalPages,
        calculateTotalPages
    } = usePaginate();
    const { availableColumns, toggleColumn } = useTablesColumns({ tableKey: entityKey });
    const configuredColumns = availableColumns?.length ? availableColumns : columns.map((col, index) => ({
        id: index + 1,
        ...col,
        selected: true
    }));

    useEffect(() => {
        (async () => {
            try {
                const response = await fetchData({ page: currentPage, pageSize });
                const list = Array.isArray(response?.[entityKey])
                    ? response[entityKey]
                    : response?.[entityKey]?.data || response?.data || [];
                const pagination = response?.[entityKey]?.pagination || response?.pagination || {};

                setItems(list);
                setTotalPages(calculateTotalPages(pagination) || 1);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        })();
    }, [entityKey, currentPage, pageSize]);

    const navigateToCrudSingle = ({ rowId }) => {
        window.location.href = `/portal/${entityKey}/${rowId}`;
    };

    const selectedColumns = configuredColumns
        .filter(col => col.selected)
        .map(col => ({ key: col.key, label: col.label }));

    return (
        <div className="crud-list">
            <PageActionsBar>
                <ActionLink
                    handleClick={() => { window.location.href = `/portal/${entityKey}/new`; }}
                    label={`+ Create New ${entitySingleName}`}
                />
                <CustomMultiSelect
                    name={`${entityKey}-columns-filter`}
                    placeholder="Columns"
                    labelKey="label"
                    options={configuredColumns}
                    selectedOptions={selectedColumns}
                    setSelectedOption={(option) => toggleColumn(option.key)}
                />
                <CustomSelect
                    name={`${entityKey}-page-size`}
                    placeholder={`Page size: ${pageSize}`}
                    options={pageSizeOptions.map(size => ({ id: size, name: size }))}
                    labelKey="name"
                    setSelectedOption={(option) => { setCurrentPage(1); setPageSize(option.id); }}
                />
            </PageActionsBar>

            <ListMany
                columns={selectedColumns}
                data={items}
                onRowClick={navigateToCrudSingle}
                showSelectAll={false}
            />

            <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}

export default CrudList;
