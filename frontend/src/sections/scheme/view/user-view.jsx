import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import { Card, Alert, Snackbar } from '@mui/material';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

// eslint-disable-next-line import/no-unresolved
import Iconify from 'src/components/iconify';
// eslint-disable-next-line import/no-unresolved
import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import UserTableRow from '../user-table-row';
import AddSchemeModal from './addSchemeModel';
import UserTableHead from '../user-table-head';
import TableEmptyRows from '../table-empty-rows';
import UpdateSchemeModal from './updateSchemeModel';
import UserTableToolbar from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

// ----------------------------------------------------------------------

// Utility function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function UserPage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [users, setUsers] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // Can be "success", "error", "warning", "info"
  });

  const warehouseId = sessionStorage.getItem('warehouseId');
  const departmentId = sessionStorage.getItem('departmentId');
  const department = sessionStorage.getItem('department');
  const role = sessionStorage.getItem('role');
  const isPONumber = (role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom';
  const isPO = department === 'Telecom';

  // Function to show Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch warehouses from the API
  const fetchWarehouses = async () => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${url}/api/warehouses`);
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      return [];
    }
  };

  // Fetch users from the API
  const fetchUsers = useCallback(async () => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      console.log('Fetching schemes for role:', role);
      const response = await fetch(`${url}/api/schemes`);
      if (!response.ok) throw new Error('Failed to fetch schemes');
      const data = await response.json();

      console.log('Fetched Data:', data);

      let filteredData = [];

      if (role === 'SUPER_ADMIN') {
        filteredData = data; // No filtering needed
      } else if (role === 'WAREHOUSE_USER') {
        filteredData = data.filter(
          (x) => x.isActive === true && String(x.warehouseId?._id) === warehouseId
        );
      } else if (role === 'MANAGER') {
        const warehouses = await fetchWarehouses();
        const departmentWarehouses = warehouses.filter(
          (w) => String(w.departmentId?._id || w.departmentId) === departmentId
        );
        const warehouseIds = departmentWarehouses.map((w) => String(w._id));
        filteredData = data.filter(
          (x) =>
            x.isActive === true &&
            warehouseIds.includes(String(x.warehouseId?._id || x.warehouseId))
        );
      }

      console.log('Filtered Data:', filteredData);
      setUsers(filteredData);
    } catch (error) {
      console.error('Error fetching schemes:', error);
    }
  }, [role, warehouseId, departmentId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Delete user
  const deleteUser = async (id) => {
    const url = import.meta.env.VITE_APP_URL;
    if (!id) {
      console.error('Error: user id is undefined');
      return;
    }
    try {
      const response = await fetch(`${url}/api/schemes/${id}`, {
        method: 'DELETE',
      });
      showSnackbar('Scheme Deleted successfully!', 'success');
      if (!response.ok) throw new Error('Failed to delete scheme');
      fetchUsers();
    } catch (err) {
      showSnackbar('Error Deleting Scheme', 'error');
      console.error('Error deleting scheme:', err);
    }
  };

  // Add Modal Handlers
  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => {
    setOpenAddModal(false);
    fetchUsers();
  };

  // Update Modal Handlers
  const handleOpenUpdateModal = (user) => {
    setCurrentUser(user);
    setOpenUpdateModal(true);
  };
  const handleCloseUpdateModal = () => {
    setOpenUpdateModal(false);
    setCurrentUser(null);
  };

  // Handle updated user data
  const handleUpdateUser = async (updatedUser) => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${url}/api/schemes/${updatedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      showSnackbar('Scheme updated successfully!', 'success');
      if (!response.ok) throw new Error('Failed to update scheme');
      await fetchUsers();
      handleCloseUpdateModal();
    } catch (error) {
      showSnackbar('Error updating scheme!', 'error');
      console.error('Error updating scheme:', error);
    }
  };

  // Sorting and Filtering Logic
  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = users.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };
  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleDeleteAll = async () => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      const deleteRequests = selected.map((id) =>
        fetch(`${url}/api/schemes/${id}`, { method: 'DELETE' })
      );
      showSnackbar('Selected Schemes Deleted successfully!', 'success');
      await Promise.all(deleteRequests);
      setSelected([]);
      fetchUsers();
    } catch (error) {
      showSnackbar('Error in Selected Scheme Deleted', 'error');
      console.error('Error deleting schemes:', error);
    }
  };

  const dataFiltered = users
    .filter((row) => row.name?.toLowerCase().includes(filterName.toLowerCase())) // Filter by name
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by createdAt (newest first)

  const notFound = !dataFiltered.length && !!filterName;

  const isManager = role === 'MANAGER';

  return (
    <Container >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">
          {isPONumber ? 'PO Number' : 'Scheme'} {/* Conditional rendering */}
        </Typography>
        {!isManager && (
          <Button
            sx={{
              backgroundColor: '#00284C',
              color: 'white',
              '&:hover': {
                backgroundColor: '#00288C',
              },
            }}
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleOpenAddModal}
          >
            Add
          </Button>
        )}
      </Stack>

      {/* Table Section */}
      <Card>
        <UserTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
          onDeleteAll={handleDeleteAll}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={order}
                orderBy={orderBy}
                rowCount={users.length}
                numSelected={selected.length}
                onRequestSort={handleSort}
                onSelectAllClick={handleSelectAllClick}
                headLabel={[
                  { id: 'code', label: isPO ? 'PO Code' : 'Code' },
                  { id: 'name', label: isPO ? 'PO Name' : 'Name' },
                  // { id: 'warehouseId', label: 'Warehouse' },
                  { id: 'description', label: 'Description' },
                  { id: 'isActive', label: 'Status' },
                  { id: 'createdBy', label: 'Created By' },
                  { id: 'createdAt', label: 'Created At' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <UserTableRow
                      key={row._id}
                      code={row.code}
                      name={row.name}
                      row={row}
                      // warehouseId={row.warehouseId?.name || 'N/A'}
                      description={row.description}
                      isActive={row.isActive}
                      createdBy={row.createdBy}
                      createdAt={formatDate(row.createdAt)} // Format the date
                      selected={selected.indexOf(row._id) !== -1}
                      handleClick={(event) => handleClick(event, row._id)}
                      onEdit={() => handleOpenUpdateModal(row)}
                      onDelete={() => deleteUser(row._id)}
                    />
                  ))}
                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(page, rowsPerPage, users.length)}
                />
                {notFound && <TableNoData query={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modals */}
      <AddSchemeModal open={openAddModal} onClose={handleCloseAddModal} />
      <UpdateSchemeModal
        open={openUpdateModal}
        onClose={handleCloseUpdateModal}
        user={currentUser}
        onUpdate={handleUpdateUser}
      />
    </Container>
  );
}
