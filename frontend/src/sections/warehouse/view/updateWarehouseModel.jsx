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

const UpdateWarehouseModal = ({ open, onClose, warehouse, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    code: '',
    name: '',
    departmentId: '',
    description: '',
    isActive: 'true',
    cit: '',
    area: '',
    createdBy: '',
    createdAt: '',
    updatedBy: '',
    updatedAt: '',
  });

  // const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [departments, setDepartments] = useState([]);

  // Fetch warehouses when the modal opens
  useEffect(() => {
    const url = import.meta.env.VITE_APP_URL;
    const fetchWarehouses = async () => {
      try {
        const response = await fetch(`${url}/api/departments`); // Yeh endpoint aapke server ke hisaab se update karna hoga
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        setDepartments(data); // Assuming the response contains an array of warehouses
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchWarehouses();
  }, [open]);

  // Load warehouse data when the modal opens
  useEffect(() => {
    const url = import.meta.env.VITE_APP_URL;
    if (warehouse) {
      setFormValues({
        code: warehouse.code || '',
        name: warehouse.name || '',
        departmentId: warehouse.departmentId?._id || '',
        description: warehouse.description || '',
        isActive: warehouse.isActive ? 'true' : 'false',
        city: warehouse.city || '',
        area: warehouse.area || '',
        createdBy: warehouse.createdBy || '',
        createdAt: warehouse.createdAt || '',
        updatedBy: warehouse.updatedBy || '',
        updatedAt: warehouse.updatedAt || '',
        _id: warehouse._id || '',
      });
      setSelectedFile(null);
    }
  }, [warehouse, open]);

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
    formData.append('departmentId', formValues.departmentId);
    formData.append('city', formValues.city);
    formData.append('area', formValues.area);

    try {
      const response = await fetch(`${url}/api/warehouses/${formValues._id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      const data = await response.json();
      onUpdate(data);
      onClose();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle bgcolor="black" color="white">
        Update Warehouse
      </DialogTitle>
      <DialogContent>
        <Box>
          <Grid container spacing={2}>
            {/* Code Field */}
            <Grid item xs={12} md={12}>
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
            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={12}>
              <FormControl fullWidth sx={{ marginTop: '15px' }}>
                <InputLabel id="department-label">Department</InputLabel>
                <Select
                  labelId="department-label"
                  value={formValues.departmentId}
                  label="Department"
                  name="departmentId"
                  onChange={handleChange}
                >
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name} - {dept.code}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Noo Departments Available</MenuItem>
                  )}
                </Select>
                {/* <FormHelperText>{errors.departmentId}</FormHelperText> */}
              </FormControl>
            </Grid>

            {/* IsActive Dropdown */}
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
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Deactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* City Field */}
            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formValues.city}
                onChange={handleChange}
                margin="normal"
                // error={!!errors.name}
                // helperText={errors.name}
              />
            </Grid>

            {/* Area Field */}
            <Grid item xs={12} md={12}>
              <TextField
                fullWidth
                label="Area"
                name="area"
                value={formValues.area}
                onChange={handleChange}
                margin="normal"
                // error={!!errors.name}
                // helperText={errors.name}
              />
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

        {/* {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )} */}
      </DialogContent>
      <DialogActions>
        <Button sx={{ background: 'grey' }} onClick={onClose} variant="contained">
          Cancel
        </Button>

        <Button
          onClick={handleSubmit}
          sx={{ backgroundColor: 'rgb(74,115,15,0.9)' }}
          variant="contained"
        >
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UpdateWarehouseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  warehouse: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default UpdateWarehouseModal;
