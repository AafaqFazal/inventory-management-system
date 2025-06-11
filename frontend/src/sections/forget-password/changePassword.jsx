import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import {
  Box,
  Card,
  Stack,
  Button,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';

export default function SignUpView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const auth = getAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const oobCode = urlParams.get('oobCode');

  useEffect(() => {
    if (oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then((retrievedEmail) => {
          setEmail(retrievedEmail);
        })
        .catch(() => {
          setError('Invalid or expired password reset link.');
        });
    }
  }, [oobCode, auth]);

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Logo
          sx={{
            position: 'fixed',
            top: { xs: 16, md: 24 },
            left: { xs: 16, md: 24 },
          }}
        />
        <Card
          sx={{
            p: 5,
            width: 1,
            maxWidth: 500,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4">Password Reset Successfully</Typography>
          <Typography sx={{ mt: 2 }}>
            Your password has been reset successfully. You can now log in with your new password.
          </Typography>
          <Button
            fullWidth
            size="large"
            color="primary"
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => navigate('/')}
          >
            Go to Login
          </Button>
        </Card>
      </Box>
    );
  }

  const renderForm = (
    <>
      <Stack spacing={4}>
      <Typography variant="body" color="textSecondary"textAlign="left"marginTop={2} >
          Your new password must be different from previous used password
        </Typography>
        
        <TextField
          name="password"
          label="New Password"
          placeholder="Enter new password"
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
          placeholder="Re-enter new password"
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
      </Stack>
      <Button
        fullWidth
        size="large"
        variant="contained"
        color="inherit"
        sx={{ mt: 5 }}
        onClick={handleResetPassword}
      >
        Reset Password
      </Button>
    </>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <Logo
        sx={{
          position: 'fixed',
          top: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
        }}
      />

      <Card
        sx={{
          p: 5,
          width: 1,
          maxWidth: 500,
          height:600,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" textAlign="left" >Student Information System</Typography>
        <Typography variant="h5" textAlign="left" marginTop={4} marginBottom={2}>Create New Password</Typography>
        {renderForm}
      </Card>
    </Box>
  );
}
