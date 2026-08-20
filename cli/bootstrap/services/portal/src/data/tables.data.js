// Table data
// Configure default available columns for the tables in the application

export const tablesConfig = {
    users: {
        availableColumns: [
            { id: 1, key: 'id', label: 'ID', selected: true },
            { id: 2, key: 'username', label: 'Username', selected: true },
            { id: 3, key: 'email', label: 'Email', selected: true },
            { id: 4, key: 'role', label: 'Role', selected: true },
        ],
        filters: [],
        orderBy: { key: '', direction: 'ASC' },
    },
    pages: {
        availableColumns: [
            { id: 1, key: 'id', label: 'ID', selected: true },
            { id: 2, key: 'name', label: 'Page name', selected: true },
        ],
        filters: [],
        orderBy: { key: '', direction: 'ASC' },
    },
    blocks: {
        availableColumns: [
            { id: 1, key: 'id', label: 'ID', selected: true },
            { id: 2, key: 'name', label: 'Block name', selected: true },
        ],
        filters: [],
        orderBy: { key: '', direction: 'ASC' },
    }
}
