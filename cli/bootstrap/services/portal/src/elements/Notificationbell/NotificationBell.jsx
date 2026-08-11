import BellIcon from '../../assets/icons/bell-01.png';

export default function NotificationBell({ onClickHandler, unreadCount }) {

    return (
        <div className='notification-bell-cont'>
            <img className='nav-icon' src={BellIcon} alt="Notification Bell" onClick={onClickHandler} />
            {unreadCount > 0 &&
                <div className='notification-count'>
                    {unreadCount}
                </div>
            }
        </div>
    )
}
