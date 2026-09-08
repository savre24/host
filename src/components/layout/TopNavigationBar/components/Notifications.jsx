'use client';

import IconifyIcon from '@/components/wrappers/IconifyIcon';
import SimplebarReactClient from '@/components/wrappers/SimplebarReactClient';
import { Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap';
import Image from 'next/image';
import { timeSince } from '@/utils/date';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserNotifications, markAllAsRead, deleteNotification, markNotificationAsRead } from '@/app/actions/notifications';

const Notifications = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const result = await getUserNotifications(15);
    if (result.success) {
      setNotifications(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const dismissNotification = async (e, id) => {
    e.stopPropagation(); // prevent click through
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    await deleteNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await markAllAsRead();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      await markNotificationAsRead(notification.id);
    }
    
    // Auto dismiss logic (per user preference)
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    await deleteNotification(notification.id);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="topbar-item">
      <Dropdown align={'end'} onToggle={(isOpen) => { if (isOpen) fetchNotifications(); }}>
        <DropdownToggle as={'button'} className="topbar-link drop-arrow-none" data-bs-toggle="dropdown" data-bs-offset="0,25" data-bs-auto-close="outside" aria-haspopup="false" aria-expanded="false">
          <IconifyIcon icon='tabler:bell' className="animate-ring fs-22" />
          {unreadCount > 0 && <span className="noti-icon-badge" />}
        </DropdownToggle>
        
        <DropdownMenu className="p-0 dropdown-menu-start dropdown-menu-lg" style={{ minHeight: 300 }}>
          <div className="p-3 border-bottom border-dashed">
            <Row className="align-items-center">
              <Col>
                <h6 className="m-0 fs-16 fw-semibold">Notifications {unreadCount > 0 && `(${unreadCount})`}</h6>
              </Col>
              <Col xs={'auto'}>
                <Dropdown>
                  <DropdownToggle as={'a'} className="drop-arrow-none link-dark" data-bs-toggle="dropdown" data-bs-offset="0,15" aria-expanded="false">
                    <IconifyIcon icon='tabler:settings' className="fs-22 align-middle" />
                  </DropdownToggle>
                  <DropdownMenu className="dropdown-menu-end">
                    <DropdownItem onClick={handleMarkAllAsRead}>Mark all as Read</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </Col>
            </Row>
          </div>

          <SimplebarReactClient className="position-relative z-2 card shadow-none rounded-0" style={{ maxHeight: 300 }}>
            {notifications.map((item) => (
              <div 
                className={`notification-item dropdown-item py-2 text-wrap ${!item.isRead ? 'bg-light' : ''}`} 
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <span className="d-flex align-items-center">
                  <div className="avatar-md flex-shrink-0 me-3">
                    <span className={`avatar-title bg-${item.variant}-subtle text-${item.variant} rounded-circle fs-22`}>
                      <IconifyIcon icon={item.icon || 'tabler:bell'} />
                    </span>
                  </div>

                  <span className="flex-grow-1 text-muted">
                    <span className="fw-medium text-body">{item.title}</span>
                    <br />
                    {item.message && <span className="fs-13">{item.message}<br/></span>}
                    <span className="fs-12">{timeSince(new Date(item.createdAt))}</span>
                  </span>
                  
                  <span className="notification-item-close" onClick={(e) => dismissNotification(e, item.id)}>
                    <button type="button" className="btn btn-ghost-danger rounded-circle btn-sm btn-icon">
                      <IconifyIcon icon='tabler:x' className="fs-16" />
                    </button>
                  </span>
                </span>
              </div>
            ))}
          </SimplebarReactClient>

          {notifications.length === 0 && !loading && (
            <div style={{ height: 300 }} className="d-flex align-items-center justify-content-center text-center position-absolute top-0 bottom-0 start-0 end-0 z-1">
              <div>
                <IconifyIcon icon="line-md:bell-twotone-alert-loop" className="fs-80 text-secondary mt-2" />
                <h4 className="fw-semibold mb-0 fst-italic lh-base mt-3">Hey! 👋 <br />You have no notifications</h4>
              </div>
            </div>
          )}
          
          <Link href="#" onClick={handleMarkAllAsRead} className="dropdown-item notification-item position-fixed z-2 bottom-0 text-center text-reset text-decoration-underline link-offset-2 fw-bold notify-item border-top border-light py-2 bg-white">
            Clear All
          </Link>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default Notifications;