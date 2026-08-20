export const formatDateTime = (timestamp) => {
    if (!timestamp) {
        return null;
    }

    const date = new Date(timestamp);

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
