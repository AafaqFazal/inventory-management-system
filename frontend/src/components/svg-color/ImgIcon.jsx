// src/components/ImgIcon.jsx
import PropTypes from 'prop-types';

import { Box } from '@mui/material';

const ImgIcon = ({ src, sx, alt = '' }) => (
  <Box
    component="img"
    src={src}
    alt={alt}
    sx={{
      width: 24,
      height: 24,
      ...sx,
    }}
  />
);

ImgIcon.propTypes = {
  src: PropTypes.string.isRequired,
  sx: PropTypes.object,
  alt: PropTypes.string,
};

export default ImgIcon;
