import PropTypes from 'prop-types';
import QRCode from 'react-qr-code';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Button,
  Dialog,
  Select,
  MenuItem,
  TextField,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
} from '@mui/material';

const UpdateDepartmentModal = ({ open, onClose, user, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    createdBy: '',
    createdAt: '',
    updatedBy: '',
    updatedAt: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);

  // Load user data when the modal opens
  useEffect(() => {
    const url = import.meta.env.VITE_APP_URL;
    if (user) {
      setFormValues({
        code: user.code || '',
        name: user.name || '',
        description: user.description || '',
        isActive: user.isActive || '',
        createdBy: user.createdBy || '',
        createdAt: user.createdAt || '',
        updatedBy: user.updatedBy || '',
        updatedAt: user.updatedAt || '',

        _id: user._id || '',
      });
      setSelectedFile(null);
    }
  }, [user, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async () => {
    const url = import.meta.env.VITE_APP_URL;
    const formData = new FormData();
    formData.append('code', formValues.code);
    formData.append('name', formValues.name);
    formData.append('description', formValues.description);
    formData.append('isActive', formValues.isActive);

    try {
      const response = await fetch(`${url}/api/departments/${formValues._id}`, {
        method: 'PUT',
        headers: {
          // "Content-Type": "multipart/form-data", // (Zyada cases mein zaroori nahi hota)
          Accept: 'application/json',
        },
        body: formData,
      });
      console.log('Updating department with ID:', formValues._id);

      if (!response.ok) {
        throw new Error('Failed to update depatment');
      }

      const data = await response.json();
      onUpdate(data);
      onClose();
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Update Department</DialogTitle>
      <DialogContent>
        <Box>
          <Grid container spacing={2}>
            {/* Code Field */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code"
                name="code"
                value={formValues.code}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            {/* Full Name Field */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            {/* IsActive Dropdown */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ marginTop: '15px' }}>
                <InputLabel id="isActive-label">Status</InputLabel>
                <Select
                  labelId="isActive-label"
                  value={formValues.isActive}
                  name="isActive"
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Deactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Description - Full Width */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formValues.description}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={3} // Yeh 2 rows jitna space dega
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          sx={{
            backgroundColor: 'black',
            color: 'white',
            '&:hover': {
              backgroundColor: '#333333',
            },
          }}
          onClick={onClose}
          color="secondary"
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          sx={{
            backgroundColor: '#00284C',
            color: 'white',
            '&:hover': {
              backgroundColor: '#00288C',
            },
          }}
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UpdateDepartmentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default UpdateDepartmentModal;
