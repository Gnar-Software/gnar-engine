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
    const { availableColumns, toggleColumn, orderBy, orderByParam, setOrderByColumn } = useTablesColumns({
        tableKey: 'users',
        availableColumns: [
            { id: 1, key: 'id', label: 'ID', selected: true },
            { id: 2, key: 'username', label: 'Username', selected: true },
            { id: 3, key: 'email', label: 'Email', selected: true },
            { id: 4, key: 'role', label: 'Role', selected: true },
        ],
        filters: [],
        orderBy: { key: '', direction: 'ASC' },
    });

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

    // Handle row click to navigate to lease details page
    const handleRowClick = ({ leaseId }) => {
        navigate(`${userId}`);
    }

    return (
        <div>
            <h1>Manage Users</h1>

            <div>
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

            <PaginationTop
                currentCount={usersData.length}
                totalResults={totalResults}
            />

            <ListMany
                columns={[
                    { key: 'id', label: 'ID' },
                    { key: 'username', label: 'Username' },
                    { key: 'email', label: 'Email' },
                    { key: 'role', label: 'Role' }
                ]}
                data={usersData}
                onRowClick={({ rowId }) => handleRowClick({ userId: rowId })}
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
