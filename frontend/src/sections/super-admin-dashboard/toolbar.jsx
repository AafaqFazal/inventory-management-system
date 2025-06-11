import PropTypes from 'prop-types';

import { Button, Toolbar, OutlinedInput, InputAdornment } from '@mui/material';

import Iconify from 'src/components/iconify';

export default function UserTableToolbar({ filterName, onFilterName }) {
  return (
    <Toolbar
      sx={{
        height: 96,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: (theme) => theme.spacing(0, 1, 0, 3),
      }}
    >
      {/* Attendance Overview Title */}
      <div style={{ fontWeight: 'bold', color: '#3f3f46' }}>Attendance Overview</div>

      {/* Search Bar */}
      <OutlinedInput
        value={filterName}
        onChange={onFilterName}
        placeholder="Quick Search..."
        startAdornment={
          <InputAdornment position="start">
            <Iconify
              icon="eva:search-fill"
              sx={{ color: 'text.disabled', width: 20, height: 20 }}
            />
          </InputAdornment>
        }
        sx={{ width: 240, borderRadius: 2 }}
      />

      {/* Date Picker */}
      <OutlinedInput
        placeholder="29 July 2023" // Placeholder text for date picker
        startAdornment={
          <InputAdornment position="start">
            <Iconify icon="eva:calendar-outline" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
          </InputAdornment>
        }
        sx={{ width: 160, borderRadius: 2, bgcolor: 'grey.100' }}
      />

      {/* View Attendance Button */}
      <Button
        variant="contained"
        sx={{
          bgcolor: '#6C5CE7',
          color: 'white',
          textTransform: 'none',
          borderRadius: 2,
          padding: '8px 16px',
          '&:hover': {
            bgcolor: '#5B4AC8',
          },
        }}
      >
        View Attendance
      </Button>
    </Toolbar>
  );
}

UserTableToolbar.propTypes = {
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
};
