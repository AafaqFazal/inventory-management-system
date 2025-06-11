import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import { Box, Card, Stack, TextField, IconButton, Typography } from '@mui/material';

import { bgGradient } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';

export default function LoginView() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = import.meta.env.VITE_APP_URL;

      // Step 1: Authenticate user
      const loginResponse = await fetch(`${apiUrl}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();
      console.log('Login Response:', loginData); // Debugging

      if (!loginResponse.ok) throw new Error(loginData.message || 'Login failed');

      // Step 2: Extract token and user data
      const { token } = loginData; // Token is at the root level
      const { userId, roleId, fullName, role, warehouse, warehouseId, department, departmentId } =
        loginData.user;

      // Step 3: Fetch User Role Policies
      const roleResponse = await fetch(`${apiUrl}/api/roles/specificRoles/${roleId}`);
      const roleData = await roleResponse.json();

      console.log('Role Data:', roleData); // Debugging

      // Fix: Use the correct key to extract policies
      const userPolicies = roleData.policies || [];

      // Step 4: Store User Data and Token
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('token', token); // Store the token
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('warehouse', warehouse);
      sessionStorage.setItem('warehouseId', warehouseId);
      sessionStorage.setItem('department', department);
      sessionStorage.setItem('departmentId', departmentId);
      sessionStorage.setItem('email', email);
      sessionStorage.setItem('roleId', roleId);
      sessionStorage.setItem('fullName', fullName);
      sessionStorage.setItem('userPolicies', JSON.stringify(userPolicies));

      // Step 5: Redirect to Dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const styles = {
    ...bgGradient({
      color: alpha(theme.palette.background.default, 0.9),
      imgUrl: 'https://simplymemoirs.s3.us-west-1.amazonaws.com/images/image.png-80', // Correct image URL
    }),
    height: '100vh', // Use 100vh to cover the full viewport height
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Box sx={styles}>
      <Logo
        sx={{
          position: 'fixed',
          top: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
        }}
      />

      <Stack alignItems="center" justifyContent="center" sx={{ height: 1 }}>
        <Card sx={{ p: 5, width: 1, maxWidth: 500 }}>
          <Typography variant="h4" textAlign="center">
            Inventory Management System
          </Typography>
          <Typography variant="h5" fontWeight="large" textAlign="center" marginY={2}>
            Sign In
          </Typography>

          {/* <Typography variant="body2" sx={{ mt: 2, mb: 5 }}>
            Don’t have an account?
            <span style={{ marginLeft: '3px' }}>
              <Link to="/sign-up" variant="subtitle2">
                Get started
              </Link>
            </span>
          </Typography> */}

          <Stack spacing={3}>
            <TextField
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          </Stack>

          {error && <Typography color="error">{error}</Typography>}

          <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ my: 3 }}>
            {/* <Link to="/forgot-password" variant="subtitle2" underline="hover">
              Forgot password?
            </Link> */}
          </Stack>

          <LoadingButton
            fullWidth
            size="large"
            variant="contained"
            color="inherit"
            loading={loading}
            onClick={handleLogin}
          >
            Login
          </LoadingButton>
        </Card>
      </Stack>
    </Box>
  );
}
