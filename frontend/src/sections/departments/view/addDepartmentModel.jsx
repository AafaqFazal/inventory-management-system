import PropTypes from 'prop-types';
import QRCode from 'react-qr-code';
import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

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
} from '@mui/material';

const AddDepartmentModal = ({ open, onClose }) => {
  const [formValues, setFormValues] = useState({
    code: '',
    name: '',
    description: '',
    isActive: 'true',
    createdBy: '',
    createdAt: '',
    updatedBy: '',
    updatedAt: '',
  });

  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  useEffect(() => {
    const fetchRoles = async () => {
      const url = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${url}/api/roles/getRolesAndPolicies`);
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setRoles(data.roles || []);
        } else {
          throw new Error('Response is not in JSON format');
        }
      } catch (err) {
        console.error('Error fetching roles:', err.message || err);
      }
    };

    fetchRoles();
  }, []);
  const validateForm = () => {
    const newErrors = {};
    if (!formValues.code) newErrors.code = 'Code is required';
    if (!formValues.name) newErrors.name = 'Name is required';
    if (!formValues.isActive) newErrors.isActive = 'Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const url = import.meta.env.VITE_APP_URL;
    setError(null);
    setLoading(true);

    const payload = {
      code: formValues.code,
      name: formValues.name,
      description: formValues.description,
      isActive: formValues.isActive === 'true', // Boolean conversion
      createdBy: formValues.createdBy || 'admin',
      createdAt: new Date().toISOString(),
      updatedBy: formValues.updatedBy || 'admin',
      updatedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(`${url}/api/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // ✅ JSON header set karein
        },
        body: JSON.stringify(payload), // ✅ JSON.stringify() se data send karein
      });
      showSnackbar('Department Added successfully!', 'success');

      if (!response.ok) {
        throw new Error('Failed to add scheme');
      }

      console.log('Scheme added successfully');
      setFormValues({
        code: '',
        name: '',
        description: '',
        isActive: true,
        createdBy: '',
        createdAt: '',
        updatedBy: '',
        updatedAt: '',
      });
      setErrors({});
      onClose();
      // eslint-disable-next-line no-shadow
    } catch (error) {
      showSnackbar('Error adding Department', 'error');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Department</DialogTitle>
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
                  error={!!errors.code}
                  helperText={errors.code}
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
                  error={!!errors.name}
                  helperText={errors.name}
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

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
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

AddDepartmentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AddDepartmentModal;
