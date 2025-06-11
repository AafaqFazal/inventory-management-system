import { useState } from 'react';
import PropTypes from 'prop-types';

import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

// eslint-disable-next-line import/no-unresolved
import Iconify from 'src/components/iconify';

import DeleteAllConfirmationModal from './view/deleteAllmodel';

export default function UserTableToolbar({ numSelected, filterName, onFilterName, onDeleteAll }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // State for modal

  // Handle modal open
  const handleOpenDeleteModal = () => {
    setDeleteModalOpen(true);
  };

  // Handle modal close
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  // Trigger delete operation
  const handleProceedDelete = () => {
    onDeleteAll(); // Call the delete function passed from the parent component
    handleCloseDeleteModal(); // Close the modal after deletion
  };

  return (
    <Toolbar
      sx={{
        height: 96,
        display: 'flex',
        justifyContent: 'space-between',
        p: (theme) => theme.spacing(0, 1, 0, 3),
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <OutlinedInput
          fullWidth
          value={filterName}
          onChange={onFilterName}
          placeholder="Search..."
          startAdornment={
            <InputAdornment position="start">
              <Iconify
                icon="eva:search-fill"
                sx={{ color: 'text.disabled', width: 20, height: 20 }}
              />
            </InputAdornment>
          }
        />
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete All">
          {/* <IconButton onClick={handleOpenDeleteModal}>
            <Iconify icon="eva:trash-2-fill" />
          </IconButton> */}
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <Iconify icon="ic:round-filter-list" />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteAllConfirmationModal
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onProceed={handleProceedDelete}
      />
    </Toolbar>
  );
}

UserTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  onDeleteAll: PropTypes.func, // Prop validation for delete function
};
