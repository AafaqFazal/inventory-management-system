// new

import { useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

import DeleteConfirmationModal from './view/deleteModel'; // Import the delete modal

// ----------------------------------------------------------------------

export default function UserTableRow({
  id,
  row,
  selected,
  fullName,
  email,
  password,
  role,
  warehouse,
  department,
  handleClick,
  onEdit,
  onDelete,
}) {
  const [open, setOpen] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // State to manage delete modal visibility

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleOpenEditModal = () => {
    onEdit({
      id,
      fullName,
      email,
      password,
      role,
      warehouse,
      department,
    });
    setOpen(null); // Close the menu after opening the edit modal
  };

  const handleOpenDeleteModal = () => {
    setDeleteModalOpen(true);
    handleCloseMenu(); // Close the menu when delete is clicked
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
  };

  const handleProceedDelete = () => {
    onDelete(id); // Pass the id when deleting
    setDeleteModalOpen(false); // Close the modal after confirming delete
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          {role === 'SUPER_ADMIN' ? (
            <Checkbox disableRipple checked={selected} onChange={handleClick} disabled />
          ) : (
            <Checkbox disableRipple checked={selected} onChange={handleClick} />
          )}
        </TableCell>

        <TableCell>{fullName}</TableCell>
        <TableCell>{email}</TableCell>
        <TableCell>{password}</TableCell>
        <TableCell>{role}</TableCell>
        <TableCell>{warehouse}</TableCell>
        <TableCell>{department}</TableCell>
        {/* <TableCell>{isActive ? 'Active' : 'Deactive'}</TableCell> */}
        {/* <TableCell>{createdBy}</TableCell> */}

        <TableCell align="right">
          {role !== 'SUPER_ADMIN' && (
            <IconButton onClick={handleOpenMenu}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      <Popover open={!!open} anchorEl={open} onClose={handleCloseMenu}>
        <MenuItem onClick={handleOpenEditModal}>
          <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteModal} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Popover>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onProceed={handleProceedDelete}
      />
    </>
  );
}

UserTableRow.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  // name: PropTypes.string.isRequired,
  fullName: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  warehouse: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  // isActive: PropTypes.bool.isRequired,
  // createdBy: PropTypes.string.isRequired,
  row: PropTypes.string,
  handleClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired, // Add prop types for onEdit
  onDelete: PropTypes.func.isRequired, // Add prop types for onDelete
};
