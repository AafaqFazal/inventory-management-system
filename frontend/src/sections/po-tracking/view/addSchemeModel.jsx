import axios from 'axios';
import { useState } from 'react';
import PropTypes from 'prop-types';

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
    itemCode: '',
    description: '',
    supplierName: '',
    scheme: '',
    rawasiIssuedPO: '', // PO Number field
    brand: '',
    poQty: '',
    receivedQty: '',
    remainingQty: '',
    unit: '', // Default to 'piece'
    isActive: 'true',
    createdBy: 'admin',
    createdAt: '',
    updatedBy: 'admin',
    updatedAt: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCloseAddModal = () => {
    setFormValues({
      itemCode: '',
      description: '',
      supplierName: '',
      scheme: '',
      brand: '',
      poQty: '',
      receivedQty: '',
      remainingQty: '',
      unit: 'piece',
      isActive: 'true',
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
    setFormValues({ ...formValues, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.itemCode) newErrors.itemCode = 'Item Code is required';
    if (!formValues.description) newErrors.description = 'Description is required';
    if (!formValues.supplierName) newErrors.supplierName = 'Supplier Name is required';
    if (!formValues.scheme) newErrors.scheme = 'PO Number is required';
    if (!formValues.poQty) newErrors.poQty = 'PO QTY is required';
    if (!formValues.receivedQty) newErrors.receivedQty = 'Received QTY is required';
    if (!formValues.remainingQty) newErrors.remainingQty = 'Remaining QTY is required';
    if (!formValues.brand) newErrors.brand = 'Brand is required';
    if (!formValues.unit) newErrors.unit = 'Unit is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const warehouseId = sessionStorage.getItem('warehouseId');
    const departmentId = sessionStorage.getItem('departmentId');
    const warehouseName = sessionStorage.getItem('warehouse');

    const payload = {
      itemCode: formValues.itemCode,
      description: formValues.description,
      supplierName: formValues.supplierName,
      scheme: formValues.scheme,
      poQty: formValues.poQty,
      receivedPoQty: formValues.receivedQty,
      remainingQty: formValues.remainingQty,
      unit: formValues.unit,
      brand: formValues.brand,
      warehouseName,
      warehouseId,
      departmentId,
      isActive: formValues.isActive === 'true',
      createdBy: 'admin',
      updatedBy: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await axios.post(`${import.meta.env.VITE_APP_URL}/api/poTracking`, payload);
      showSnackbar('PO Tracking added successfully!', 'success');
      handleCloseAddModal();
    } catch (error) {
      showSnackbar('Error adding PO Tracking.', 'error');
      console.error('Error adding PO Tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle bgcolor="black" color="white">
          Add RWS PO Tracking
        </DialogTitle>
        <DialogContent>
          <Box>
            <Grid container spacing={2}>
              {/* PO Number Field */}
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="PO"
                  name="scheme"
                  value={formValues.scheme}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.scheme}
                  helperText={errors.scheme}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Item Code"
                  name="itemCode"
                  value={formValues.itemCode}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.itemCode}
                  helperText={errors.itemCode}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formValues.description}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.description}
                  helperText={errors.description}
                />
              </Grid>
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Unit"
                  name="unit"
                  value={formValues.unit}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.unit}
                  helperText={errors.unit}
                />
              </Grid>

              {/* Unit Dropdown */}
              {/* <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" error={!!errors.unit}>
                  <InputLabel id="unit-label">Unit</InputLabel>
                  <Select
                    labelId="unit-label"
                    value={formValues.unit}
                    label="Unit"
                    name="unit"
                    onChange={handleChange}
                  >
                    <MenuItem value="piece">Piece</MenuItem>
                    <MenuItem value="pair">Pair</MenuItem>
                  </Select>
                  {errors.unit && <FormHelperText error>{errors.unit}</FormHelperText>}
                </FormControl>
              </Grid> */}

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Supplier Name"
                  name="supplierName"
                  value={formValues.supplierName}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.supplierName}
                  helperText={errors.supplierName}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Brand"
                  name="brand"
                  value={formValues.brand}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.brand}
                  helperText={errors.brand}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="PO QTY"
                  name="poQty"
                  value={formValues.poQty}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.poQty}
                  helperText={errors.poQty}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Received QTY"
                  name="receivedQty"
                  value={formValues.receivedQty}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.receivedQty}
                  helperText={errors.receivedQty}
                />
              </Grid>

              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Remaining QTY"
                  name="remainingQty"
                  value={formValues.remainingQty}
                  onChange={handleChange}
                  margin="normal"
                  error={!!errors.remainingQty}
                  helperText={errors.remainingQty}
                />
              </Grid>
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
