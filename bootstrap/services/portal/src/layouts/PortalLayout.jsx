import React, {useEffect} from "react";
import { useLocation } from "react-router";
import Sidebar from "../features/sidebar/Sidebar";
import User from "../features/user/User";
import { Link } from "react-router-dom";
import "react-datepicker/dist/react-datepicker.css";

const PortalLayout = ({children}) => {

    const location = useLocation();

    useEffect(() => {
        console.log(location);
    }, [location]);


    return (
        <div className="portal-layout">

            <div className="header">
                <div className="content-wrap">
                    <div className="content">
                    </div>
                </div>
            </div>
        
            <div className="main">
                <div className="content-wrap">
                    <div className="content">
                        <Sidebar />
                        <div className="main-page">
                            <div className="header-details">
                                <Link to="/portal/" className="header-logo">
                                    <img src={require('../assets/Logo_Anchord_Black.svg').default} alt="Gnar Engine" className="header-logo" />
                                </Link>
                                <User />
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    );
}

export default PortalLayout;