import { useEffect, useMemo, useState } from 'react';
import ListMany from '../../components/ListMany/ListMany';
import { pages } from '../../services/page.js';
import { useNavigate } from 'react-router-dom';
import { usePagination } from '../../hooks/usePagination.jsx';
import { useTablesColumns } from '../../hooks/useTablesColumns.jsx';
import { pageSizeOptions } from '../../config.js';
import CustomSelect from '../../elements/CustomSelect/CustomSelect';
import CustomMultiSelect from '../../elements/CustomMultiSelect/CustomMultiSelect';
import PaginationTop from '../../elements/PaginationTop/PaginationTop';
import Paginator from '../../elements/Paginator/Paginator';

function PagesPage() {

    const navigate = useNavigate();
    const [pagesData, setPagesData] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { currentPage, setCurrentPage, pageSize, setPageSize, totalPages, totalResults, setTotalPages, setTotalResults } = usePagination();
    const { availableColumns, toggleColumn } = useTablesColumns({ tableKey: 'pages' })

    const paginatedPages = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return pagesData.slice(startIndex, startIndex + pageSize);
    }, [pagesData, currentPage, pageSize]);

    useEffect(() => {
        const fetchPages = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const pagesResponse = await pages.getMany();
                setPagesData(pagesResponse?.pages || []);
            } catch (error) {
                console.error('Error fetching pages:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPages();
    }, []);

    useEffect(() => {
        const nextTotalPages = Math.ceil(pagesData.length / pageSize) || 1;

        setTotalResults(pagesData.length);
        setTotalPages(nextTotalPages);

        if (currentPage > nextTotalPages) {
            setCurrentPage(1);
        }
    }, [pagesData, pageSize, currentPage]);

    const handleRowClick = ({ rowId }) => {
        navigate(`/portal/pages/${rowId}`);
    }

    return (
        <div>
            <div className="flex-row">
                <h1>Manage Pages</h1>
                <div className="top-action-bar">
                    <button onClick={() => { navigate('/portal/pages/new'); }}>Create New Page</button>
                </div>
            </div>

            {error && <div className="error-messages">{error}</div>}

            <div className="page-action-bar">
                <CustomMultiSelect
                    label='Filter by Columns'
                    name='pages-columns-filter'
                    placeholder='Select Columns'
                    labelKey='label'
                    options={availableColumns}
                    selectedOptions={availableColumns.filter(col => col.selected)}
                    setSelectedOption={(option) => toggleColumn(option.key)}
                />
                <CustomSelect
                    name='pages-page-size-filter'
                    placeholder={`Page size: ${pageSize}`}
                    options={pageSizeOptions.map(size => ({ id: size, name: size }))}
                    labelKey='name'
                    setSelectedOption={(option) => { setCurrentPage(1); setPageSize(option.id) }}
                />
            </div>

            <PaginationTop
                currentCount={paginatedPages.length}
                totalResults={totalResults}
            />

            <ListMany
                columns={availableColumns.filter(col => col.selected).map(col => ({ key: col.key, label: col.label }))}
                data={paginatedPages}
                isLoading={isLoading}
                loadingMessage='Loading pages...'
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

export default PagesPage;
