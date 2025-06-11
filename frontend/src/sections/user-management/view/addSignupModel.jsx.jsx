import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Stack,
  Alert,
  Button,
  Dialog,
  Select,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  InputAdornment,
} from '@mui/material';

import Iconify from 'src/components/iconify';

const SignUpModal = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [warehouse, setWarehouse] = useState({ name: '', _id: '' });
  const [department, setDepartment] = useState({ name: '', _id: '' });
  const [selectedRole, setSelectedRole] = useState({ role: '', roleId: '' });
  const [departments, setDepartments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

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

  // Fetch departments
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/departments`);
        const data = await response.json();
        setDepartments(data); // Include _id in the response
      } catch (err) {
        console.error('Error fetching departments:', err);
        showSnackbar('Error fetching departments. Please try again.', 'error');
      }
    };

    fetchDepartments();
  }, []);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      const url = import.meta.env.VITE_APP_URL;
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

    fetchRoles();
  }, []);

  // Handle department selection
  const handleDepartmentChange = async (event) => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    const selectedDepartment = departments.find((dept) => dept.name === event.target.value);
    setDepartment({
      name: selectedDepartment.name,
      _id: selectedDepartment._id,
    });

    // Fetch warehouses for the selected department
    try {
      const response = await fetch(`${apiUrl}/api/warehouses`);
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
      if (filteredWarehouses.length > 0 && selectedRole.role !== 'MANAGER') {
        setWarehouse({
          name: filteredWarehouses[0].name,
          _id: filteredWarehouses[0]._id,
        });
      } else {
        // If no warehouses are found, reset the warehouse field
        setWarehouse({ name: '', _id: '' });
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      showSnackbar('Error fetching warehouses. Please try again.', 'error');
    }
  };

  // Handle signup
  const handleSignUpWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Reset all error messages
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    const url = import.meta.env.VITE_APP_URL;

    // Validate passwords match
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match");
      setLoading(false);
      showSnackbar("Passwords don't match", 'error');
      return;
    }

    // Validate required fields
    if (!department.name || !selectedRole.role || !selectedRole.roleId) {
      setGeneralError('Please fill all required fields');
      setLoading(false);
      showSnackbar('Please fill all required fields', 'error');
      return;
    }

    try {
      const response = await fetch(`${url}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role: selectedRole.role,
          roleId: selectedRole.roleId,
          warehouse: warehouse.name,
          warehouseId: warehouse._id,
          department: department.name,
          departmentId: department._id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.message.includes('email')) {
          setEmailError(data.message); // Show email-specific error
        } else {
          setGeneralError(data.message); // Show general error
        }
        throw new Error(data.message || 'Signup failed');
      }

      // Reset form after successful signup
      setEmail('');
      setFullName('');
      setPassword('');
      setConfirmPassword('');
      setWarehouse({ name: '', _id: '' });
      setDepartment({ name: '', _id: '' });
      setSelectedRole({ role: '', roleId: '' });

      showSnackbar('User registered successfully!', 'success');
      onClose();
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection
  const handleChange = (event) => {
    const selected = roles.find((r) => r.roleName === event.target.value);
    setSelectedRole({
      role: selected?.roleName || '',
      roleId: selected?.roleId || '', // Store roleId as well
    });

    // If the selected role is MANAGER, clear the warehouse selection
    if (selected?.roleName === 'MANAGER') {
      setWarehouse({ name: '', _id: '' }); // Clear the warehouse selection
    }
  };

  // Handle warehouse selection
  const handleWareHouseChange = (event) => {
    const selectedWarehouse = warehouses.find((wh) => wh.name === event.target.value);
    setWarehouse({
      name: selectedWarehouse.name,
      _id: selectedWarehouse._id,
    });
    console.log('selectedWarehouse', selectedWarehouse);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Users</DialogTitle>
        <DialogContent>
          <Box>
            <Grid container spacing={2}>
              {/* Full Name Field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  margin="normal"
                  error={Boolean(error)}
                  helperText={error}
                />
              </Grid>

              {/* Email Field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  margin="normal"
                  error={emailError}
                  helperText={emailError}
                />
              </Grid>

              {/* Password Field */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  error={passwordError}
                  helperText={passwordError}
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  margin="normal"
                  error={passwordError}
                  helperText={passwordError}
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
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="role-select-label">Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    value={selectedRole.role}
                    label="Role"
                    onChange={handleChange}
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
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="department-select-label">Department</InputLabel>
                  <Select
                    labelId="department-select-label"
                    value={department.name}
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

              {/* Conditionally render Warehouse Dropdown */}
              {selectedRole.role !== 'MANAGER' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="warehouse-select-label">Warehouse</InputLabel>
                    <Select
                      labelId="warehouse-select-label"
                      value={warehouse.name}
                      label="Warehouse"
                      onChange={handleWareHouseChange}
                      disabled={!department._id} // Disable if no department is selected
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
              )}
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

          <LoadingButton
            onClick={handleSignUpWithEmail}
            sx={{
              backgroundColor: '#00284C',
              color: 'white',
              '&:hover': {
                backgroundColor: '#00288C',
              },
            }}
            loading={loading}
          >
            Add User
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

SignUpModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SignUpModal;
