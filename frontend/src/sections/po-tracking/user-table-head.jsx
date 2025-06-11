import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';

import { visuallyHidden } from './utils';

// ----------------------------------------------------------------------

export default function UserTableHead({
  order,
  orderBy,
  rowCount,
  headLabel,
  numSelected,
  onRequestSort,
  onSelectAllClick,
}) {
  const onSort = (property) => (event) => {
    onRequestSort(event, property);
  };

  // Define column groups
  const itemDetailsColumns = 3; // itemCode, description, brand
  const poDetailsColumns = 6; // scheme, poQty, receivedPoQty, remainingQty, unit

  return (
    <TableHead>
      {/* Add the group header row */}
      <TableRow>
        {/* Empty cell for checkbox column */}
        <TableCell padding="checkbox" />

        {/* Item Details group */}
        <TableCell
          colSpan={itemDetailsColumns}
          align="center"
          sx={{
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
            borderRight: '1px solid rgba(224, 224, 224, 1)',
          }}
        >
          Item Details
        </TableCell>

        {/* PO Details group */}
        <TableCell
          colSpan={poDetailsColumns}
          align="center"
          sx={{
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
          }}
        >
          Supplier PO Details
        </TableCell>

        {/* Empty cell for actions column */}
        <TableCell />
      </TableRow>

      {/* Original header row */}
      <TableRow>
        <TableCell padding="checkbox">
          {/* <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
          /> */}
        </TableCell>

        {headLabel.map((headCell, index) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{
              width: headCell.width,
              minWidth: headCell.minWidth,
              // Add a right border after the last item details column
              ...(index === itemDetailsColumns - 1
                ? {
                    borderRight: '1px solid rgba(224, 224, 224, 1)',
                  }
                : {}),
            }}
          >
            <TableSortLabel
              hideSortIcon
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={onSort(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box sx={{ ...visuallyHidden }}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

UserTableHead.propTypes = {
  order: PropTypes.oneOf(['asc', 'desc']),
  orderBy: PropTypes.string,
  rowCount: PropTypes.number,
  headLabel: PropTypes.array,
  numSelected: PropTypes.number,
  onRequestSort: PropTypes.func,
  onSelectAllClick: PropTypes.func,
};
