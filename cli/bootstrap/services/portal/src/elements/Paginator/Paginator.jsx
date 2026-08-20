export default function Paginator({
    currentPage,
    totalPages,
    onPageChange
}) {

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;


        if (totalPages <= maxVisible) {
            // Show all pages if total is 5 or less
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            let start, end;

            if (currentPage <= 3) {
                // Near the beginning
                start = 2;
                end = 4;
            } else if (currentPage >= totalPages - 2) {
                // Near the end
                start = totalPages - 3;
                end = totalPages - 1;
            } else {
                // In the middle
                start = currentPage - 1;
                end = currentPage + 1;
            }

            // Add ellipsis if needed
            if (start > 2) {
                pages.push('...');
            }

            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis if needed
            if (end < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    const handlePageClick = (page) => {
        if (page !== '...' && page !== currentPage) {
            onPageChange(page);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    if (totalPages <= 1) {
        return null;
    }

    const pageNumbers = getPageNumbers();

    return (
        <div className="paginator">
            <span
                className={`paginator-next previous ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={handlePrevious}
                disabled={currentPage === 1}
            >
                Previous
            </span>

            <div className="paginator-pages">
                {pageNumbers.map((page, index) => (
                    <button
                        key={index}
                        className={`paginator-page ${page === currentPage ? 'active' : ''
                            } ${page === '...' ? 'ellipsis' : ''}`}
                        onClick={() => handlePageClick(page)}
                        disabled={page === '...'}
                        aria-label={page === '...' ? 'More pages' : `Page ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <span
                className={`paginator-next ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={handleNext}
                disabled={currentPage === totalPages}
            >
                Next
            </span>
        </div>
    );
}
