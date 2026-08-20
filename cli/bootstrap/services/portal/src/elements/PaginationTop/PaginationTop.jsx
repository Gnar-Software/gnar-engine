export default function PaginationTop({
    currentCount = 0,
    totalResults = 0,
    classNames = '',
}) {
    return (
        <div className={`pagination-top ${classNames}`}>
            showing {currentCount} of {totalResults}
        </div>
    );
}
