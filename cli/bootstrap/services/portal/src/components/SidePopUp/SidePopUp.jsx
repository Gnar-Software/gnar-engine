import { useState, useEffect } from 'react';

export default function SidePopUp({children, isOpen, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            // Trigger animation after mount
            setTimeout(() => setIsAnimating(true), 10);
        } else {
            setIsAnimating(false);
            // Wait for slide-out animation to complete before unmounting
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={`side-popup-overlay ${isAnimating ? 'active' : ''}`}
                onClick={onClose}
            />

            {/* Popup panel */}
            <div className={`side-popup ${isAnimating ? 'active' : ''}`}>
                <button
                    className="side-popup-close"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

                <div className="side-popup-content">
                    {children}
                </div>
            </div>
        </>
    );
}