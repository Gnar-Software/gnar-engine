import { useNavigate, useParams } from 'react-router-dom';
import { user } from '../../services/user.js';
import { useState, useEffect } from 'react';
import { usePagination } from '../../hooks/usePagination.jsx';
import { useTablesColumns } from '../../hooks/useTablesColumns.jsx';
import { pageSizeOptions } from '../../config.js';
import CustomSelect from '../../elements/CustomSelect/CustomSelect'
import CustomMultiSelect from '../../elements/CustomMultiSelect/CustomMultiSelect';
import PaginationTop from '../../elements/PaginationTop/PaginationTop';
import Paginator from '../../elements/Paginator/Paginator';
import ListMany from '../../components/ListMany/ListMany';

function UsersPage() {

    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [usersData, setUsersData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { currentPage, setCurrentPage, pageSize, setPageSize, totalPages, totalResults, setPagination } = usePagination();
    const { availableColumns, toggleColumn, orderBy, orderByParam, setOrderByColumn } = useTablesColumns({ tableKey: 'users' })

    // Fetch users with pagination
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await user.getMany({
                    page: currentPage,
                    pageSize,
                    orderBy: orderByParam,
                });
                const data = response?.users?.data || [];

                setUsersData(data);
                setPagination(response?.users?.pagination || {});

            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Request aborted');
                    return;
                }
                setError(error.message);
                console.error('Error fetching users:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();

    }, [currentPage, pageSize, orderByParam]);

    // Handle row click to navigate to single user page
    const handleRowClick = ({ rowId }) => {
        navigate(`/portal/users/${rowId}`);
    }

    return (
        <div>
            <div className="flex-row">
                <h1>Manage Users</h1>
                <div className="page-action-bar">
                    <CustomMultiSelect
                        label='Filter by Columns'
                        name='users-columns-filter'
                        placeholder='Select Columns'
                        labelKey='label'
                        options={availableColumns}
                        selectedOptions={availableColumns.filter(col => col.selected)}
                        setSelectedOption={(option) => toggleColumn(option.key)}
                    />
                    <CustomSelect
                        label='Page Size'
                        name='users-page-size-filter'
                        placeholder={`Page size: ${pageSize}`}
                        options={pageSizeOptions.map(size => ({ id: size, name: size }))}
                        labelKey='name'
                        setSelectedOption={(option) => { setCurrentPage(1); setPageSize(option.id) }}
                    />
                </div>
            </div>

            <PaginationTop
                currentCount={usersData.length}
                totalResults={totalResults}
            />

            <ListMany
                columns={availableColumns.filter(col => col.selected).map(col => ({ key: col.key, label: col.label }))}
                data={usersData}
                isLoading={isLoading}
                loadingMessage='Loading users...'
                orderBy={orderBy}
                onColumnHeaderClick={setOrderByColumn}
                onRowClick={handleRowClick}
            />

            <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => { setCurrentPage(page); }}
            />
        </div>
    )
}

export default UsersPage;
