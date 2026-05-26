import UserInfo from "../UserInfo/UserInfo";
import { Link } from "react-router-dom";

function Sidebar() {

    return (
        <div className="portal-sidebar">
            <div className="inner">
                <ul>
                    <li className="icon-dashboard"><Link to="/portal/dashboard">Dashboard</Link></li>
                </ul>
                <span className="separator"></span>
                <ul>
                    <li className="icon-users"><Link to="/portal/users">Users</Link></li>
                </ul>
                <span className="separator"></span>
                <ul>
                    <li className="icon-users"><Link to="/portal/pages">Pages</Link></li>
                    <li><Link to="/portal/blocks">Blocks</Link></li>
                </ul>
                <span className="separator"></span>
                <ul>
                    <li className="icon-reports"><Link to="/portal/reports">Reports</Link></li>
                    <li><Link to="/portal/logs">Logs</Link></li>
                </ul>
            </div>

            <UserInfo />
        </div>
    )
}

export default Sidebar;
