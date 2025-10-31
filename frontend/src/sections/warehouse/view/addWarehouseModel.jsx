import axios from 'axios';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Alert,
  Button,
  Dialog,
  Select,
  Snackbar,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  FormHelperText,
} from '@mui/material';

const AddWarehouseModal = ({ open, onClose }) => {
  console.log('abc');
  const [formValues, setFormValues] = useState({
    code: '',
    name: '',
    description: '',
    isActive: 'true',
    departmentId: '',
    city: '',
    area: '',
    createdBy: 'admin',
    createdAt: '',
    updatedBy: 'admin',
    updatedAt: '',
  });

  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // Can be "success", "error", "warning", "info"
  });

  // Function to show Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    // Fetch departments from API
    axios
      .get(`${import.meta.env.VITE_APP_URL}/api/departments`)
      // .then((response) => setDepartments(response.data))
      .then((response) => {
        console.log('Departments fetched:', response.data); // Check if data is coming
        setDepartments(response.data);
      })
      .catch((error) => console.error('Error fetching departments:', error));
  }, []);

  const handleCloseAddModal = () => {
    setFormValues({
      code: '',
      name: '',
      description: '',
      isActive: 'true',
      departmentId: '',
      city: '',
      area: '',
      createdBy: 'admin',
      createdAt: '',
      updatedBy: 'admin',
      updatedAt: '',
    });
    setErrors({}); // Reset errors
    onClose(); // Close modal
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.code) newErrors.code = 'Code is required';
    if (!formValues.name) newErrors.name = 'Name is required';
    if (!formValues.departmentId) newErrors.departmentId = 'Department is required';
    if (!formValues.isActive) newErrors.isActive = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const payload = {
      ...formValues,
      isActive: formValues.isActive === 'true',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await axios.post(`${import.meta.env.VITE_APP_URL}/api/warehouses`, payload);
      showSnackbar('Warehouse Added successfully!', 'success');
      console.log('Warehouse added successfully:', response.data);
      console.log('dataaa', response);

      // Reset the form after adding the data
      setFormValues({
        code: '',
        name: '',
        description: '',
        isActive: 'true',
        departmentId: '',
        city: '',
        area: '',
        createdBy: 'admin',
        createdAt: '',
        updatedBy: 'admin',
        updatedAt: '',
      });
      setErrors({}); // Clear any previous validation errors
      onClose();
    } catch (error) {
      showSnackbar('Error adding warehouse', 'error');
      console.error('Error adding warehouse:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle bgcolor="black" color="white">
          Add Warehouse
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
                  error={!!errors.code}
                  helperText={errors.code}
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
                  error={!!errors.name}
                  helperText={errors.name}
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
                  <FormHelperText>{errors.departmentId}</FormHelperText>
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
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Deactive</MenuItem>
                  </Select>
                  <FormHelperText>{errors.isActive}</FormHelperText>
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
                />
              </Grid>
              {/* Description */}
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
          <Button sx={{ background: 'grey' }} onClick={handleCloseAddModal} variant="contained">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
          >
            {/* {loading ? 'Adding...' : 'Add'} */}
            Add
          </Button>
        </DialogActions>
      </Dialog>
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
    </>
  );
};

AddWarehouseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AddWarehouseModal;
