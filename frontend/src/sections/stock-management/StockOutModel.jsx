import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import { Edit as EditIcon } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Grid,
  Modal,
  Alert,
  Paper,
  Button,
  Select,
  Dialog,
  Popover,
  Divider,
  Snackbar,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TablePagination,
  CircularProgress,
} from '@mui/material';

const StockOutModal = ({
  open,
  onClose,
  onSave,
  selectedScheme,
  selectedWarehouseDepartment,
  selectedWarehouseId,
  selectedDepartmentId,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [schemeDownloadAnchorEl, setSchemeDownloadAnchorEl] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editMaterialQty, setEditMaterialQty] = useState(0);
  const [editUnit, setEditUnit] = useState('');
  const [editReceiverName, setEditReceiverName] = useState('');
  const [editAreaCode, setEditAreaCode] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const role = sessionStorage.getItem('role');
  const warehouseId = sessionStorage.getItem('warehouseId');
  const department = sessionStorage.getItem('department');
  const departmentId = sessionStorage.getItem('departmentId');
  const name = sessionStorage.getItem('fullName');
  const warehouse = sessionStorage.getItem('warehouse');
  const isPONumber =
    ((role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom') ||
    (role === 'SUPER_ADMIN' && selectedWarehouseDepartment === 'Telecom');
  const isElectricalDepartment = selectedWarehouseDepartment === 'Electrical';

  // Edit Modal Handlers
  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditMaterialQty(row.materialQty || 0);
    setEditUnit(row.unit || '');
    setEditReceiverName(row.receiverName || '');
    setEditAreaCode(row.areaCode || '');
    setEditAddress(row.address || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRow(null);
    setEditMaterialQty(0);
    setEditUnit('');
    setEditReceiverName('');
    setEditAreaCode('');
    setEditAddress('');
  };

  const handleSaveEdit = () => {
    if (!editingRow) return;

    // Validation
    if (!editMaterialQty || editMaterialQty <= 0) {
      setSnackbar({
        open: true,
        message: 'Material quantity must be greater than 0',
        severity: 'error',
      });
      return;
    }

    if (!editUnit.trim()) {
      setSnackbar({
        open: true,
        message: 'Unit is required',
        severity: 'error',
      });
      return;
    }

    if (!editReceiverName.trim()) {
      setSnackbar({
        open: true,
        message: 'Receiver name is required',
        severity: 'error',
      });
      return;
    }

    if (!editAreaCode.trim()) {
      setSnackbar({
        open: true,
        message: `${isPONumber ? 'Site ID' : 'Area Code'} is required`,
        severity: 'error',
      });
      return;
    }

    if (!editAddress.trim()) {
      setSnackbar({
        open: true,
        message: `${isPONumber ? 'Notes' : 'Address'} is required`,
        severity: 'error',
      });
      return;
    }

    // Update the row in tableRows
    const updatedRows = tableRows.map((row) =>
      row.id === editingRow.id
        ? {
            ...row,
            materialQty: editMaterialQty,
            unit: editUnit,
            receiverName: editReceiverName,
            areaCode: editAreaCode,
            address: editAddress,
            updatedAt: new Date().toISOString(),
          }
        : row
    );

    setTableRows(updatedRows);
    setSnackbar({
      open: true,
      message: 'Row updated successfully',
      severity: 'success',
    });
    handleCloseEditModal();
  };

  // Fetch materials from the backend
  const fetchMaterials = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${apiUrl}/api/materials?warehouseId=${warehouseId}`);
      if (!response.ok) throw new Error('Failed to fetch materials');

      const data = await response.json();

      // Filter materials based on warehouseId
      let filteredData = [];

      if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
        filteredData = data;
      } else if (role === 'WAREHOUSE_USER') {
        filteredData = data.filter(
          (x) => x.isActive === true && String(x.warehouseId?._id) === warehouseId
        );
      }

      setMaterials(filteredData);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch materials',
        severity: 'error',
      });
    }
  }, [warehouseId, setSnackbar, role]);

  const handleDownloadSelectedScheme = async (type) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    if (!selectedScheme) {
      setSnackbar({
        open: true,
        message: 'No scheme selected',
        severity: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      const checkSchemeUrl = `${apiUrl}/api/stockout/checkscheme/${encodeURIComponent(selectedScheme)}`;
      const checkSchemeResponse = await fetch(checkSchemeUrl);

      if (!checkSchemeResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      let storeInData = await checkSchemeResponse.json();

      if (!storeInData.length) {
        const mappingUrl = `${apiUrl}/api/checkSchemeMaterialMapping/${encodeURIComponent(selectedScheme)}`;
        const mappingResponse = await fetch(mappingUrl);

        if (!mappingResponse.ok) {
          throw new Error('Failed to fetch data.');
        }

        storeInData = await mappingResponse.json();
      }

      if (!storeInData.length) {
        setSnackbar({
          open: true,
          message: 'No data found.',
          severity: 'warning',
        });
        setLoading(false);
        return;
      }

      let filteredData = storeInData;
      if (role !== 'SUPER_ADMIN' && role !== 'MANAGER') {
        filteredData = storeInData.filter(
          (item) =>
            String(item.warehouseId) === warehouseId && String(item.departmentId) === departmentId
        );
      }

      if (!filteredData.length) {
        setSnackbar({
          open: true,
          message: 'No data available for your role and filters',
          severity: 'warning',
        });
        setLoading(false);
        return;
      }

      const rows = filteredData.map((item) => ({
        scheme: item.scheme,
        description: item.description,
        materialCode: item.materialCode,
        materialQty: item.materialQty,
        notes: item.notes || '',
        address: item.address || '',
        unit: item.unit || '',
        areaCode: item.areaCode || '',
        receiverName: item.receiverName || '',
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      const columns = [
        { field: 'scheme', headerName: 'Scheme' },
        { field: 'description', headerName: 'Description' },
        { field: 'materialCode', headerName: 'Material Code' },
        { field: 'address', headerName: 'Address' },
        { field: 'unit', headerName: isElectricalDepartment ? 'UOM' : 'Unit' },
        { field: 'areaCode', headerName: 'Area Code' },
        { field: 'receiverName', headerName: 'Receiver Name' },
        { field: 'materialQty', headerName: 'Material Qty' },
        { field: 'createdAt', headerName: 'Created At' },
        { field: 'updatedAt', headerName: 'Updated At' },
        { field: 'createdBy', headerName: 'Created By' },
        { field: 'updatedBy', headerName: 'Updated By' },
      ];

      const url =
        type === 'pdf'
          ? `${apiUrl}/api/selected_schemedownloadpdf-stockout`
          : `${apiUrl}/api/stockout-report-by-scheme`;

      const filename = type === 'pdf' ? `StockOut_Report.pdf` : `Selected_StockOut_Report.xlsx`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows, columns, role, department, selectedWarehouseDepartment }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to download ${filename}: ${errorText}`);
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
      handleSchemeDownloadPopoverClose();
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

  const fetchSchemeData = useCallback(async (scheme) => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_APP_URL;

    const checkSchemeUrl = `${apiUrl}/api/stockout/checkscheme/${encodeURIComponent(scheme)}`;
    const mappingUrl = `${apiUrl}/api/checkscheme/${encodeURIComponent(scheme)}`;

    console.log('Check Scheme URL:', checkSchemeUrl);
    console.log('Mapping URL:', mappingUrl);

    try {
      const stockoutResponse = await fetch(checkSchemeUrl);
      const stockoutText = await stockoutResponse.text();

      let stockoutData = [];
      if (
        !stockoutText.toLowerCase().startsWith('<!doctype') &&
        !stockoutText.toLowerCase().startsWith('<html')
      ) {
        try {
          stockoutData = JSON.parse(stockoutText);
          if (!Array.isArray(stockoutData)) {
            stockoutData = [];
          }
          console.log('StockOut Data:', stockoutData);
        } catch (jsonError) {
          console.error('JSON parse error for stockout API:', jsonError);
        }
      }

      const mappingResponse = await fetch(mappingUrl);
      const mappingText = await mappingResponse.text();

      let mappingData = [];
      if (
        !mappingText.toLowerCase().startsWith('<!doctype') &&
        !mappingText.toLowerCase().startsWith('<html')
      ) {
        try {
          mappingData = JSON.parse(mappingText);
          if (!Array.isArray(mappingData)) {
            mappingData = [];
          }
          console.log('Mapping Data:', mappingData);
        } catch (jsonError) {
          console.error('JSON parse error for mapping API:', jsonError);
        }
      }

      const mergedData = mergeData(stockoutData, mappingData);
      console.log('Merged Data:', mergedData);

      setTableRows(mergedData);
    } catch (error) {
      console.error('Full error details:', error);
      setSnackbar({
        open: true,
        message: `Failed to fetch scheme data: ${error.message}`,
        severity: 'error',
      });
      setTableRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const mergeData = (stockoutData, mappingData) => {
    const mergedData = [...stockoutData];

    const stockoutMap = new Map();
    stockoutData.forEach((row) => {
      if (row.materialCode) {
        stockoutMap.set(row.materialCode, row);
      }
    });

    mappingData.forEach((mappingRow) => {
      if (!stockoutMap.has(mappingRow.materialCode)) {
        mergedData.push({
          ...mappingRow,
          materialQty: 0,
          id: mappingRow._id || `generated-${Date.now()}-${mappingRow.materialCode}`,
        });
      }
    });

    return mergedData.map((row) => ({
      ...row,
      id: row.id || row._id || `generated-${Date.now()}-${row.materialCode}`,
    }));
  };

  const handleRowSelection = (selection) => {
    setSelectedRows(selection);
  };

  const processRowUpdate = (newRow) => {
    const updatedRows = tableRows.map((row) => (row.id === newRow.id ? newRow : row));
    setTableRows(updatedRows);
    return newRow;
  };

  const handleSave = async () => {
    if (tableRows.length === 0) {
      setSnackbar({ open: true, message: 'No rows to save.', severity: 'warning' });
      return;
    }

    const missingFields = [];
    tableRows.forEach((row, index) => {
      if (!row.materialCode) missingFields.push(`Material Code`);
      if (!row.materialQty) missingFields.push(`Material Quantity`);
      if (!row.description) missingFields.push(`Description`);
      if (!row.receiverName) missingFields.push(`Receiver Name`);
      if (!row.unit) missingFields.push(`Unit `);
      if (!row.areaCode) missingFields.push(`Area Code`);
      if (!row.address) missingFields.push(`Address`);
    });

    if (missingFields.length > 0) {
      setSnackbar({
        open: true,
        message: `Missing required fields: ${missingFields.join(', ')}.`,
        severity: 'error',
      });
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_APP_URL;
      const createdBy = sessionStorage.getItem('role');
      const userId = sessionStorage.getItem('userId');

      const rowsToSave = tableRows.map((row) => ({
        ...row,
        departmentId: selectedDepartmentId,
        warehouseId: selectedWarehouseId,
        createdBy,
      }));

      const saveResponse = await fetch(`${apiUrl}/api/stockout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rowsToSave),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        if (errorData.missingFields) {
          throw new Error(`Missing required fields: ${errorData.missingFields.join(', ')}`);
        }
        throw new Error(errorData.message || 'Failed to save stock-out data.');
      }

      const usersResponse = await fetch(`${apiUrl}/api/user/getUsers`);
      if (!usersResponse.ok) throw new Error('Failed to fetch users');

      const usersData = await usersResponse.json();
      const usersArray = usersData.users;

      const manager = usersArray.find(
        (user) => String(user.departmentId) === departmentId && user.role === 'MANAGER'
      );

      const superAdmins = usersArray.filter((user) => user.role === 'SUPER_ADMIN');

      if (!manager && superAdmins.length === 0) {
        setSnackbar({
          open: true,
          message: 'Manager or SUPER_ADMIN not found. Notifications could not be sent.',
          severity: 'error',
        });
        return;
      }

      if (manager) {
        const managerNotificationPayload = {
          fromUser: userId,
          toUser: manager.userId,
          message: `Stock-out data has been saved by user ${createdBy} and WareHouse is ${warehouse}.`,
        };

        const managerNotificationResponse = await fetch(`${apiUrl}/api/notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(managerNotificationPayload),
        });

        if (!managerNotificationResponse.ok) {
          const errorResponse = await managerNotificationResponse.json();
          console.error('Manager notification error response:', errorResponse);
          throw new Error('Failed to send notification to manager');
        }

        const managerNotificationResult = await managerNotificationResponse.json();
      }

      if (superAdmins.length > 0) {
        const superAdminNotificationPromises = superAdmins.map(async (superAdmin) => {
          const superAdminNotificationPayload = {
            fromUser: userId,
            toUser: superAdmin.userId,
            message: `Stock-Out data has been saved by user ${name} from ${warehouse} WareHouse.`,
          };

          const superAdminNotificationResponse = await fetch(`${apiUrl}/api/notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(superAdminNotificationPayload),
          });

          if (!superAdminNotificationResponse.ok) {
            const errorResponse = await superAdminNotificationResponse.json();
            console.error(
              `SUPER_ADMIN notification error for user ${superAdmin.userId}:`,
              errorResponse
            );
            throw new Error(`Failed to send notification to SUPER_ADMIN: ${superAdmin.userId}`);
          }

          return superAdminNotificationResponse.json();
        });

        await Promise.all(superAdminNotificationPromises);
      }

      setSnackbar({
        open: true,
        message: 'Stock-out data saved successfully.',
        severity: 'success',
      });
      onSave(rowsToSave);
    } catch (error) {
      console.error('Error saving stock-out data:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to save stock-out data. Please try again.',
        severity: 'error',
      });
    }
  };

  useEffect(() => {
    if (open && selectedScheme) {
      fetchSchemeData(selectedScheme);
      fetchMaterials();
      setPage(0);
      setRowsPerPage(10);
    } else {
      setTableRows([]);
    }
  }, [open, selectedScheme, fetchSchemeData, fetchMaterials]);

  const handleAddMaterials = () => {
    if (selectedMaterials.length === 0) {
      setSnackbar({ open: true, message: 'No materials selected', severity: 'warning' });
      return;
    }

    const createdBy = sessionStorage.getItem('role');

    if (!departmentId || !warehouseId || !createdBy) {
      setSnackbar({
        open: true,
        message: 'Department ID or Warehouse ID is missing',
        severity: 'error',
      });
      return;
    }

    const newRows = selectedMaterials.map((material) => ({
      ...material,
      id: `${material.materialCode}-${Date.now()}`,
      materialQty: 0,
      unit: 'N/A',
      notes: '',
      departmentId,
      warehouseId,
      createdBy,
    }));

    setTableRows([...tableRows, ...newRows]);
    setSelectedMaterials([]);
  };

  const handleDownloadPopoverOpen = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadPopoverClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownload = async (type) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    if (!selectedMonth || !selectedYear) {
      setSnackbar({
        open: true,
        message: 'Please select both month and year.',
        severity: 'warning',
      });
      return;
    }

    try {
      const url =
        type === 'pdf' ? `${apiUrl}/api/downloadpdf-stockout` : `${apiUrl}/api/stockout-report`;
      const filename = type === 'pdf' ? 'StockOut_Report.pdf' : 'StockOut_Report.xlsx';

      const queryParams = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
        role,
        warehouseId,
        departmentId,
        selectedWarehouseDepartment,
        department,
      }).toString();

      const response = await fetch(`${url}?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to download ${filename}.`);
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
        message: `${filename} downloaded successfully.`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to download report. Please try again.',
        severity: 'error',
      });
    }
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getYearsRange = () => {
    const currentYear = getCurrentYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  };

  const handleDeleteRow = (id) => {
    setTableRows(tableRows.filter((row) => row.id !== id));
  };

  const columns = [
    {
      field: 'scheme',
      headerName: isPONumber ? 'PO' : 'Scheme',
      width: 100,
      editable: false,
    },
    { field: 'materialCode', headerName: 'Material Code', width: 100, editable: false },
    { field: 'description', headerName: 'Description', width: 150, editable: false },
    {
      field: 'materialQty',
      headerName: 'Material Qty',
      width: 100,
      editable: false,
      type: 'number',
    },
    { field: 'receiverName', headerName: 'Receiver Name', width: 120, editable: false },
    { field: 'unit', headerName: isElectricalDepartment ? 'UOM' : 'Unit', width: 300 },
    {
      field: 'areaCode',
      headerName: isPONumber ? 'Site ID' : 'Area Code',
      width: 100,
      editable: false,
    },
    { field: 'address', headerName: isPONumber ? 'Notes' : 'Address', width: 100, editable: false },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 150,
      editable: false,
      valueGetter: (params) => (params ? new Date(params).toISOString().split('T')[0] : ''),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => {
        // const role = sessionStorage.getItem('role');
        const isManager = role === 'MANAGER';

        if (isManager) {
          return null; // Don't show actions for MANAGER
        }

        return (
          <Box>
            <IconButton
              onClick={() => handleEditClick(params.row)}
              sx={{ color: 'rgb(74,115,15,0.9)' }}
              size="small"
            >
              <EditIcon sx={{ height: '16px' }} />
            </IconButton>
          </Box>
        );
      },
    },
  ];
  const renderUnitDropdown = (value, onChange, required = true) => {
    if (isElectricalDepartment === 'Telecom') {
      return (
        <TextField
          fullWidth
          select
          label="Unit"
          value={value}
          onChange={onChange}
          required={required}
        >
          <MenuItem value="Piece">Piece</MenuItem>
          <MenuItem value="Pair">Pair</MenuItem>
        </TextField>
      );
    }

    if (isElectricalDepartment) {
      return (
        <TextField
          fullWidth
          select
          label="UOM"
          value={value}
          onChange={onChange}
          required={required}
        >
          <MenuItem value="EA">EA</MenuItem>
          <MenuItem value="Meter">Meter</MenuItem>
        </TextField>
      );
    }

    return (
      <TextField fullWidth label="Unit" value={value} onChange={onChange} required={required} />
    );
  };
  const handleSchemeDownloadPopoverOpen = (event) => {
    setSchemeDownloadAnchorEl(event.currentTarget);
  };

  const handleSchemeDownloadPopoverClose = () => {
    setSchemeDownloadAnchorEl(null);
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: {
              xs: '95%',
              sm: '90%',
              md: '85%',
              lg: '80%',
            },
            maxWidth: 1000,
            height: {
              xs: '90vh',
              sm: '90vh',
              md: '90vh',
              lg: '90vh',
            },
            maxHeight: 1000,
            bgcolor: 'background.paper',
            boxShadow: 24,
            pt: 4,
            pr: 4,
            pl: 4,
            pb: 0,
            borderRadius: 2,
            overflow: 'auto',
          }}
        >
          <Typography variant="h6" mb={1}>
            Stock Out Management
          </Typography>
          {loading ? (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" mb={1}>
                Selected {isPONumber ? 'PO' : 'Scheme'}: <strong>{selectedScheme}</strong>
              </Typography>
              <Grid container justifyContent="flex-start" sx={{ mt: 1, mb: 1 }}>
                <Grid item xs={6} sm={3} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      label="Month"
                      sx={{
                        p: 0,
                        minHeight: '32px',
                        fontSize: '0.875rem',
                        ml: 1,
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} sm={3} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      label="Year"
                      sx={{
                        p: 0,
                        minHeight: '32px',
                        fontSize: '0.875rem',
                        ml: 1,
                      }}
                    >
                      {getYearsRange().map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={4} sm={2} md={1}>
                  <IconButton
                    onClick={handleDownloadPopoverOpen}
                    sx={{
                      width: 40,
                      height: 40,
                      p: 0.5,
                      ml: 1,
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

                <Grid item xs={8} sm={4} md={2}>
                  <Button
                    onClick={handleSchemeDownloadPopoverOpen}
                    sx={{
                      height: '32px',
                      minWidth: 0,
                      px: 1.5,
                      fontSize: '0.75rem',
                      backgroundColor: 'rgb(7, 85, 162,1)',
                    }}
                    variant="contained"
                    fullWidth
                  >
                    Download All
                  </Button>
                  <Popover
                    open={Boolean(schemeDownloadAnchorEl)}
                    anchorEl={schemeDownloadAnchorEl}
                    onClose={handleSchemeDownloadPopoverClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{
                      sx: { p: 0, mt: 1, ml: 0.75, width: 200 },
                    }}
                  >
                    <Box sx={{ my: 1.5, px: 2 }}>
                      <Typography variant="subtitle2" noWrap>
                        Download Scheme Report
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                        Choose a format
                      </Typography>
                    </Box>

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    <MenuItem onClick={() => handleDownloadSelectedScheme('pdf')}>
                      <Typography variant="body2">Download as PDF</Typography>
                    </MenuItem>

                    <MenuItem onClick={() => handleDownloadSelectedScheme('excel')}>
                      <Typography variant="body2">Download as Excel</Typography>
                    </MenuItem>
                  </Popover>
                </Grid>

                <Grid
                  item
                  xs={12}
                  sm={12}
                  md={5}
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    mt: {
                      xs: 2,
                      sm: 0,
                    },
                  }}
                >
                  <Button
                    sx={{
                      backgroundColor: 'grey',
                      height: '32px',
                      minWidth: 0,
                      px: 1.5,
                      fontSize: '0.75rem',
                    }}
                    variant="contained"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  {role !== 'MANAGER' && (
                    <Button
                      sx={{
                        height: '32px',
                        minWidth: 0,
                        px: 1.5,
                        fontSize: '0.75rem',
                        backgroundColor: 'rgb(7, 85, 162,1)',
                      }}
                      variant="contained"
                      onClick={handleSave}
                    >
                      Save
                    </Button>
                  )}
                </Grid>
              </Grid>
              <Paper
                sx={{
                  mt: 2,
                  height: {
                    xs: '280px',
                    sm: '280px',
                    md: '300px',
                    lg: '300px',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <DataGrid
                  rows={tableRows}
                  columns={columns.map((col) => ({
                    ...col,
                    flex: 1,
                    minWidth: 100,
                    resizable: true,
                  }))}
                  checkboxSelection={false}
                  onRowSelectionModelChange={handleRowSelection}
                  getRowId={(row) => row.id}
                  processRowUpdate={processRowUpdate}
                  onProcessRowUpdateError={(error) => console.error(error)}
                  autoHeight={false}
                  pagination
                  paginationModel={{
                    page,
                    pageSize: rowsPerPage,
                  }}
                  onPaginationModelChange={(newModel) => {
                    setPage(newModel.page);
                    setRowsPerPage(newModel.pageSize);
                  }}
                  pageSizeOptions={[10, 25, 50]}
                  rowCount={tableRows.length}
                  sx={{
                    '& .MuiDataGrid-main': {
                      overflow: 'auto',
                      flex: 1,
                    },
                    '& .MuiDataGrid-row': {
                      minHeight: '20px !important',
                      maxHeight: '20px !important',
                      padding: '0 !important',
                      margin: '0 !important',
                    },
                    '& .MuiDataGrid-cell': {
                      fontSize: '0.5rem',
                      padding: '0 2px !important',
                      lineHeight: '0.5 !important',
                      minHeight: '20px !important',
                      maxHeight: '20px !important',
                      display: 'flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                    '& .MuiDataGrid-columnHeader': {
                      padding: '0 4px !important',
                      fontSize: '0.5rem',
                      minHeight: '32px !important',
                      backgroundColor: '#000000 !important',
                      color: '#ffffff !important',
                    },
                    '& .MuiDataGrid-columnHeaderTitleContainer': {
                      padding: '0 !important',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      backgroundColor: '#000000 !important',
                      color: '#ffffff !important',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      marginTop: '0 !important',
                      marginBottom: '0 !important',
                    },
                    '& .MuiDataGrid-columnSeparator': {
                      display: 'block !important',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      minHeight: '40px !important',
                    },
                    height: '100%',
                  }}
                  density="compact"
                  disableColumnMenu={false}
                  disableRowSelectionOnClick
                  disableColumnResize={false}
                  onColumnWidthChange={(params) => {
                    console.log('Column width changed:', params);
                  }}
                />
              </Paper>
            </>
          )}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Modal>

      {/* Edit Modal Dialog */}
      <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
        <DialogTitle bgcolor="black" color="white">
          Edit Material
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Non-editable fields */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                bgcolor: '#f9f9f9',
              }}
            >
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Material Details (Read-only)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>{isPONumber ? 'PO' : 'Scheme'}:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ p: 1, bgcolor: 'white', borderRadius: 1 }}>
                    {editingRow?.scheme || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Material Code:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ p: 1, bgcolor: 'white', borderRadius: 1 }}>
                    {editingRow?.materialCode || 'N/A'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Description:</strong>
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ p: 1, bgcolor: 'white', borderRadius: 1, minHeight: '40px' }}
                  >
                    {editingRow?.description || 'No description'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Editable fields */}
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Editable Fields
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Material Quantity"
                  type="number"
                  value={editMaterialQty}
                  onChange={(e) => setEditMaterialQty(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                {renderUnitDropdown(editUnit, (e) => setEditUnit(e.target.value), true)}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Receiver Name"
                  value={editReceiverName}
                  onChange={(e) => setEditReceiverName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={isPONumber ? 'Site ID' : 'Area Code'}
                  value={editAreaCode}
                  onChange={(e) => setEditAreaCode(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={isPONumber ? 'Notes' : 'Address'}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            color="secondary"
            sx={{ background: 'grey', color: 'white' }}
            onClick={handleCloseEditModal}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

StockOutModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  selectedScheme: PropTypes.string,
  selectedWarehouseDepartment: PropTypes.string,
  selectedWarehouseId: PropTypes.string,
  selectedDepartmentId: PropTypes.string,
};

export default StockOutModal;
