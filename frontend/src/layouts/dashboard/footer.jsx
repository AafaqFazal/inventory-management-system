import React from 'react';

import { Box, Typography } from '@mui/material';

const Footer = () => (
  <Box
    component="footer"
    sx={{
      backgroundColor: '#00284C', // Dark blue background
      color: 'white', // White text
      textAlign: 'center', // Center-align text
      padding: '16px', // Add some padding
      position: 'relative', // Fixed position at the bottom
      bottom: 0, // Stick to the bottom
      left: 0, // Align to the left
      right: 0, // Align to the right
      // marginTop: '15px',
      // zIndex: 1000, // Ensure it stays above other content
    }}
  >
    <Typography variant="body2">
      © 2025 Rawasi Albina. All rights reserved. | Developed by Aafaq Fazal
    </Typography>
  </Box>
);

export default Footer;
