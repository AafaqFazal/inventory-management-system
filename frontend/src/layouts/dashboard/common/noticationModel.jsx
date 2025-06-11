import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  List,
  Modal,
  Button,
  Divider,
  Typography,
  ListItemButton,
  TablePagination,
} from '@mui/material';

export default function NotificationsModal({
  open,
  onClose,
  notifications,
  setNotifications,
  setTotalUnRead,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Initial rows per page

  // Check if there are any unread notifications
  const hasUnreadNotifications = notifications.some(
    (notification) => notification.status === 'unread'
  );

  const markAllAsRead = async () => {
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

  const handleMarkAsRead = async (notificationId) => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${url}/api/notification/read/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      const { notification: updatedNotification } = await response.json(); // Get the updated notification from the backend

      // Update the frontend state with the updated notification
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId ? updatedNotification : notification
        )
      );

      setTotalUnRead((prev) => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="notifications-modal"
      aria-describedby="modal-with-notifications"
    >
      <Box
        sx={{
          maxWidth: 800,
          Height: 1200,
          mx: 'auto',
          mt: 5,
          bgcolor: 'background.paper',
          borderRadius: 1,
          p: 3,
          boxShadow: 24,
        }}
      >
        <Typography variant="h6" component="h2" gutterBottom>
          Notifications
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List>
          {notifications
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((notification) => (
              <Box
                key={notification._id}
                sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}
              >
                <ListItemButton
                  disabled={notification.status === 'read'} // Check "status" instead of "isRead"
                  sx={{
                    py: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">{notification.message}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formatDate(notification.date)} {/* Display formatted date */}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ ml: 2 }}
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as Read
                  </Button>
                </ListItemButton>
                <Divider />
              </Box>
            ))}
        </List>
        <TablePagination
          component="div"
          count={notifications.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{ mt: 2 }}
        />
        <Box
          sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end', textAlign: 'right' }}
        >
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
          {/* Conditionally render the "Mark all as Read" button */}
          {hasUnreadNotifications && (
            <Button variant="contained" onClick={markAllAsRead}>
              Mark all as Read
            </Button>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

NotificationsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  notifications: PropTypes.array.isRequired,
  setNotifications: PropTypes.func.isRequired,
  setTotalUnRead: PropTypes.func.isRequired,
};
