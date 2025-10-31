import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import UserTableRow from '../user-table-row';
import UserTableHead from '../user-table-head';
import TableEmptyRows from '../table-empty-rows';
import AddSignupModal from './addSignupModel.jsx';
import UpdateSignUpModal from './updateSignupModel';
import { emptyRows, getComparator } from '../utils';
import UserTableToolbar from '../user-table-toolbar';

// ----------------------------------------------------------------------

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
  const [loading, setLoading] = useState(false); // Add loading state

  // Fetch users from the API
  const fetchUsers = async () => {
    const url = import.meta.env.VITE_APP_URL;
    setLoading(true); // Start loading
    try {
      const response = await fetch(`${url}/api/user/getusers`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();

      // Ensure data.users is an array
      if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        console.error('API returned unexpected structure:', data);
        setUsers([]); // Set an empty array to avoid crashes
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]); // Ensure it's always an array
    } finally {
      setLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user
  const deleteUser = async (id) => {
    const url = import.meta.env.VITE_APP_URL;
    if (!id) {
      console.error('Error: user id is undefined');
      return;
    }
    try {
      const response = await fetch(`${url}/api/user/deleteUser/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user');
      fetchUsers(); // Refresh the user list after deletion
    } catch (err) {
      console.error('Error deleting user:', err);
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
    // console.log('User data passed to modal:', user); // Debugging: Check if user has _id
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

    // Ensure updatedUser contains _id
    if (!updatedUser._id) {
      // console.error('User ID is missing in updatedUser:', updatedUser);
      return;
    }

    try {
      const response = await fetch(`${url}/api/user/updateusers/${updatedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const data = await response.json();

      // Update the users state with the new data
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user._id === updatedUser._id ? updatedUser : user))
      );

      handleCloseUpdateModal(); // Close modal
    } catch (error) {
      // console.error('Error updating user:', error);
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
      const response = await fetch(`${url}/api/user/deleteAllUsers`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete all users');
      setSelected([]);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting users:', error);
    }
  };

  const dataFiltered = Array.isArray(users)
    ? users
        .sort(getComparator(order, orderBy))
        .filter((row) => row.fullName?.toLowerCase().includes(filterName.toLowerCase()))
    : [];

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">User Management</Typography>
        <Button
          variant="contained"
          sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={handleOpenAddModal}
        >
          Add
        </Button>
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
                  { id: 'fullName', label: 'Full Name' },
                  { id: 'email', label: 'Email' },
                  { id: 'password', label: 'Password' },
                  { id: 'role', label: 'Role' },
                  { id: 'warehouse', label: 'Warehouse' },
                  { id: 'department', label: 'Department' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <UserTableRow
                      key={row._id}
                      id={row._id}
                      fullName={row.fullName}
                      email={row.email}
                      password="********" // Mask password
                      role={row.role}
                      warehouse={row.warehouse}
                      department={row.department}
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

      {/* Modals */}
      <AddSignupModal open={openAddModal} onClose={handleCloseAddModal} />
      <UpdateSignUpModal
        open={openUpdateModal}
        onClose={handleCloseUpdateModal}
        user={currentUser}
        onUpdate={handleUpdateUser}
      />
      <UpdateSignUpModal
        open={openUpdateModal}
        onClose={handleCloseUpdateModal}
        user={currentUser}
        onUpdate={handleUpdateUser}
      />
    </Container>
  );
}
