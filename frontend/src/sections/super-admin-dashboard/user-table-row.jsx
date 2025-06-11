import { useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

export default function UserTableRow({
  idNumber,
  name,
  status,
  date,
  clockIn,
  clockOut,
}) {
  return (
    <TableRow hover tabIndex={-1}>
      <TableCell>{idNumber}</TableCell>
      <TableCell>{name}</TableCell>
      <TableCell>{status}</TableCell>
      <TableCell>{date}</TableCell>
      <TableCell>{clockIn}</TableCell>
      <TableCell>{clockOut}</TableCell>
    </TableRow>
  );
}

UserTableRow.propTypes = {
  idNumber: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  clockIn: PropTypes.string,
  clockOut: PropTypes.string,
};
