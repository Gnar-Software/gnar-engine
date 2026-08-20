import { useEffect, useState } from 'react';
import { tasks } from '../../services/tasks.js';
import { usePagination } from '../../hooks/usePagination.jsx';
import { formatDateTime } from '../../utils/timestampFormatters.js';
import { pageSizeOptions } from '../../config.js';
import { recurringTaskStatusOptions, taskDateOrderOptions } from '../../data/tasksConfig.js';

import ListMany from '../../components/ListMany/ListMany.jsx';
import Paginator from '../../elements/Paginator/Paginator.jsx';
import CustomSelect from '../../elements/CustomSelect/CustomSelect.jsx';
import PaginationTop from '../../elements/PaginationTop/PaginationTop.jsx';

function RecurringTasksPage() {

    const [error, setError] = useState(null);
    const [recurringTasksData, setRecurringTasksData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingRecurringTaskId, setDeletingRecurringTaskId] = useState(null);
    const [refreshCount, setRefreshCount] = useState(0);
    const [selectedRecurringTask, setSelectedRecurringTask] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(recurringTaskStatusOptions[0]);
    const [selectedDateOrder, setSelectedDateOrder] = useState(taskDateOrderOptions[0]);
    const { currentPage, setCurrentPage, pageSize, setPageSize, totalPages, totalResults, setPagination } = usePagination();

    useEffect(() => {
        const fetchRecurringTasks = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const filters = selectedStatus.id ? { status: selectedStatus.id } : {};
                const response = await tasks.getManyRecurring({
                    page: currentPage,
                    pageSize,
                    filters,
                    orderBy: {
                        key: 'nextRunAt',
                        direction: selectedDateOrder.id,
                    },
                });

                setRecurringTasksData(response?.recurringTasks?.data || []);
                setPagination(response?.recurringTasks?.pagination || {});
            } catch (error) {
                setError(error.message);
                console.error('Error fetching recurring tasks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecurringTasks();
    }, [currentPage, pageSize, selectedStatus, selectedDateOrder, refreshCount]);

    const handleDeleteRecurringTask = async (recurringTask) => {
        if (!recurringTask?.id || !window.confirm(`Delete recurring task ${recurringTask.id}?`)) {
            return;
        }

        setDeletingRecurringTaskId(recurringTask.id);
        setError(null);

        try {
            await tasks.removeRecurring(recurringTask.id);
            setSelectedRecurringTask(null);
            setRefreshCount(count => count + 1);
        } catch (error) {
            setError(error.message);
            console.error('Error deleting recurring task:', error);
        } finally {
            setDeletingRecurringTaskId(null);
        }
    };

    const handleRecurringTaskRowClick = ({ rowIndex }) => {
        setSelectedRecurringTask(recurringTasksData[rowIndex] || null);
    };

    return (
        <div>
            <h1>Recurring Tasks</h1>

            <div className="page-action-bar">
                <CustomSelect
                    label='Filter by Status'
                    name='recurring-tasks-status-filter'
                    placeholder={selectedStatus.name}
                    options={recurringTaskStatusOptions}
                    labelKey='name'
                    selectedOption={selectedStatus}
                    setSelectedOption={(option) => {
                        setCurrentPage(1);
                        setSelectedStatus(option);
                    }}
                />
                <CustomSelect
                    label='Order by Next Run Date'
                    name='recurring-tasks-date-order-filter'
                    placeholder={selectedDateOrder.name}
                    options={taskDateOrderOptions}
                    labelKey='name'
                    selectedOption={selectedDateOrder}
                    setSelectedOption={(option) => {
                        setCurrentPage(1);
                        setSelectedDateOrder(option);
                    }}
                />
                <CustomSelect
                    label='Page Size'
                    name='recurring-tasks-page-size-filter'
                    placeholder={`Page size: ${pageSize}`}
                    options={pageSizeOptions.map(size => ({ id: size, name: size }))}
                    labelKey='name'
                    setSelectedOption={(option) => { setCurrentPage(1); setPageSize(option.id) }}
                />
            </div>

            {error && <div className="error-messages">{error}</div>}

            <PaginationTop
                currentCount={recurringTasksData.length}
                totalResults={totalResults}
            />

            <ListMany
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'status', label: 'Status' },
                    { key: 'type', label: 'Type' },
                    { key: 'handler', label: 'Handler' },
                    { key: 'cronExpression', label: 'Cron Expression' },
                    { key: 'startsAt', label: 'Starts', formatter: (value) => value ? formatDateTime(value) : '-' },
                    { key: 'nextRunAt', label: 'Next Run', formatter: (value) => value ? formatDateTime(value) : '-' },
                    { key: 'endsAt', label: 'Ends', formatter: (value) => value ? formatDateTime(value) : '-' },
                    { key: 'idempotencyKey', label: 'Idempotency Key' },
                ]}
                data={recurringTasksData}
                isLoading={isLoading}
                loadingMessage='Loading recurring tasks...'
                onRowClick={handleRecurringTaskRowClick}
                showSelectAll={false}
            />

            <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => { setCurrentPage(page); }}
            />

            {selectedRecurringTask && (
                <div className="task-details-panel">
                    <button className="task-details-close" onClick={() => setSelectedRecurringTask(null)}>x</button>
                    <div className="task-details-actions">
                        <button
                            onClick={() => {
                                if (deletingRecurringTaskId !== selectedRecurringTask.id) {
                                    handleDeleteRecurringTask(selectedRecurringTask);
                                }
                            }}
                        >
                            {deletingRecurringTaskId === selectedRecurringTask.id ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>

                    <h2>Recurring Task</h2>
                    <p><strong>ID:</strong> {selectedRecurringTask.id || '-'}</p>
                    <p><strong>Name:</strong> {selectedRecurringTask.name || '-'}</p>
                    <p><strong>Status:</strong> {selectedRecurringTask.status || '-'}</p>
                    <p><strong>Type:</strong> {selectedRecurringTask.type || '-'}</p>
                    <p><strong>Handler:</strong> {selectedRecurringTask.handler || '-'}</p>
                    <p><strong>Cron Expression:</strong> {selectedRecurringTask.cronExpression || '-'}</p>
                    <p><strong>Starts:</strong> {selectedRecurringTask.startsAt ? formatDateTime(selectedRecurringTask.startsAt) : '-'}</p>
                    <p><strong>Next Run:</strong> {selectedRecurringTask.nextRunAt ? formatDateTime(selectedRecurringTask.nextRunAt) : '-'}</p>
                    <p><strong>Ends:</strong> {selectedRecurringTask.endsAt ? formatDateTime(selectedRecurringTask.endsAt) : '-'}</p>
                    <p><strong>Idempotency Key:</strong> {selectedRecurringTask.idempotencyKey || '-'}</p>
                    <p><strong>Payload:</strong></p>
                    <pre>{JSON.stringify(selectedRecurringTask.payload || {}, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}

export default RecurringTasksPage;
