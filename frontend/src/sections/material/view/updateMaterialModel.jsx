import PropTypes from 'prop-types';
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

const UpdateMaterialModal = ({ open, onClose, user, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    code: '',
    name: '',
    description: '',
    isActive: 'true',
    warehouseId: '',
    createdBy: '',
    createdAt: '',
    updatedBy: '',
    updatedAt: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [warehouses, setWarehouses] = useState([]); // All warehouses from API
  const [filteredWarehouses, setFilteredWarehouses] = useState([]); // Filtered warehouses based on user role
  const department = sessionStorage.getItem('department');
  const isPO = department === 'Telecom';

  // Fetch warehouses when the modal opens
  useEffect(() => {
    const url = import.meta.env.VITE_APP_URL;
    const warehouseName = sessionStorage.getItem('warehouse');
    const userRole = sessionStorage.getItem('role'); // Get user role from session storage

    const fetchWarehouses = async () => {
      try {
        const response = await fetch(`${url}/api/warehouses`);
        if (!response.ok) {
          throw new Error('Failed to fetch warehouses');
        }
        const data = await response.json();

        if (userRole === 'SUPER_ADMIN') {
          // For superadmin, show no warehouses (empty list)
          setFilteredWarehouses([]);
        } else if (warehouseName) {
          // For warehouse user, filter warehouses to only include the one with the matching name
          const filtered = data.filter(
            (warehouse) =>
              String(warehouse.name).trim().toLowerCase() ===
              String(warehouseName).trim().toLowerCase()
          );
          console.log('Filtered warehouses:', filtered); // Debugging

          if (filtered.length === 0) {
            console.log('No matching warehouse found, showing all warehouses'); // Debugging
            setFilteredWarehouses(data);
          } else {
            setFilteredWarehouses(filtered);
          }
        } else {
          // If no warehouse name in sessionStorage, show all warehouses
          console.log('No warehouse name in sessionStorage, showing all warehouses'); // Debugging
          setFilteredWarehouses(data);
        }

        setWarehouses(data); // Keep the original list for other purposes
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };

    fetchWarehouses();
  }, [open]);

  // Load user data when the modal opens
  useEffect(() => {
    const url = import.meta.env.VITE_APP_URL;
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
    const payload = {
      code: formValues.code,
      name: formValues.name,
      description: formValues.description,
      isActive: formValues.isActive === 'true', // Convert string to boolean
      warehouseId: formValues.warehouseId,
    };
    try {
      const response = await fetch(`${url}/api/materials/${formValues._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json', // Use this for JSON
        },
        body: JSON.stringify(payload),
        // Include credentials if needed
        // credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update');
      }

      const data = await response.json();
      onUpdate(data);
      onClose();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  const userRole = sessionStorage.getItem('role'); // Get user role from session storage

  // Helper function to render warehouse options
  const renderWarehouseOptions = () => {
    if (userRole === 'SUPER_ADMIN') {
      return <MenuItem disabled>No Warehouse Available</MenuItem>;
    }

    if (filteredWarehouses.length > 0) {
      return filteredWarehouses.map((ware) => (
        <MenuItem key={ware._id} value={ware._id}>
          {ware.name} - {ware.code}
        </MenuItem>
      ));
    }

    return <MenuItem disabled>No Warehouse Available</MenuItem>;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Update Material</DialogTitle>
      <DialogContent>
        <Box>
          <Grid container spacing={2}>
            {/* Code Field */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={isPO ? 'Material Code' : 'Code'}
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
                label={isPO ? 'Brand' : 'Name'}
                name="name"
                value={formValues.name}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            {/* Warehouse Field */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ marginTop: '15px' }}>
                <InputLabel id="warehouse-label">Warehouses</InputLabel>
                <Select
                  labelId="warehouse-label"
                  value={formValues.warehouseId || ''}
                  label="Warehouse"
                  name="warehouseId"
                  onChange={handleChange}
                  disabled={userRole === 'SUPER_ADMIN' || userRole === 'WAREHOUSE_USER'}
                >
                  {renderWarehouseOptions()}
                </Select>
              </FormControl>
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
                rows={3}
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

UpdateMaterialModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default UpdateMaterialModal;
