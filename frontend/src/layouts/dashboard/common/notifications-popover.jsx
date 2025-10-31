import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import {
  Box,
  List,
  Badge,
  Button,
  Avatar,
  Divider,
  Tooltip,
  Popover,
  Typography,
  IconButton,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import NotificationsModal from './noticationModel';

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [totalUnRead, setTotalUnRead] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const url = import.meta.env.VITE_APP_URL;
    const userId = sessionStorage.getItem('userId');

    try {
      if (!userId) return;

      const response = await fetch(`${url}/api/notification/${userId}`);
      const data = await response.json();
      // Log the fetched data

      // Calculate the number of unread notifications
      const unreadCount = data.filter((notification) => notification.status === 'unread').length;

      setNotifications(data || []);
      setTotalUnRead(unreadCount); // Update the unread count
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch notifications immediately when the component mounts
    fetchNotifications();

    // Set up periodic polling (e.g., every 10 seconds)
    const intervalId = setInterval(fetchNotifications, 10000); // 10 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleOpen = (event) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  const handleMarkAllAsRead = async () => {
    const userId = sessionStorage.getItem('userId'); // Get userId from sessionStorage
    const url = import.meta.env.VITE_APP_URL; // Base URL for the API

    try {
      const response = await fetch(`${url}/api/notification/mark-all-as-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }), // Pass the userId in the request body
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      const data = await response.json();

      // Update the frontend state to mark all notifications as read
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: 'read',
        }))
      );

      // Update the total unread count
      setTotalUnRead(0);

      console.log(data.message); // "All notifications marked as read"
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleViewAll = () => {
    setModalOpen(true);
    handleClose();
  };

  return (
    <>
      <IconButton color={open ? 'primary' : 'default'} onClick={handleOpen}>
        <Badge badgeContent={totalUnRead} color="error">
          <Iconify width={24} icon="solar:bell-bing-bold-duotone" />
        </Badge>
      </IconButton>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { mt: 1.5, ml: 0.75, width: 360 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 2.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">Notifications</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              You have {totalUnRead} unread messages
            </Typography>
          </Box>
          {totalUnRead > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton color="primary" onClick={handleMarkAllAsRead}>
                <Iconify icon="eva:done-all-fill" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Scrollbar sx={{ height: { xs: 300, sm: 'auto' } }}>
          {loading ? (
            <Box sx={{ p: 2 }}>Loading notifications...</Box>
          ) : (
            <List disablePadding>
              {notifications.map((notification) => (
                <NotificationItem key={notification._id} notification={notification} />
              ))}
            </List>
          )}
        </Scrollbar>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button fullWidth disableRipple onClick={handleViewAll}>
            View All
          </Button>
        </Box>
      </Popover>

      <NotificationsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        setTotalUnRead={setTotalUnRead}
      />
    </>
  );
}

function NotificationItem({ notification }) {
  // Format the date
  const formattedDate = new Date(notification.date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <ListItemButton
      sx={{
        py: 1.5,
        px: 2.5,
        mt: '1px',
        ...(notification.status === 'unread' && { bgcolor: 'action.selected' }),
      }}
    >
      <ListItemAvatar>
        {/* <Avatar sx={{ bgcolor: 'background.neutral' }}>
          <Iconify icon="eva:bell-outline" />
        </Avatar> */}
      </ListItemAvatar>
      <ListItemText
        primary={<Typography variant="subtitle2">{notification.message}</Typography>}
        secondary={
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {formattedDate}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    _id: PropTypes.string,
    message: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    status: PropTypes.string,
  }).isRequired,
};
