export const tablesConfig = {
    users: {
        availableColumns: [
            { id: 1, key: 'id', label: 'ID', selected: true },
            { id: 2, key: 'username', label: 'Username', selected: true },
            { id: 3, key: 'email', label: 'Email', selected: true },
            { id: 4, key: 'firstName', label: 'First Name', selected: false },
            { id: 5, key: 'lastName', label: 'Last Name', selected: false },
            { id: 6, key: 'role', label: 'Role', selected: true },
        ],
        filters: [],
        orderBy: { key: '', direction: 'asc' },
    },
    pages: {
        availableColumns: [
            { id: 1, key: 'id', label: 'ID', selected: false },
            { id: 2, key: 'name', label: 'Name', selected: true },
            { id: 3, key: 'key', label: 'Key', selected: true },
        ],
        filters: [],
        orderBy: { key: '', direction: 'asc' },
    },
    blocks: {
        availableColumns: [
            { id: 1, key: 'id', label: 'ID', selected: false },
            { id: 2, key: 'name', label: 'Name', selected: true },
            { id: 3, key: 'type', label: 'Type', selected: true },
        ],
        filters: [],
        orderBy: { key: '', direction: 'asc' },
    },
};
