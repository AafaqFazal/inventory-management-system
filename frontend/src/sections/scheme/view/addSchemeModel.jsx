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
  InputLabel,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  FormHelperText,
} from '@mui/material';

const AddSchemeModal = ({ open, onClose }) => {
  const [formValues, setFormValues] = useState({
    code: '',
    name: '',
    description: '',
    isActive: 'true',
    warehouseId: '',
    createdBy: 'admin',
    createdAt: '',
    updatedBy: 'admin',
    updatedAt: '',
  });

  const [warehouses, setWarehouses] = useState([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const department = sessionStorage.getItem('department');
  const isElectrical = department === 'Electrical'; // Check if department is Electrical
  const isPO = department === 'Telecom';

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    if (open) {
      const warehouseId = sessionStorage.getItem('warehouseId');
      const userRole = sessionStorage.getItem('role');

      axios
        .get(`${import.meta.env.VITE_APP_URL}/api/warehouses`)
        .then((response) => {
          console.log('Warehouses fetched:', response.data);

          if (userRole === 'WAREHOUSE_USER' && warehouseId) {
            // For WAREHOUSE users, filter warehouses based on warehouseId
            const filtered = response.data.filter((warehouse) => warehouse._id === warehouseId);
            console.log('Filtered warehouses for WAREHOUSE user:', filtered);

            if (filtered.length > 0) {
              setFilteredWarehouses(filtered);
              // Automatically set the warehouseId in the form
              setFormValues((prevValues) => ({
                ...prevValues,
                warehouseId: filtered[0]._id,
              }));
            } else {
              console.log('No matching warehouse found for WAREHOUSE user');
              setFilteredWarehouses([]);
            }
          } else {
            // For other roles, show all warehouses
            setFilteredWarehouses(response.data);
          }

          setWarehouses(response.data);
        })
        .catch((error) => console.error('Error fetching warehouses:', error));
    }
  }, [open]); // Trigger this effect only when the modal opens

  const handleCloseAddModal = () => {
    setFormValues({
      code: '',
      name: '',
      description: '',
      isActive: 'true',
      warehouseId: '',
      createdBy: 'admin',
      createdAt: '',
      updatedBy: 'admin',
      updatedAt: '',
    });
    setErrors({});
    showSnackbar('Add operation cancelled.', 'info');
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Selected Warehouse ID:', name, value);
    setFormValues({ ...formValues, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.code) newErrors.code = 'Code is required';

    // Only validate name if department is not Electrical
    if (!isElectrical && !formValues.name) newErrors.name = 'Name is required';

    if (!formValues.warehouseId) newErrors.warehouseId = 'Department is required';
    if (!formValues.isActive) newErrors.isActive = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    // Prepare payload with static values for Electrical department
    const payload = {
      ...formValues,
      isActive: formValues.isActive === 'true',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If department is Electrical, add static values for name and description
    if (isElectrical) {
      payload.name = 'Electrical Scheme'; // Static name for Electrical department
      payload.description = 'This is an electrical scheme'; // Static description for Electrical department
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_APP_URL}/api/schemes`, payload);
      showSnackbar('Scheme added successfully!', 'success');
      console.log('Scheme added successfully:', response.data);

      setFormValues({
        code: '',
        name: '',
        description: '',
        isActive: 'true',
        warehouseId: '',
        createdBy: 'admin',
        createdAt: '',
        updatedBy: 'admin',
        updatedAt: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      showSnackbar('Error adding scheme.', 'error');
      console.error('Error adding Scheme:', error);
    } finally {
      setLoading(false);
    }
  };

  const userRole = sessionStorage.getItem('role');

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle bgcolor="black" color="white">
          Add
        </DialogTitle>
        <DialogContent>
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label={isPO ? 'PO Code' : 'Code'}
                  name="code"
                  value={formValues.code}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.code}
                  helperText={errors.code}
                />
              </Grid>

              {/* Hide Name field for Electrical department */}
              {!isElectrical && (
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label={isPO ? 'PO Name' : 'Name'}
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name}
                  />
                </Grid>
              )}

              <Grid item xs={12} md={12}>
                <FormControl fullWidth sx={{ marginTop: '15px' }}>
                  <InputLabel id="warehouse-label">Warehouses</InputLabel>
                  <Select
                    labelId="warehouse-label"
                    value={formValues.warehouseId}
                    label="Warehouse"
                    name="warehouseId"
                    onChange={handleChange}
                    disabled={userRole === 'WAREHOUSE_USER'} // Disable for WAREHOUSE users
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
                  <FormHelperText>{errors.warehouseId}</FormHelperText>
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
                  <FormHelperText>{errors.isActive}</FormHelperText>
                </FormControl>
              </Grid>

              {/* Hide Description field for Electrical department */}
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
            onClick={handleCloseAddModal}
            sx={{
              backgroundColor: 'grey',
            }}
            variant="contained"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
            variant="contained"
          >
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

AddSchemeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AddSchemeModal;
