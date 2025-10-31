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
    <TableHead sx={{ backgroundColor: 'black' }}>
      {/* Add the group header row */}
      <TableRow>
        {/* Empty cell for checkbox column */}
        <TableCell
          padding="checkbox"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        />

        {/* Item Details group */}
        <TableCell
          colSpan={itemDetailsColumns}
          align="center"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            fontWeight: 'bold',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          Item Details
        </TableCell>

        {/* PO Details group */}
        <TableCell
          colSpan={poDetailsColumns}
          align="center"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          Supplier PO Details
        </TableCell>

        {/* Empty cell for actions column */}
        <TableCell
          sx={{
            backgroundColor: 'black',
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        />
      </TableRow>

      {/* Original header row */}
      <TableRow>
        <TableCell
          padding="checkbox"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          }}
        >
          {/* <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            sx={{
              color: 'white',
              '&.Mui-checked': {
                color: 'white',
              },
              '&.MuiCheckbox-indeterminate': {
                color: 'white',
              },
            }}
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
              backgroundColor: 'black',
              color: 'white',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              // Add a right border after the last item details column
              ...(index === itemDetailsColumns - 1
                ? {
                    borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                  }
                : {}),
            }}
          >
            <TableSortLabel
              hideSortIcon
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={onSort(headCell.id)}
              sx={{
                color: 'white !important',
                '&:hover': {
                  color: 'white',
                },
                '&.Mui-active': {
                  color: 'white',
                },
                '& .MuiTableSortLabel-icon': {
                  color: 'white !important',
                },
              }}
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
