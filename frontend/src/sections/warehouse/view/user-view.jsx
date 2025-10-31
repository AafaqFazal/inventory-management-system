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

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import TableNoData from '../table-no-data';
import UserTableRow from '../user-table-row';
import UserTableHead from '../user-table-head';
import TableEmptyRows from '../table-empty-rows';
import AddWarehouseModal from './addWarehouseModel';
import UserTableToolbar from '../user-table-toolbar';
import UpdateWarehouseModal from './updateWarehouseModel';
import { emptyRows, applyFilter, getComparator } from '../utils';

export default function WarehousePage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [warehouses, setWarehouses] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // Can be "success", "error", "warning", "info"
  });

  const role = sessionStorage.getItem('role');
  const departmentId = sessionStorage.getItem('departmentId');
  const warehouseId = sessionStorage.getItem('warehouseId');

  // Function to show Snackbar
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  // Close Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch warehouses from the API
  const fetchWarehouses = useCallback(async () => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${url}/api/warehouses`);
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      const data = await response.json();

      let filteredData = [];

      if (role === 'SUPER_ADMIN') {
        // For SUPER_ADMIN, show all active warehouses
        filteredData = data.filter((x) => x.isActive === true);
      } else if (role === 'MANAGER') {
        // For MANAGER, show warehouses in their department
        filteredData = data.filter(
          (x) =>
            x.isActive === true && String(x.departmentId?._id || x.departmentId) === departmentId
        );
      } else if (role === 'WAREHOUSE_USER') {
        // For WAREHOUSE_USER, show only their assigned warehouse
        filteredData = data.filter((x) => x.isActive === true && String(x._id) === warehouseId);
      }

      console.log('Filtered Warehouses:', filteredData);
      setWarehouses(filteredData);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  }, [role, departmentId, warehouseId]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Delete warehouse
  const deleteWarehouse = async (id) => {
    const url = import.meta.env.VITE_APP_URL;
    if (!id) {
      console.error('Error: warehouse id is undefined');
      return;
    }
    try {
      const response = await fetch(`${url}/api/warehouses/${id}`, {
        method: 'DELETE',
      });
      showSnackbar('Warehouse Deleted successfully!', 'success');
      if (!response.ok) throw new Error('Failed to delete warehouse');
      fetchWarehouses();
    } catch (err) {
      showSnackbar('Error while deleting warehouse', 'error');
      console.error('Error deleting warehouse:', err);
    }
  };

  // Add Modal Handlers
  const handleOpenAddModal = () => setOpenAddModal(true);
  const handleCloseAddModal = () => {
    setOpenAddModal(false);
    fetchWarehouses();
  };

  // Update Modal Handlers
  const handleOpenUpdateModal = (warehouse) => {
    setCurrentWarehouse(warehouse);
    setOpenUpdateModal(true);
  };
  const handleCloseUpdateModal = () => {
    setOpenUpdateModal(false);
    setCurrentWarehouse(null);
  };

  // Handle updated warehouse data
  const handleUpdateWarehouse = async (updatedWarehouse) => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${url}/api/warehouses/${updatedWarehouse._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWarehouse),
      });
      showSnackbar('Warehouse updated successfully!', 'success');
      if (!response.ok) throw new Error('Failed to update warehouse');
      await fetchWarehouses();
      handleCloseUpdateModal();
    } catch (error) {
      showSnackbar('Error in warehouse updating', 'error');
      console.error('Error updating warehouse:', error);
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
      const newSelecteds = warehouses.map((n) => n._id);
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
        fetch(`${url}/api/warehouses/${id}`, { method: 'DELETE' })
      );
      showSnackbar('Selected warehouses deleted successfully!', 'success');
      await Promise.all(deleteRequests);
      setSelected([]);
      fetchWarehouses();
    } catch (error) {
      showSnackbar('Error deleting selected warehouses', 'error');
      console.error('Error deleting warehouses:', error);
    }
  };

  const dataFiltered = warehouses
    .sort(getComparator(order, orderBy))
    .filter((row) => row.name?.toLowerCase().includes(filterName.toLowerCase()));

  const notFound = !dataFiltered.length && !!filterName;

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Warehouses</Typography>
        {role !== 'MANAGER' && role !== 'WAREHOUSE_USER' && (
          <Button
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
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
          onDeleteAll={role === 'MANAGER' ? null : handleDeleteAll} // Disable delete all for MANAGER
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={order}
                orderBy={orderBy}
                rowCount={warehouses.length}
                numSelected={selected.length}
                onRequestSort={handleSort}
                onSelectAllClick={handleSelectAllClick}
                headLabel={[
                  { id: 'code', label: 'Code' },
                  { id: 'name', label: 'Name' },
                  { id: 'departmentId', label: 'Department' },
                  { id: 'description', label: 'Description' },
                  { id: 'isActive', label: 'Status' },
                  { id: 'createdBy', label: 'Created By' },
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
                      departmentId={row.departmentId?.name || 'N/A'}
                      description={row.description}
                      isActive={row.isActive}
                      createdBy={row.createdBy}
                      selected={selected.indexOf(row._id) !== -1}
                      handleClick={(event) => handleClick(event, row._id)}
                      onEdit={role === 'MANAGER' ? null : () => handleOpenUpdateModal(row)} // Disable edit for MANAGER
                      onDelete={role === 'MANAGER' ? null : () => deleteWarehouse(row._id)} // Disable delete for MANAGER
                    />
                  ))}
                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(page, rowsPerPage, warehouses.length)}
                />
                {notFound && <TableNoData query={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={warehouses.length}
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
      <AddWarehouseModal open={openAddModal} onClose={handleCloseAddModal} />
      <UpdateWarehouseModal
        open={openUpdateModal}
        onClose={handleCloseUpdateModal}
        warehouse={currentWarehouse}
        onUpdate={handleUpdateWarehouse}
      />
    </Container>
  );
}
