import { useEffect, useMemo, useState } from 'react';
import ListMany from '../../components/ListMany/ListMany';
import { blocks } from '../../services/block.js';
import { useNavigate } from 'react-router-dom';
import { usePagination } from '../../hooks/usePagination.jsx';
import { useTablesColumns } from '../../hooks/useTablesColumns.jsx';
import { pageSizeOptions } from '../../config.js';
import CustomSelect from '../../elements/CustomSelect/CustomSelect';
import CustomMultiSelect from '../../elements/CustomMultiSelect/CustomMultiSelect';
import PaginationTop from '../../elements/PaginationTop/PaginationTop';
import Paginator from '../../elements/Paginator/Paginator';

function BlocksPage() {

    const navigate = useNavigate();
    const [blocksData, setBlocksData] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { currentPage, setCurrentPage, pageSize, setPageSize, totalPages, totalResults, setTotalPages, setTotalResults } = usePagination();
    const { availableColumns, toggleColumn } = useTablesColumns({ tableKey: 'blocks' })

    const paginatedBlocks = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return blocksData.slice(startIndex, startIndex + pageSize);
    }, [blocksData, currentPage, pageSize]);

    useEffect(() => {
        const fetchBlocks = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const blocksResponse = await blocks.getMany();
                setBlocksData(blocksResponse?.blocks || []);
            } catch (error) {
                console.error('Error fetching blocks:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlocks();
    }, []);

    useEffect(() => {
        const nextTotalPages = Math.ceil(blocksData.length / pageSize) || 1;

        setTotalResults(blocksData.length);
        setTotalPages(nextTotalPages);

        if (currentPage > nextTotalPages) {
            setCurrentPage(1);
        }
    }, [blocksData, pageSize, currentPage]);

    const handleRowClick = ({ rowId }) => {
        navigate(`/portal/blocks/${rowId}`);
    }

    return (
        <div>
            <div className="flex-row">
                <h1>Manage Blocks</h1>
                <div className="top-action-bar">
                    <button onClick={() => { navigate('/portal/blocks/new'); }}>Create New Block</button>
                </div>
            </div>

            {error && <div className="error-messages">{error}</div>}

            <div className="page-action-bar">
                <CustomMultiSelect
                    label='Filter by Columns'
                    name='blocks-columns-filter'
                    placeholder='Select Columns'
                    labelKey='label'
                    options={availableColumns}
                    selectedOptions={availableColumns.filter(col => col.selected)}
                    setSelectedOption={(option) => toggleColumn(option.key)}
                />
                <CustomSelect
                    name='blocks-page-size-filter'
                    placeholder={`Page size: ${pageSize}`}
                    options={pageSizeOptions.map(size => ({ id: size, name: size }))}
                    labelKey='name'
                    setSelectedOption={(option) => { setCurrentPage(1); setPageSize(option.id) }}
                />
            </div>

            <PaginationTop
                currentCount={paginatedBlocks.length}
                totalResults={totalResults}
            />

            <ListMany
                columns={availableColumns.filter(col => col.selected).map(col => ({ key: col.key, label: col.label }))}
                data={paginatedBlocks}
                isLoading={isLoading}
                loadingMessage='Loading blocks...'
                onRowClick={handleRowClick}
                showSelectAll={false}
            />

            <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => { setCurrentPage(page); }}
            />
        </div>
    )
}

export default BlocksPage;
