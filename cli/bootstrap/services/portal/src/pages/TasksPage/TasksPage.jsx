import { useEffect, useMemo, useState } from 'react';
import { tasks } from '../../services/tasks.js';
import { usePagination } from '../../hooks/usePagination.jsx';
import { formatDateTime } from '../../utils/timestampFormatters.js';
import { pageSizeOptions } from '../../config.js';
import { taskDateOrderOptions, taskStatusOptions } from '../../data/tasksConfig.js';

import ListMany from '../../components/ListMany/ListMany.jsx';
import Paginator from '../../elements/Paginator/Paginator.jsx';
import CustomSelect from '../../elements/CustomSelect/CustomSelect.jsx';
import PaginationTop from '../../elements/PaginationTop/PaginationTop.jsx';

function TasksPage() {

    const [error, setError] = useState(null);
    const [tasksData, setTasksData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState(null);
    const [refreshCount, setRefreshCount] = useState(0);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(taskStatusOptions[0]);
    const [selectedDateOrder, setSelectedDateOrder] = useState(taskDateOrderOptions[0]);
    const { currentPage, setCurrentPage, pageSize, setPageSize, totalPages, totalResults, setTotalPages, setTotalResults } = usePagination();

    const paginatedTasks = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return tasksData.slice(startIndex, startIndex + pageSize);
    }, [tasksData, currentPage, pageSize]);

    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await tasks.getMany({
                    status: selectedStatus.id,
                    orderDirection: selectedDateOrder.id,
                });
                setTasksData(response?.tasks || []);
            } catch (error) {
                setError(error.message);
                console.error('Error fetching tasks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [selectedStatus, selectedDateOrder, refreshCount]);

    useEffect(() => {
        const nextTotalPages = Math.ceil(tasksData.length / pageSize) || 1;

        setTotalResults(tasksData.length);
        setTotalPages(nextTotalPages);

        if (currentPage > nextTotalPages) {
            setCurrentPage(1);
        }
    }, [tasksData, pageSize, currentPage]);

    const handleDeleteTask = async (taskObj) => {
        if (!taskObj?.id || !window.confirm(`Delete task ${taskObj.id}?`)) {
            return;
        }

        setDeletingTaskId(taskObj.id);
        setError(null);

        try {
            await tasks.remove(taskObj.id);
            setSelectedTask(null);
            setRefreshCount(count => count + 1);
        } catch (error) {
            setError(error.message);
            console.error('Error deleting task:', error);
        } finally {
            setDeletingTaskId(null);
        }
    };

    const handleTaskRowClick = ({ rowIndex }) => {
        setSelectedTask(paginatedTasks[rowIndex] || null);
    };

    return (
        <div>
            <h1>Tasks</h1>

            <div className="page-action-bar">
                <CustomSelect
                    label='Filter by Status'
                    name='tasks-status-filter'
                    placeholder={selectedStatus.name}
                    options={taskStatusOptions}
                    labelKey='name'
                    selectedOption={selectedStatus}
                    setSelectedOption={(option) => {
                        setCurrentPage(1);
                        setSelectedStatus(option);
                    }}
                />
                <CustomSelect
                    label='Order by Scheduled Date'
                    name='tasks-date-order-filter'
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
                    name='tasks-page-size-filter'
                    placeholder={`Page size: ${pageSize}`}
                    options={pageSizeOptions.map(size => ({ id: size, name: size }))}
                    labelKey='name'
                    setSelectedOption={(option) => { setCurrentPage(1); setPageSize(option.id) }}
                />
            </div>

            {error && <div className="error-messages">{error}</div>}

            <PaginationTop
                currentCount={paginatedTasks.length}
                totalResults={totalResults}
            />

            <ListMany
                columns={[
                    { key: 'name', label: 'Name' },
                    { key: 'status', label: 'Status' },
                    { key: 'handler', label: 'Handler' },
                    { key: 'scheduled', label: 'Scheduled', formatter: (value) => value ? formatDateTime(value) : '-' },
                    { key: 'retryAttempts', label: 'Retries' },
                    { key: 'idempotencyKey', label: 'Idempotency Key' },
                    { key: 'createdAt', label: 'Created', formatter: (value) => value ? formatDateTime(value) : '-' },
                ]}
                data={paginatedTasks}
                isLoading={isLoading}
                loadingMessage='Loading tasks...'
                onRowClick={handleTaskRowClick}
                showSelectAll={false}
            />

            <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => { setCurrentPage(page); }}
            />

            {selectedTask && (
                <div className="task-details-panel">
                    <button className="task-details-close" onClick={() => setSelectedTask(null)}>x</button>
                    <div className="task-details-actions">
                        <button
                            onClick={() => {
                                if (deletingTaskId !== selectedTask.id) {
                                    handleDeleteTask(selectedTask);
                                }
                            }}
                        >
                            {deletingTaskId === selectedTask.id ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>

                    <h2>Task</h2>
                    <p><strong>ID:</strong> {selectedTask.id || '-'}</p>
                    <p><strong>Name:</strong> {selectedTask.name || '-'}</p>
                    <p><strong>Status:</strong> {selectedTask.status || '-'}</p>
                    <p><strong>Handler:</strong> {selectedTask.handler || '-'}</p>
                    <p><strong>Scheduled:</strong> {selectedTask.scheduled ? formatDateTime(selectedTask.scheduled) : '-'}</p>
                    <p><strong>Retries:</strong> {selectedTask.retryAttempts ?? '-'}</p>
                    <p><strong>Recurring Task ID:</strong> {selectedTask.recurringTaskId || '-'}</p>
                    <p><strong>Idempotency Key:</strong> {selectedTask.idempotencyKey || '-'}</p>
                    <p><strong>Created:</strong> {selectedTask.createdAt ? formatDateTime(selectedTask.createdAt) : '-'}</p>
                    <p><strong>Payload:</strong></p>
                    <pre>{JSON.stringify(selectedTask.payload || {}, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}

export default TasksPage;
