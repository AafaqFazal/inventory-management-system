import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import DownloadIcon from '@mui/icons-material/Download';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import { Card, Alert, MenuItem, Snackbar, IconButton } from '@mui/material';

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
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null); // State for download popover
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // Can be "success", "error", "warning", "info"
  });
  const [schemes, setSchemes] = useState([]);
  const [allSchemes, setAllSchemes] = useState([]);
  const [loading, setLoading] = useState(false); // Added loading state

  const warehouseId = sessionStorage.getItem('warehouseId');
  const departmentId = sessionStorage.getItem('departmentId');
  const department = sessionStorage.getItem('department');
  const role = sessionStorage.getItem('role');
  const isPONumber = (role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom';

  const handleDownloadPopoverOpen = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  // Handle download popover close
  const handleDownloadPopoverClose = () => {
    setDownloadAnchorEl(null);
  };

  // Define columns for report
  const columns = [
    { field: 'itemCode', headerName: 'Item Code' },
    { field: 'description', headerName: 'Description' },
    { field: 'brand', headerName: 'Brand' },
    { field: 'scheme', headerName: 'Rawasi Issued PO#' },
    { field: 'poQty', headerName: 'PO QTY' },
    { field: 'receivedPoQty', headerName: 'Received QTY' },
    { field: 'remainingQty', headerName: 'Remaining QTY' },
    { field: 'unit', headerName: 'Unit' },
    { field: 'actions', headerName: 'Actions' },
  ];

  const handleDownload = async (type) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    try {
      setLoading(true);

      // Get the filtered data based on current search filter
      const filteredData = users
        .filter((row) => row.itemCode?.toLowerCase().includes(filterName.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Format the data for export
      const formattedRows = filteredData.map((row) => ({
        itemCode: row.itemCode || '',
        description: row.description || '',
        brand: row.brand || '',
        scheme: row.scheme || '',
        poQty: row.poQty || 0,
        rawasiIssuedPo: row.rawasiIssuedPo || '',
        receivedPoQty: row.receivedPoQty || '',
        remainingQty: row.remainingQty || 0,
        unit: row.unit || '',
        warehouseName: row.warehouseId?.name || 'N/A',
        createdAt: formatDate(row.createdAt),
      }));

      // Filter out the "action" column for export
      const filteredColumns = columns
        .filter((col) => col.field !== 'actions')
        .map((col) => ({
          field: col.field,
          headerName: col.headerName,
        }));

      const url =
        type === 'pdf'
          ? `${apiUrl}/api/poTrackingPdf-report`
          : `${apiUrl}/api/poTrackingExc-report`;

      const filename = type === 'pdf' ? 'PO_Tracking_Report.pdf' : 'PO_Tracking_Report.xlsx';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: formattedRows,
          columns: filteredColumns,
          department,
          warehouseId,
          role,
          selectedWarehouseDepartment: department, // Pass department for Telecom check
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server returned error:', errorData);
        throw new Error(errorData.error || errorData.message || `Failed to download ${filename}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setSnackbar({
        open: true,
        message: `${filename} downloaded successfully`,
        severity: 'success',
      });
      handleDownloadPopoverClose();
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to download report',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

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
      console.log('Fetching po tracking for role:', role);
      const response = await fetch(`${url}/api/poTracking`);
      if (!response.ok) throw new Error('Failed to fetch po tracking');
      const data = await response.json();

      console.log('Fetched Data:', data);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching schemes:', error);
    }
  }, [role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch schemes from the API when the component mounts
  useEffect(() => {
    const fetchSchemes = async () => {
      const apiUrl = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${apiUrl}/api/schemes`);
        if (!response.ok) throw new Error('Failed to fetch schemes');
        const data = await response.json();

        // Store all schemes
        setAllSchemes(data);

        // Fetch warehouses for the manager role
        let filteredSchemes = data;
        if (role === 'MANAGER') {
          // Fetch warehouses for the manager's department
          const warehousesResponse = await fetch(`${apiUrl}/api/warehouses`);
          if (!warehousesResponse.ok) throw new Error('Failed to fetch warehouses');
          const warehouses = await warehousesResponse.json();

          // Filter warehouses by the manager's department
          const departmentWarehouses = warehouses.filter(
            (warehouse) =>
              String(warehouse.departmentId?._id || warehouse.departmentId) === departmentId
          );

          // Extract warehouse IDs for the manager's department
          const warehouseIds = departmentWarehouses.map((warehouse) => String(warehouse._id));

          // Filter schemes to include only those associated with the manager's warehouses
          filteredSchemes = data.filter(
            (scheme) =>
              scheme.isActive &&
              warehouseIds.includes(String(scheme.warehouseId?._id || scheme.warehouseId))
          );
        } else if (role === 'WAREHOUSE_USER') {
          // Filter schemes for warehouse users
          filteredSchemes = data.filter(
            (scheme) => scheme.isActive && String(scheme.warehouseId?._id) === warehouseId
          );
        } else {
          // For other roles (e.g., SUPER_ADMIN), show all active schemes
          filteredSchemes = data.filter((scheme) => scheme.isActive);
        }

        setSchemes(filteredSchemes); // Store filtered schemes in state
      } catch (error) {
        console.error('Error fetching schemes:', error);
      }
    };

    fetchSchemes();
  }, [warehouseId, role, departmentId]); // Add departmentId to dependencies

  // Delete user
  const deleteUser = async (id) => {
    const url = import.meta.env.VITE_APP_URL;
    if (!id) {
      console.error('Error: user id is undefined');
      return;
    }
    try {
      const response = await fetch(`${url}/api/poTracking/${id}`, {
        method: 'DELETE',
      });
      showSnackbar('poTracking Deleted successfully!', 'success');
      if (!response.ok) throw new Error('Failed to delete poTracking');
      fetchUsers();
    } catch (err) {
      showSnackbar('Error Deleting PO Tracking', 'error');
      console.error('Error deleting PO Tracking:', err);
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
    console.log('Updated User:', updatedUser); // Debugging
    try {
      const response = await fetch(`${url}/api/poTracking/${updatedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      console.log('API Response:', response); // Debugging
      showSnackbar('PO Tracking updated successfully!', 'success');
      await fetchUsers();
      handleCloseUpdateModal();
    } catch (error) {
      console.error('Error updating PO Tracking:', error); // Debugging
      showSnackbar('Error updating PO Tracking!', 'error');
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
      showSnackbar('Selected PO Tracking Deleted successfully!', 'success');
      await Promise.all(deleteRequests);
      setSelected([]);
      fetchUsers();
    } catch (error) {
      showSnackbar('Error in Selected PO Tracking Deleted', 'error');
      console.error('Error deleting PO Tracking:', error);
    }
  };

  // Modified to show all data without filtering by scheme
  const dataFiltered = users
    .filter((row) => row.itemCode?.toLowerCase().includes(filterName.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  console.log('Filtered Data:', dataFiltered);

  const notFound = !dataFiltered.length && !!filterName;

  const isManager = role === 'MANAGER';

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">RWS PO Tracking</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleOpenAddModal}
          >
            Add
          </Button>
        </Stack>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="flex-start">
        <UserTableToolbar
          numSelected={selected.length}
          filterName={filterName}
          onFilterName={handleFilterByName}
          onDeleteAll={handleDeleteAll}
        />
        <Grid item>
          <IconButton
            onClick={handleDownloadPopoverOpen}
            sx={{
              width: 40,
              height: 40,
              background: (theme) => theme.palette.action.hover,
            }}
          >
            <DownloadIcon />
          </IconButton>
          <Popover
            open={Boolean(downloadAnchorEl)}
            anchorEl={downloadAnchorEl}
            onClose={handleDownloadPopoverClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { p: 0, mt: 1, ml: 0.75, width: 200 },
            }}
          >
            <Box sx={{ my: 1.5, px: 2 }}>
              <Typography variant="subtitle2" noWrap>
                Download Report
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                Choose a format
              </Typography>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <MenuItem onClick={() => handleDownload('pdf')}>
              <Typography variant="body2">Download as PDF</Typography>
            </MenuItem>

            <MenuItem onClick={() => handleDownload('excel')}>
              <Typography variant="body2">Download as Excel</Typography>
            </MenuItem>
          </Popover>
        </Grid>
      </Stack>

      {/* Table Section */}
      <Card gutterBottom>
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
                  { id: 'itemCode', label: 'Item Code' },
                  { id: 'description', label: 'Description' },
                  { id: 'unit', label: 'Unit' },
                  { id: 'supplierName', label: 'Supplier Name' },
                  { id: 'brand', label: 'Brand Name' },
                  { id: 'scheme', label: 'Rawasi Issued PO#' },
                  { id: 'poQty', label: 'PO QTY' },
                  { id: 'receivedPoQty', label: 'Received QTY' },
                  { id: 'remainingQty', label: 'Remaining QTY' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => {
                    console.log('Row Data:', row); // Debugging: Check if row data is correct
                    return (
                      <UserTableRow
                        key={row._id}
                        itemCode={row.itemCode}
                        description={row.description}
                        supplierName={row.supplierName}
                        scheme={row.scheme}
                        brand={row.brand}
                        poQty={row.poQty}
                        receivedPoQty={row.receivedPoQty}
                        remainingQty={row.remainingQty}
                        unit={row.unit}
                        row={row}
                        warehouseId={row.warehouseId?.name || 'N/A'}
                        isActive={row.isActive}
                        createdBy={row.createdBy}
                        createdAt={formatDate(row.createdAt)}
                        selected={selected.indexOf(row._id) !== -1}
                        handleClick={(event) => handleClick(event, row._id)}
                        onEdit={() => handleOpenUpdateModal(row)}
                        onDelete={() => deleteUser(row._id)}
                      />
                    );
                  })}
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
          count={dataFiltered.length}
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
