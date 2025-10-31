import axios from 'axios';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import {
  Box,
  Grid,
  Button,
  Dialog,
  Select,
  MenuItem,
  Snackbar,
  TextField,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
} from '@mui/material';

const UpdateSchemeModal = ({ open, onClose, user, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    code: '',
    name: '',
    warehouseId: '',
    description: '',
    isActive: 'true',
    createdBy: '',
    createdAt: '',
    updatedBy: '',
    updatedAt: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]); // State for filtered warehouses
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const role = sessionStorage.getItem('role');
  const department = sessionStorage.getItem('department');
  const isPONumber = (role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom';
  const isElectrical = department === 'Electrical'; // Check if department is Electrical

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    const warehouseName = sessionStorage.getItem('warehouse');

    // Fetch warehouses from API
    axios
      .get(`${import.meta.env.VITE_APP_URL}/api/warehouses`)
      .then((response) => {
        console.log('Warehouses fetched:', response.data);

        if (warehouseName) {
          // Filter warehouses to only include the one with the matching name
          const filtered = response.data.filter(
            (warehouse) =>
              String(warehouse.name).trim().toLowerCase() ===
              String(warehouseName).trim().toLowerCase()
          );
          console.log('Filtered warehouses:', filtered); // Debugging

          if (filtered.length === 0) {
            console.log('No matching warehouse found, showing all warehouses'); // Debugging
            setFilteredWarehouses(response.data);
          } else {
            setFilteredWarehouses(filtered);
          }
        } else {
          // If no warehouse name in sessionStorage, show all warehouses
          console.log('No warehouse name in sessionStorage, showing all warehouses'); // Debugging
          setFilteredWarehouses(response.data);
        }

        setWarehouses(response.data); // Keep the original list for other purposes
      })
      .catch((error) => console.error('Error fetching warehouses:', error));
  }, []);

  useEffect(() => {
    if (user) {
      setFormValues({
        code: user.code || '',
        name: user.name || '',
        warehouseId: user.warehouseId?._id || '',
        description: user.description || '',
        isActive: user.isActive ? 'true' : 'false',
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

    // Only append name and description if not Electrical department
    if (!isElectrical) {
      formData.append('name', formValues.name);
      formData.append('description', formValues.description);
    } else {
      // For Electrical department, use static values
      formData.append('name', 'Electrical Scheme');
      formData.append('description', 'This is an electrical scheme');
    }

    formData.append('isActive', formValues.isActive);
    formData.append('warehouseId', formValues.warehouseId);

    try {
      const response = await fetch(`${url}/api/schemes/${formValues._id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      const data = await response.json();
      onUpdate(data);
      showSnackbar('Scheme updated successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error updating:', error);
      showSnackbar('Failed to update scheme.', 'error');
    }
  };

  const handleCancel = () => {
    showSnackbar('Update cancelled.', 'info');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle bgcolor="black" color="white">
        {isPONumber ? 'Update PO Number' : 'Update Scheme'}
      </DialogTitle>
      <DialogContent>
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                label={isPONumber ? 'PO Code' : 'Code'}
                name="code"
                value={formValues.code}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            {/* Conditionally render Name field only if not Electrical department */}
            {!isElectrical && (
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label={isPONumber ? 'PO Name' : 'Name'}
                  name="name"
                  value={formValues.name}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
            )}

            <Grid item xs={12} md={12}>
              <FormControl fullWidth sx={{ marginTop: '15px' }}>
                <InputLabel id="warehouse-label">Warehouses</InputLabel>
                <Select
                  labelId="warehouse-label"
                  value={formValues.warehouseId || ''}
                  label="Warehouse"
                  name="warehouseId"
                  onChange={handleChange}
                >
                  {filteredWarehouses.length > 0 ? (
                    filteredWarehouses.map((ware) => (
                      <MenuItem key={ware._id} value={ware._id}>
                        {ware.name} - {ware.code}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No Warehouse Available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={12}>
              <FormControl fullWidth sx={{ marginTop: '15px' }}>
                <InputLabel id="isActive-label">Status</InputLabel>
                <Select
                  labelId="isActive-label"
                  value={formValues.isActive}
                  name="isActive"
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="true">
                    {department === 'Telecom' ? 'Activate' : 'Active'}
                  </MenuItem>
                  <MenuItem value="false">
                    {department === 'Telecom' ? 'Close' : 'Deactive'}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Conditionally render Description field only if not Electrical department */}
            {!isElectrical && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formValues.description}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          sx={{
            backgroundColor: 'grey',
          }}
          onClick={handleCancel}
          variant="contained"
        >
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ backgroundColor: 'rgb(74,115,15,0.9)' }}
        >
          Update
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

UpdateSchemeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default UpdateSchemeModal;
