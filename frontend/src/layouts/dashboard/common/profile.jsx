import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

const ProfilePopup = ({ open, handleClose, userId }) => {
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    // Fetch user data from sessionStorage
    const fetchUserData = () => {
      try {
        const email = sessionStorage.getItem('email') || '';
        const fullName = sessionStorage.getItem('fullName') || email.split('@')[0];
        const role = sessionStorage.getItem('role') || 'No role defined';

        setUserData({
          fullName,
          email,
          role,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>User Profile</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Full Name"
          value={userData.fullName}
          margin="dense"
          InputProps={{ readOnly: true }}
        />
        <TextField
          fullWidth
          label="Email"
          value={userData.email}
          margin="dense"
          InputProps={{ readOnly: true }}
        />
        <TextField
          fullWidth
          label="Role"
          value={userData.role}
          margin="dense"
          InputProps={{ readOnly: true }}
        />
        <Button
          onClick={handleClose}
          variant="contained"
          fullWidth
          sx={{ mt: 2, backgroundColor: 'grey' }}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// Define propTypes for the component
ProfilePopup.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
};

export default ProfilePopup;
