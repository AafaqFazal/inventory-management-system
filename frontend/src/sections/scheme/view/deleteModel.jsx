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

export default function DeleteConfirmationModal({ open, onClose, onProceed }) {
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
          Are you sure you want to delete this item?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          sx={{
            backgroundColor: 'grey',
          }}
          onClick={onClose}
          variant="contained"
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
DeleteConfirmationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onProceed: PropTypes.func.isRequired,
};
