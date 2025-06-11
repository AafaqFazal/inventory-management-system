import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import EmailIcon from '@mui/icons-material/Email';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  Alert,
  Button,
  Snackbar,
  TextField,
  Container,
  Typography,
  InputAdornment,
} from '@mui/material';

// import { auth } from 'src/firebase';

import Logo from 'src/components/logo'; // Import Firebase auth instance
import { sendPasswordResetEmail } from 'firebase/auth';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleSendEmail = async () => {
    // try {
    //   await sendPasswordResetEmail(auth, email);
    //   setSuccessMessage('Password reset email sent successfully!');
    //   setSnackbarOpen(true);
    //   setEmailSent(true);
    // } catch (error) {
    //   console.error('Error sending email:', error);
    //   setErrorMessage(error.message || 'Failed to send password reset email');
    //   setSnackbarOpen(true);
    // }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <Box>
      <Logo
        sx={{
          position: 'fixed',
          top: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
        }}
      />
      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9f9f9',
        }}
      >
        {!emailSent ? (
          <Card
            sx={{
              padding: 4,
              width: '100%',
              maxWidth: 500,
              height: 600,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              marginTop={16}
              marginBottom={4}
              textAlign="left"
              // color="primary"
            >
              Student Information System
            </Typography>
            <Typography variant="h5" fontWeight="bold" marginBottom={4}>
              Forgot Password
            </Typography>

            <TextField
              fullWidth
              variant="outlined"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              size="large"
              variant="contained"
              color="inherit"
              onClick={handleSendEmail}
              sx={{ marginTop: '10px' }}
            >
              Send Email
            </Button>
          </Card>
        ) : (
          <Card
            sx={{
              padding: 4,
              width: '100%',
              maxWidth: 500,
              height: 600,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                marginBottom: 3,
              }}
            >
              <EmailIcon color="primary" sx={{ fontSize: '70px', marginTop: '120px' }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" marginBottom={2}>
              Check your mail
            </Typography>
            <Button
              fullWidth
              variant="contained"
              color="inherit"
              size="large"
              onClick={() => {
                setEmailSent(false);
                navigate('/');
              }}
            >
              Log in
            </Button>
            <Typography variant="body2" color="textSecondary" marginTop="15px">
              Did not receive the mail? Check your spam folder <br /> or try to{' '}
              <Typography
                component="span"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={handleSendEmail}
              >
                send it again
              </Typography>
            </Typography>
          </Card>
        )}
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={errorMessage ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {errorMessage || successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ResetPassword;
