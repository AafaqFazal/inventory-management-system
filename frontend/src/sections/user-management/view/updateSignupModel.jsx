import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
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
  IconButton,
  Typography,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const UpdateSignUpModal = ({ open, onClose, user, onUpdate }) => {
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    role: '',
    roleId: '',
    warehouse: { name: '', _id: '' },
    department: { name: '', _id: '' },
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // Can be "success", "error", "warning", "info"
  });

  // Function to show Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Function to close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch roles, warehouses, and departments
  useEffect(() => {
    const url = import.meta.env.VITE_APP_URL;
    const fetchRoles = async () => {
      try {
        const response = await fetch(`${url}/api/roles/rolePolicies`);
        const data = await response.json();

        if (Array.isArray(data)) {
          // Filter out objects where roleName is "SUPER_ADMIN"
          const filteredRoles = data.filter((role) => role.roleName !== 'SUPER_ADMIN');

          setRoles(filteredRoles);
        } else {
          console.error('Unexpected API response format:', data);
          setRoles([]);
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
        showSnackbar('Error fetching roles. Please try again.', 'error');
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${url}/api/departments`);
        const data = await response.json();
        setDepartments(data);
      } catch (err) {
        console.error('Error fetching departments:', err);
        showSnackbar('Error fetching departments. Please try again.', 'error');
      }
    };

    const fetchWarehouses = async () => {
      try {
        const response = await fetch(`${url}/api/warehouses`);
        const data = await response.json();
        setWarehouses(data);
      } catch (err) {
        console.error('Error fetching warehouses:', err);
        showSnackbar('Error fetching warehouses. Please try again.', 'error');
      }
    };

    fetchRoles();
    fetchDepartments();
    fetchWarehouses();
  }, []);

  // Load user data when the modal opens
  useEffect(() => {
    const url = import.meta.env.VITE_APP_URL;
    if (user) {
      console.log('User data in modal:', user); // Debugging: Check if user has _id
      setFormValues({
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || '',
        roleId: user.roleId || '',
        warehouse: { name: user.warehouse || '', _id: user.warehouseId || '' },
        department: { name: user.department || '', _id: user.departmentId || '' },
        password: '',
        confirmPassword: '',
        _id: user._id || '', // Ensure _id is set
      });

      // Fetch warehouses for the user's department
      const fetchWarehousesForUser = async () => {
        try {
          const response = await fetch(`${url}/api/warehouses`);
          if (!response.ok) throw new Error('Failed to fetch warehouses');
          const data = await response.json();

          // Filter warehouses based on the user's department ID
          const filteredWarehouses = data.filter((wh) => wh.departmentId._id === user.departmentId);

          setWarehouses(filteredWarehouses); // Update the warehouses state
        } catch (err) {
          console.error('Error fetching warehouses:', err);
          showSnackbar('Error fetching warehouses. Please try again.', 'error');
        }
      };

      fetchWarehousesForUser();
    }
  }, [user, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleWareHouseChange = (event) => {
    const selectedWarehouse = warehouses.find((wh) => wh.name === event.target.value);
    setFormValues({
      ...formValues,
      warehouse: { name: selectedWarehouse.name, _id: selectedWarehouse._id },
    });
  };

  const handleDepartmentChange = async (event) => {
    const url = import.meta.env.VITE_APP_URL;
    const selectedDepartment = departments.find((dept) => dept.name === event.target.value);
    setFormValues({
      ...formValues,
      department: { name: selectedDepartment.name, _id: selectedDepartment._id },
    });

    // Fetch warehouses for the selected department
    try {
      const response = await fetch(`${url}/api/warehouses`);
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      const data = await response.json();

      // Filter warehouses based on the selected department ID
      const filteredWarehouses = data.filter(
        (wh) =>
          wh.departmentId._id === selectedDepartment._id && // Compare departmentId._id
          wh.isActive === true // Include only active warehouses
      );

      setWarehouses(filteredWarehouses); // Update the warehouses state

      // Automatically set the first warehouse as the default value
      // Only set warehouse if role is not MANAGER
      if (filteredWarehouses.length > 0 && formValues.role !== 'MANAGER') {
        setFormValues((prevValues) => ({
          ...prevValues,
          warehouse: { name: filteredWarehouses[0].name, _id: filteredWarehouses[0]._id },
        }));
      } else {
        // If no warehouses are found or role is MANAGER, reset the warehouse field
        setFormValues((prevValues) => ({
          ...prevValues,
          warehouse: { name: '', _id: '' },
        }));
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      showSnackbar('Error fetching warehouses. Please try again.', 'error');
    }
  };

  const handleRoleChange = (event) => {
    const selected = roles.find((r) => r.roleName === event.target.value);

    // If the selected role is MANAGER, clear the warehouse selection
    if (selected?.roleName === 'MANAGER') {
      setFormValues({
        ...formValues,
        role: selected.roleName,
        roleId: selected.roleId,
        warehouse: { name: '', _id: '' }, // Clear warehouse when MANAGER is selected
      });
    } else {
      setFormValues({
        ...formValues,
        role: selected?.roleName || '',
        roleId: selected?.roleId || '',
      });
    }
  };

  // Inside your handleSubmit function in UpdateSignUpModal.jsx

  const handleSubmit = async () => {
    const url = import.meta.env.VITE_APP_URL;
    setLoading(true);
    setError('');

    // Password validation
    if (formValues.password) {
      // Check if passwords match
      if (formValues.password !== formValues.confirmPassword) {
        setError("Passwords don't match");
        setLoading(false);
        showSnackbar("Passwords don't match", 'error');
        return;
      }

      // Add password strength validation if needed
      if (formValues.password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        showSnackbar('Password too short', 'error');
        return;
      }
    }

    const payload = {
      fullName: formValues.fullName,
      email: formValues.email,
      role: formValues.role,
      roleId: formValues.roleId,
      warehouse: formValues.warehouse.name,
      warehouseId: formValues.warehouse._id,
      department: formValues.department.name,
      departmentId: formValues.department._id,
      _id: formValues._id,
    };

    // Only include password in payload if it's provided
    if (formValues.password) {
      payload.password = formValues.password;
      console.log('Password update included in request');
    }

    try {
      const response = await fetch(`${url}/api/user/updateusers/${formValues._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const data = await response.json();

      // Show specific success message for password update
      if (formValues.password) {
        showSnackbar('User updated successfully with new password!', 'success');
      } else {
        showSnackbar('User updated successfully!', 'success');
      }

      // Call onUpdate with the updated user data
      onUpdate({ ...payload, _id: formValues._id });
      onClose();

      // Clear password fields
      setFormValues((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      console.error('Update Error:', err.message);
      setError(err.message);
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle bgcolor="black" color="white">
          Update User
        </DialogTitle>
        <DialogContent>
          <Box>
            <Grid container spacing={2}>
              {/* Full Name Field */}
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={formValues.fullName}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              {/* Email Field */}
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>

              {/* Password Field */}
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formValues.password}
                  onChange={handleChange}
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Confirm Password Field */}
              <Grid item xs={12} md={12}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formValues.confirmPassword}
                  onChange={handleChange}
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Role Dropdown */}
              <Grid item xs={12} md={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="role-select-label">Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    value={formValues.role}
                    label="Role"
                    onChange={handleRoleChange}
                  >
                    {roles.length > 0 ? (
                      roles.map((roleType) => (
                        <MenuItem key={roleType.roleId} value={roleType.roleName}>
                          {roleType.roleName}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No Roles Available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Department Dropdown */}
              <Grid item xs={12} md={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="department-select-label">Department</InputLabel>
                  <Select
                    labelId="department-select-label"
                    value={formValues.department.name}
                    label="Department"
                    onChange={handleDepartmentChange}
                  >
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <MenuItem key={dept._id} value={dept.name}>
                          {dept.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No Departments Available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Conditionally render Warehouse Dropdown only if role is not MANAGER */}
              <Grid item xs={12} md={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="warehouse-select-label">Warehouse</InputLabel>
                  <Select
                    labelId="warehouse-select-label"
                    value={formValues.warehouse.name}
                    label="Warehouse"
                    onChange={handleWareHouseChange}
                    disabled={formValues.role === 'MANAGER' || !formValues.department._id} // Disable if role is MANAGER or no department is selected
                  >
                    {warehouses.length > 0 ? (
                      warehouses.map((wh) => (
                        <MenuItem key={wh._id} value={wh.name}>
                          {wh.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No Warehouses Available</MenuItem>
                    )}
                  </Select>
                </FormControl>
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
              backgroundColor: 'grey',
            }}
            onClick={onClose}
            variant="contained"
          >
            Cancel
          </Button>

          <LoadingButton
            onClick={handleSubmit}
            sx={{ backgroundColor: 'rgb(74,115,15,0.9)' }}
            variant="contained"
            loading={loading}
          >
            Update
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar for showing messages */}
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

UpdateSignUpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

export default UpdateSignUpModal;
