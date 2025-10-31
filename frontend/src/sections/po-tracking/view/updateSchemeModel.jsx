import axios from 'axios';
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import {
  Box,
  Grid,
  Alert,
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
  FormHelperText,
} from '@mui/material';

const UpdateSchemeModal = ({ open, onClose, user, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    itemCode: '',
    description: '',
    scheme: '', // PO Number field
    supplierName: '',
    poQty: '',
    receivedPoQty: '',
    remainingQty: '',
    unit: '', // Default to 'piece'
    brand: '',
    createdBy: '',
    createdAt: '',
    updatedBy: '',
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

  useEffect(() => {
    if (user && open) {
      setFormValues({
        itemCode: user.itemCode || '',
        description: user.description || '',
        scheme: user.scheme || '',
        supplierName: user.supplierName || '',
        poQty: user.poQty || '',
        receivedPoQty: user.receivedPoQty || '',
        remainingQty: user.remainingQty || '',
        unit: user.unit || '',
        brand: user.brand || '',
        createdBy: user.createdBy || '',
        createdAt: user.createdAt || '',
        updatedBy: user.updatedBy || '',
        updatedAt: user.updatedAt || '',
        _id: user._id || '',
      });
    }
  }, [user, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.itemCode) newErrors.itemCode = 'Item Code is required';
    if (!formValues.description) newErrors.description = 'Description is required';
    if (!formValues.supplierName) newErrors.supplierName = 'Supplier Name is required';
    if (!formValues.scheme) newErrors.scheme = 'PO is required';
    if (!formValues.poQty) newErrors.poQty = 'PO QTY is required';
    if (!formValues.receivedPoQty) newErrors.receivedPoQty = 'Received QTY is required';
    if (!formValues.remainingQty) newErrors.remainingQty = 'Remaining QTY is required';
    if (!formValues.brand) newErrors.brand = 'Brand is required';
    if (!formValues.unit) newErrors.unit = 'Unit is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // if (!validateForm()) return;

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_APP_URL}/api/poTracking/${formValues._id}`,
        formValues
      );
      showSnackbar('PO Tracking updated successfully!', 'success');
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error(
        'Error updating PO Tracking:',
        error.response ? error.response.data : error.message
      );
      showSnackbar('Error updating PO Tracking.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    showSnackbar('Update cancelled.', 'info');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle bgcolor="black" color="white">
        Update RWS PO Tracking
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
                name="receivedPoQty"
                value={formValues.receivedPoQty}
                onChange={handleChange}
                margin="normal"
                error={!!errors.receivedPoQty}
                helperText={errors.receivedPoQty}
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
          onClick={handleCancel}
          sx={{
            backgroundColor: 'Grey',
          }}
          variant="contained"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
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
