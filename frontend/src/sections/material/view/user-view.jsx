import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { Card, Alert, Snackbar, CircularProgress } from '@mui/material';

// eslint-disable-next-line import/no-unresolved
import Iconify from 'src/components/iconify';
// eslint-disable-next-line import/no-unresolved
import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import UserTableRow from '../user-table-row';
import UserTableHead from '../user-table-head';
import TableEmptyRows from '../table-empty-rows';
import AddMaterialModal from './addMaterialModel';
import UserTableToolbar from '../user-table-toolbar';
import UpdateMaterialModal from './updateMaterialModel';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isUplaodLoading, setIsUploadLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // Can be "success", "error", "warning", "info"
  });

  const fileInputRef = useRef(null);
  const [uploadFile, setUploadFile] = useState(null);

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

  const warehouseId = sessionStorage.getItem('warehouseId');
  const departmentId = sessionStorage.getItem('departmentId');
  const department = sessionStorage.getItem('department');
  const isPO = department === 'Telecom';
  const role = sessionStorage.getItem('role');

  // Fetch users from the API
  const fetchUsers = useCallback(async () => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${url}/api/materials`);
      if (!response.ok) throw new Error('Failed to fetch materials');
      const data = await response.json();

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

      setUsers(filteredData);
    } catch (error) {
      console.error('Error fetching materials:', error);
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
      const response = await fetch(`${url}/api/materials/${id}`, {
        method: 'DELETE',
      });
      showSnackbar('Materials Deleted successfully!', 'success');
      if (!response.ok) throw new Error('Failed to delete user');
      fetchUsers();
    } catch (err) {
      showSnackbar('Error Deleting Material', 'error');
      console.error('Error deleting user:', err);
    }
  };

  const handleDownload = async () => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    try {
      setIsLoading(true);

      let downloadUrl = `${apiUrl}/api/materials/download`;

      // Add role-based query parameters
      if (role === 'WAREHOUSE_USER') {
        downloadUrl += `?warehouseId=${warehouseId}&isActive=true`;
      } else if (role === 'MANAGER') {
        downloadUrl += `?departmentId=${departmentId}&isActive=true`;
      }
      // For SUPER_ADMIN, use the original URL with no filters

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'materials.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Materials downloaded successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Download failed:', error);
      setSnackbar({
        open: true,
        message: `Failed to download materials: ${error}`,
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
      // Auto upload when file is selected
      handleUpload(file);
    }
  };

  // Function to handle file upload
  const handleUpload = async (file) => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    const fileToUpload = file || uploadFile;

    if (!fileToUpload) {
      showSnackbar('Please select a file to upload', 'warning');
      return;
    }

    try {
      setIsUploadLoading(true);

      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Add user info for tracking who uploaded
      const userId = sessionStorage.getItem('userId') || 'Unknown';
      const userName = sessionStorage.getItem('role') || 'Unknown User';
      formData.append('createdBy', userName);
      formData.append('updatedBy', userName);
      const warehouseName = sessionStorage.getItem('warehouse') || '';
      formData.append('warehouseId', warehouseId);
      // formData.append('warehouseCode', warehouseCode);
      formData.append('warehouseName', warehouseName);

      const response = await fetch(`${apiUrl}/api/materials/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      showSnackbar(`Upload successful: ${result.message}`, 'success');

      // Reset file input
      fileInputRef.current.value = '';
      setUploadFile(null);

      // Refresh the materials list
      fetchUsers();
    } catch (error) {
      console.error('Upload failed:', error);
      showSnackbar(`Failed to upload materials: ${error.message}`, 'error');
    } finally {
      setIsUploadLoading(false);
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
      const response = await fetch(`${url}/api/materials/${updatedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      if (!response.ok) throw new Error('Failed to update user');
      showSnackbar('Material Update successfully!', 'success');
      await fetchUsers();
      handleCloseUpdateModal();
    } catch (error) {
      showSnackbar('Error updating Material', 'error');
      console.error('Error updating user:', error);
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
        fetch(`${url}/api/materials/${id}`, { method: 'DELETE' })
      );
      showSnackbar('Selected Materials Deleted', 'success');
      await Promise.all(deleteRequests);
      setSelected([]);
      fetchUsers();
    } catch (error) {
      showSnackbar('Error Deleting All Material', 'error');
      console.error('Error deleting users:', error);
    }
  };

  const dataFiltered = users
    .sort(getComparator(order, orderBy))
    .filter((row) => row.name?.toLowerCase().includes(filterName.toLowerCase()));

  const notFound = !dataFiltered.length && !!filterName;

  const isManager = role === 'MANAGER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <Container >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Material</Typography>
        <Box gap={2} sx={{ display: 'flex' }}>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".json"
          />

          {/* Upload button - now acts as file selector */}
          {!(isManager || isSuperAdmin) && (
            <Button
              sx={{
                backgroundColor: '#00284C',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#00288C',
                },
                mr: 2,
              }}
              variant="contained"
              color="inherit"
              onClick={() => fileInputRef.current.click()}
              disabled={isUplaodLoading}
              startIcon={
                isUplaodLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Iconify icon="eva:upload-fill" />
                )
              }
            >
              Upload Materials
            </Button>
          )}

          {/* Download button */}
          <Button
            sx={{
              backgroundColor: '#00284C',
              color: 'white',
              '&:hover': {
                backgroundColor: '#00288C',
              },
              mr: 2,
            }}
            variant="contained"
            color="inherit"
            onClick={handleDownload}
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Iconify icon="eva:download-fill" />
              )
            }
          >
            {isLoading ? 'Downloading...' : 'Download Materials'}
          </Button>

          {/* Add button - only visible for non-managers */}
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
        </Box>
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
                  { id: 'code', label: isPO ? 'Material Code' : 'Code' },
                  { id: 'name', label: isPO ? 'Brand' : 'Name' },
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
                      createdAt={formatDate(row.createdAt)}
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
      <AddMaterialModal open={openAddModal} onClose={handleCloseAddModal} />
      <UpdateMaterialModal
        open={openUpdateModal}
        onClose={handleCloseUpdateModal}
        user={currentUser}
        onUpdate={handleUpdateUser}
      />
    </Container>
  );
}
