import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import Nav from './nav';
import Main from './main';
import Header from './header';
import Footer from './footer';

export default function DashboardLayout({ children }) {
  const [openNav, setOpenNav] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState([]);

  return (
    <>
      <Header onOpenNav={() => setOpenNav(true)} />

      <Box
        sx={{
          minHeight: '100vh', // Ensure the layout takes at least the full viewport height
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          position: 'relative', // Relative positioning for the layout
          paddingBottom: '60px', // Add padding to avoid overlap with the fixed footer
        }}
      >
        <Nav openNav={openNav} onCloseNav={() => setOpenNav(false)} />

        <Main sx={{ marginBottom: '30px' }}>{children}</Main>
      </Box>

      {/* Fixed Footer at the bottom of the screen */}
      <Footer />

      {/* Snackbar to display messages at the bottom-right corner */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={5000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} // Position: bottom-right
        sx={{
          marginBottom: '80px', // Adjust margin to avoid overlap with the footer
        }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{
            width: '100%',
            backgroundColor: '#abf7b1', // Green background color
            color: 'black', // Black text color
          }}
        >
          {snackbarMessage || 'Default message for testing'}
        </Alert>
      </Snackbar>
    </>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};
