import React from 'react';

const Pagination = ({ numPages, currentPage, setCurrentPage }) => {
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="pagination">
            {Array.from({ length: numPages }, (_, i) => (
                <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    disabled={currentPage === i + 1}
                >
                    {i + 1}
                </button>
            ))}
        </div>
    );
};

export default Pagination;
