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

// eslint-disable-next-line import/no-unresolved
import Iconify from 'src/components/iconify';

import DeleteConfirmationModal from './view/deleteModel'; // Import the delete modal

// ----------------------------------------------------------------------

export default function UserTableRow({
  id,
  row,
  selected,
  code,
  name,
  // eslint-disable-next-line react/prop-types
  warehouseId,
  description,
  isActive,
  createdBy,
  handleClick,
  createdAt,
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
      code,
      name,
      warehouseId,
      description,
      isActive,
      createdBy,
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
  const role = sessionStorage.getItem('role') || '';
  const isManager = role.trim().toUpperCase() === 'MANAGER';
  const isSuperAdmin = role.trim().toUpperCase() === 'SUPER_ADMIN';
  const department = sessionStorage.getItem('department') || '';
  const isElectrical = department === 'Electrical';
  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={handleClick} />
        </TableCell>

        <TableCell>{code}</TableCell>
        {!isElectrical && <TableCell>{name}</TableCell>}
        {/* <TableCell>{warehouseId}</TableCell> */}
        <TableCell>{description}</TableCell>
        <TableCell>{isActive ? 'Active' : 'Deactive'}</TableCell>
        <TableCell>{createdBy}</TableCell>
        <TableCell>{createdAt}</TableCell>

        <TableCell align="right">
          {!(isManager || isSuperAdmin) && (
            <IconButton onClick={handleOpenMenu}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      <Popover open={!!open} anchorEl={open} onClose={handleCloseMenu}>
        <MenuItem sx={{ color: 'rgb(74,115,15,0.9)' }} onClick={handleOpenEditModal}>
          <Iconify icon="solar:pen-bold" sx={{ mr: 1, color: 'rgb(74,115,15,0.9)' }} />
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
  name: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  createdBy: PropTypes.string.isRequired,
  createdAt: PropTypes.string.isRequired,
  row: PropTypes.string,
  handleClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired, // Add prop types for onEdit
  onDelete: PropTypes.func.isRequired, // Add prop types for onDelete
};
