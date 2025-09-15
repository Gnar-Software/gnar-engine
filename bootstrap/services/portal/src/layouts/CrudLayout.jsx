import React, {useEffect} from "react";
import {useLocation, useNavigate} from 'react-router-dom';


const CrudLayout = ({children, view, setView, selectedSingleItemId, setSelectedSingleItemId}) => {

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // if there is no current ?view in the url, set it to list
        // if (!location.search) {
        //     navigate("?view=list", {replace: true});
        // }

        if (view === 'list') {
          navigate("?view=list", {replace: false});
        } else if (view === 'single' && selectedSingleItemId) {
          navigate(`?view=single&id=${selectedSingleItemId}`, {replace: false});
        } else if (view === 'single') {
          navigate("?view=single", {replace: false});
        }
    }, [view]);

    // set view and selected id from url
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view');
        const id = urlParams.get('id');

        if (view === 'list') {
            setView('list')
        } else if (view === 'single' && id) {
            setView('single')
            setSelectedSingleItemId(id);
        } else if (view === 'single') {
            setView('single')
        } else {
            setView('list')
        }
    }, [location]);

    return (
        <>
            {children}
        </>
    )
}

export default CrudLayout;