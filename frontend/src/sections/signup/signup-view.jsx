import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Box,
  Card,
  Stack,
  Button,
  Select,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  InputLabel,
  FormControl,
} from '@mui/material';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';

export default function SignUpView() {
  console.log('okk');
  const theme = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [roles, setRoles] = useState([]);
  const [warehouse, setWarehouse] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState({ role: '', roleId: '' });
  const [departments, setDepartments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/departments`);
        const data = await response.json();
        setDepartments(data.map((dept) => dept.name)); // Extract only names
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };

    const fetchWarehouses = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/warehouses`);
        const data = await response.json();
        setWarehouses(data.map((wh) => wh.name)); // Extract only names
      } catch (err) {
        console.error('Error fetching warehouses:', err);
      }
    };

    fetchDepartments();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      const url = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${url}/api/roles/rolePolicies`);
        const data = await response.json();
        console.log('Fetched Roles:', data); // Debugging

        // Since API returns an array, setRoles directly
        setRoles(data || []);
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    };

    fetchRoles();
  }, []);

  const handleSignUpWithEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const url = import.meta.env.VITE_APP_URL;

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (!warehouse || !department || !selectedRole.role || !selectedRole.roleId) {
      setError('Please fill all required fields');
      setLoading(false);
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
          roleId: selectedRole.roleId, // Send roleId
          warehouse,
          department,
        }),
      });
      sessionStorage.setItem('warehouse', warehouse);
      sessionStorage.setItem('department', department);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      const { userId } = data; // Assuming API returns the userId

      await fetch(`${url}/api/user-policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: selectedRole.role, roleId: selectedRole.roleId }),
      });

      sessionStorage.setItem('fullName', fullName);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const selected = roles.find((r) => r.roleName === event.target.value);
    setSelectedRole({
      role: selected?.roleName || '',
      roleId: selected?.roleId || '', // Store roleId as well
    });
  };
  const handleWareHouseChange = (event) => {
    setWarehouse(event.target.value);
    console.log('valuess', event.target.value);
  };
  const handleDepartmentChange = (event) => {
    setDepartment(event.target.value);
  };
  const renderForm = (
    <>
      <Stack spacing={1}>
        <TextField
          name="fullName"
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={Boolean(error)}
          helperText={error}
        />
        <TextField
          name="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(error)}
          helperText={error}
        />

        <TextField
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(error)}
          helperText={error}
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

        <TextField
          name="confirmPassword"
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={Boolean(error)}
          helperText={error}
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
        <FormControl fullWidth>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={selectedRole.role} // Updated to use selectedRole.role
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

        <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} spacing={1}>
          <FormControl fullWidth>
            <InputLabel id="warehouse-select-label">Warehouse</InputLabel>
            <Select
              labelId="warehouse-select-label"
              id="warehouse-select"
              value={warehouse}
              label="Warehouse"
              onChange={handleWareHouseChange}
            >
              {warehouses.length > 0 ? (
                warehouses.map((wh, index) => (
                  <MenuItem key={index} value={wh}>
                    {wh}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No Warehouses Available</MenuItem>
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="department-select-label">Department</InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={department}
              label="Department"
              onChange={handleDepartmentChange}
            >
              {departments.length > 0 ? (
                departments.map((dept, index) => (
                  <MenuItem key={index} value={dept}>
                    {dept}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No Departments Available</MenuItem>
              )}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <LoadingButton
        sx={{ marginTop: '20px', background: '#00284C' }}
        fullWidth
        size="large"
        variant="contained"
        color="primary"
        loading={loading}
        onClick={handleSignUpWithEmail}
      >
        Sign Up
      </LoadingButton>
    </>
  );

  return (
    <Box>
      <Stack alignItems="center" justifyContent="center" sx={{ height: 1, margin: 'auto' }}>
        <Card
          sx={{
            p: 3,
            width: 1,
            maxWidth: 500,
          }}
        >
          <Typography variant="h4" textAlign="center">
            Inventory Management System
          </Typography>
          <Typography variant="h5" fontWeight="large" textAlign="center">
            Sign Up
          </Typography>

          <Typography variant="body2" sx={{ mt: 2, mb: 2 }}>
            Already have an account?
            <span style={{ marginLeft: '3px' }}>
              <Link to="/" variant="subtitle2" style={{ marginLeft: 2 }}>
                Login
              </Link>
            </span>
          </Typography>

          {renderForm}
        </Card>
      </Stack>
    </Box>
  );
}
