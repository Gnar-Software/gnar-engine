import React, { useState, useEffect } from 'react';

const SaveButton = ({ save, loading, textCreate, textCreateLoading, textCreateSuccess, textCreateError, textUpdate, textUpdateLoading, textUpdateSuccess, textUpdateError, isUpdating}) => {
    
    const [buttonText, setButtonText] = useState(textCreate || 'Save');

    // Determine the button class name based on the loading state
    const getButtonClassName = () => {
        if (loading === 'loading') {
            return 'btn-loading';
        }
    
        if (loading === 'success') {
            return 'success';
        }
    
        if (loading === 'error') {
            return 'error';
        }
    
        if (isUpdating) {
            return 'update';
        } else {
            return 'create';
        }
    };

    useEffect(() => {
        if (isUpdating) {
            // If updating
            switch (loading) {
                case 'loading':
                    setButtonText(textUpdateLoading || 'Updating...');
                    break;
                case 'success':
                    setButtonText(textUpdateSuccess || 'Updated');
                    break;
                case 'error':
                    setButtonText(textUpdateError || 'Error');
                    break;
                default:
                    setButtonText(textUpdate || 'Update');
                    break;
            }
        } else {
            // If creating
            switch (loading) {
                case 'loading':
                    setButtonText(textCreateLoading || 'Creating...');
                    break;
                case 'success':
                    setButtonText(textCreateSuccess || 'Saved');
                    break;
                case 'error':
                    setButtonText(textCreateError || 'Error');
                    break;
                default:
                    setButtonText(textCreate || 'Save');
                    break;
            }
        }
    }, [loading, isUpdating, textCreate, textCreateLoading, textCreateSuccess, textCreateError, textUpdate, textUpdateLoading, textUpdateSuccess, textUpdateError]);

    return (
        <button className={getButtonClassName()} onClick={save}>{buttonText}</button>
    );
};

export default SaveButton;
