import React from 'react';
import PropTypes from 'prop-types';

import {
  Dialog,
  Button,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
} from '@mui/material';

export default function DeleteAllConfirmationModal({ open, onClose, onProceed }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Are you sure you want to delete the selected items?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          sx={{
            backgroundColor: 'black',
            color: 'white',
            '&:hover': {
              backgroundColor: '#333333',
            },
          }}
          onClick={onClose}
          color="primary"
        >
          Cancel
        </Button>
        <Button
          sx={{
            backgroundColor: 'red',
            color: 'white',
            '&:hover': {
              backgroundColor: '#C0392B',
            },
          }}
          onClick={onProceed}
          color="error"
          autoFocus
        >
          Proceed
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DeleteAllConfirmationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onProceed: PropTypes.func.isRequired,
};
