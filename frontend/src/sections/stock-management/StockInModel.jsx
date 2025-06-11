import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import { Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  Grid,
  Modal,
  Alert,
  Paper,
  Button,
  Select,
  Popover,
  Divider,
  Snackbar,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  Autocomplete,
  TablePagination,
  CircularProgress,
} from '@mui/material';

const StockInModal = ({
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null); // State for download popover
  const [schemeDownloadAnchorEl, setSchemeDownloadAnchorEl] = useState(null); // Separate state for scheme download popover
  const [materials, setMaterials] = useState([]); // State to store fetched materials

  const role = sessionStorage.getItem('role');
  const warehouseId = sessionStorage.getItem('warehouseId'); // Get warehouseId from session storage
  const department = sessionStorage.getItem('department');
  const departmentId = sessionStorage.getItem('departmentId');
  const userId = sessionStorage.getItem('userId');
  const warehouse = sessionStorage.getItem('warehouse');
  const name = sessionStorage.getItem('fullName');
  const isPONumber = (role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom';
  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page when rows per page changes
  };

  const fetchMaterials = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${apiUrl}/api/materials?warehouseId=${warehouseId}`);
      if (!response.ok) throw new Error('Failed to fetch materials');

      const data = await response.json();

      // Filter materials based on warehouseId
      let filteredData = [];

      if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
        filteredData = data; // No filtering needed for SUPER_ADMIN or MANAGER
      } else if (role === 'WAREHOUSE_USER') {
        filteredData = data.filter(
          (x) => x.isActive === true && String(x.warehouseId?._id) === warehouseId
        );
      }

      // Set the filtered data to the materials state
      setMaterials(filteredData);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch materials',
        severity: 'error',
      });
    }
  }, [warehouseId, role]);

  const fetchSchemeData = useCallback(
    async (scheme) => {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_APP_URL; // Check both possible env variables

      const checkSchemeUrl = `${apiUrl}/api/checkscheme/${encodeURIComponent(scheme)}`;

      try {
        // Use a raw fetch and check the text response first
        const rawResponse = await fetch(checkSchemeUrl);
        const responseText = await rawResponse.text();

        // If response starts with <!doctype or <html, we have an HTML error page
        if (
          responseText.toLowerCase().startsWith('<!doctype') ||
          responseText.toLowerCase().startsWith('<html')
        ) {
          console.error('Received HTML instead of JSON');

          // Try the alternative API directly without going through the check
          const mappingUrl = `${apiUrl}/api/checkSchemeMaterialMapping/${encodeURIComponent(scheme)}`;
          console.log('Trying mapping URL directly:', mappingUrl);

          const mappingResponse = await fetch(mappingUrl);
          const mappingText = await mappingResponse.text();

          // Check if we got JSON from the mapping API
          try {
            const mappingData = JSON.parse(mappingText);
            console.log('Successfully got JSON from mapping API');

            // Process and return data
            const processedData = Array.isArray(mappingData)
              ? mappingData.map((row, index) => ({
                  ...row,
                  id: row.id || row._id,
                  createdBy: userId,
                  unit: row.unit || 'Peice',
                }))
              : [];

            setTableRows(processedData);
            return;
          } catch (jsonError) {
            console.error('Mapping API also returned non-JSON:', mappingText.substring(0, 100));
            throw new Error('Both APIs returned non-JSON responses');
          }
        }

        // If we're here, we got valid JSON from the check API
        try {
          const data = JSON.parse(responseText);

          if (
            (Array.isArray(data) && data.length === 0) ||
            (data.message && data.message.includes('No data found'))
          ) {
            // No data found in first API, try the second one
            console.log('No data found, trying mapping API');

            const mappingUrl = `${apiUrl}/api/checkSchemeMaterialMapping/${encodeURIComponent(scheme)}`;
            console.log('Mapping URL:', mappingUrl);

            const mappingResponse = await fetch(mappingUrl);
            const mappingData = await mappingResponse.json();

            // Process and set data
            const processedData = Array.isArray(mappingData)
              ? mappingData.map((row, index) => ({
                  ...row,
                  id: row.id || row._id,
                  createdBy: row.createdBy || userId,
                }))
              : [];

            setTableRows(processedData);
          } else {
            // We have data from first API
            const processedData = Array.isArray(data)
              ? data.map((row, index) => ({
                  ...row,
                  id: row.id || row._id,
                }))
              : [];

            setTableRows(processedData);
          }
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          throw new Error('Failed to parse JSON from API response');
        }
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
    },
    [userId]
  );

  // Only fetch once when modal opens with selected scheme
  useEffect(() => {
    if (open && selectedScheme) {
      fetchSchemeData(selectedScheme);
      fetchMaterials(); // Fetch materials when the modal opens
    } else {
      setTableRows([]); // Clear table rows if no scheme is selected or modal is closed
    }
  }, [open, selectedScheme, fetchMaterials, fetchSchemeData]);

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
      setSnackbar({
        open: true,
        message: 'No rows to save. Please add materials first.',
        severity: 'warning',
      });
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_APP_URL;

      const rowsToSave = tableRows.map((row) => ({
        ...row,
        departmentId: selectedDepartmentId,
        warehouseId: selectedWarehouseId,
        createdBy: row.createdBy || userId, // Use userId as createdBy
      }));

      // Save stock-in data
      // Save stock-in data
      const saveResponse = await fetch(`${apiUrl}/api/storein`, {
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
        throw new Error(errorData.message || 'Failed to save stock-in data');
      }
      const saveResult = await saveResponse.json();

      // Fetch all users
      const usersResponse = await fetch(`${apiUrl}/api/user/getUsers`);
      if (!usersResponse.ok) throw new Error('Failed to fetch users');

      const usersData = await usersResponse.json();

      // Access the users array from the response
      const usersArray = usersData.users;

      // Find the manager of the department
      const manager = usersArray.find(
        (user) => String(user.departmentId) === departmentId && user.role === 'MANAGER'
      );

      // Find the SUPER_ADMIN
      const superAdmin = usersArray.find((user) => user.role === 'SUPER_ADMIN');

      if (!manager && !superAdmin) {
        setSnackbar({
          open: true,
          message: 'Manager or SUPER_ADMIN not found. Notifications could not be sent.',
          severity: 'error',
        });
        return;
      }

      // Send notification to the manager (if exists)
      if (manager) {
        const managerNotificationPayload = {
          fromUser: userId,
          toUser: manager.userId,
          message: `Stock-in data has been saved by user ${name} from ${warehouse} WareHouse.`,
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
      }

      // Send notification to the SUPER_ADMIN (if exists)
      if (superAdmin) {
        const superAdminNotificationPayload = {
          fromUser: userId,
          toUser: superAdmin.userId,
          message: `Stock-in data has been saved by user ${name} from ${warehouse} WareHouse.`,
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
          console.error('SUPER_ADMIN notification error response:', errorResponse);
          throw new Error('Failed to send notification to SUPER_ADMIN');
        }
      }

      setSnackbar({
        open: true,
        message: 'Stock-in data saved and notifications sent successfully!',
        severity: 'success',
      });
      onSave(rowsToSave);
    } catch (error) {
      console.error('Error in handleSave:', error);
      setSnackbar({
        open: true,
        message:
          error.message || 'Failed to save stock-in data. Please check your inputs and try again.',
        severity: 'error',
      });
    }
  };

  const handleAddMaterials = () => {
    if (selectedMaterials.length === 0) {
      setSnackbar({
        open: true,
        message: 'No materials selected. Please select at least one material.',
        severity: 'warning',
      });
      return;
    }

    const newRows = selectedMaterials.map((material) => ({
      id: `${material.code}-${Date.now()}`,
      scheme: selectedScheme,
      materialCode: material.code,
      description: material.description,
      materialQty: 0,
      unit: 'Piece',
      notes: '',
      departmentId,
      warehouseId,
      createdBy: userId, // Important: Use userId as createdBy
    }));

    setTableRows([...tableRows, ...newRows]);
    setSelectedMaterials([]);

    setSnackbar({
      open: true,
      message: 'Materials added successfully!',
      severity: 'success',
    });
  };

  // Handle download popover open
  const handleDownloadPopoverOpen = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  // Handle download popover close
  const handleDownloadPopoverClose = () => {
    setDownloadAnchorEl(null);
  };

  // Handle scheme download popover open
  const handleSchemeDownloadPopoverOpen = (event) => {
    setSchemeDownloadAnchorEl(event.currentTarget);
  };

  // Handle scheme download popover close
  const handleSchemeDownloadPopoverClose = () => {
    setSchemeDownloadAnchorEl(null);
  };

  // Handle download action
  const handleDownload = async (type) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    // Check if month and year are selected
    if (!selectedMonth || !selectedYear) {
      setSnackbar({
        open: true,
        message: 'Please select both a month and a year to proceed.',
        severity: 'warning',
      });
      return;
    }

    try {
      const url =
        type === 'pdf' ? `${apiUrl}/api/downloadpdf-storein` : `${apiUrl}/api/storein-report`;
      const filename = type === 'pdf' ? 'StockIn_Report.pdf' : 'StockIn_Report.xlsx';

      // Build the query parameters
      const queryParams = new URLSearchParams({
        month: selectedMonth,
        year: selectedYear,
        role,
        warehouseId,
        departmentId,
        department,
        selectedWarehouseDepartment,
      }).toString();

      const response = await fetch(`${url}?${queryParams}`);

      // Handle server errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Server Error. Please try again.';
        throw new Error(errorMessage);
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      // Show success message
      setSnackbar({
        open: true,
        message: `Your report (${filename}) has been downloaded successfully.`,
        severity: 'success',
      });
      handleDownloadPopoverClose(); // Close the popover after download
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message:
          error.message || 'Something went wrong while downloading the report. Please try again.',
        severity: 'error',
      });
    }
  };
  const handleDownloadSelectedScheme = async (type) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    // Check if a scheme is selected
    if (!selectedScheme) {
      setSnackbar({
        open: true,
        message: 'Please select scheme/po to download the report.',
        severity: 'warning',
      });
      return;
    }

    try {
      setLoading(true);

      // Fetch data for the selected scheme
      const checkSchemeUrl = `${apiUrl}/api/checkscheme/${encodeURIComponent(selectedScheme)}`;
      const checkSchemeResponse = await fetch(checkSchemeUrl);

      if (!checkSchemeResponse.ok) {
        throw new Error('Data is not available to download.');
      }

      let storeInData = await checkSchemeResponse.json();

      // If no data found, try the mapping API
      if (!storeInData.length) {
        const mappingUrl = `${apiUrl}/api/checkSchemeMaterialMapping/${encodeURIComponent(selectedScheme)}`;
        const mappingResponse = await fetch(mappingUrl);

        if (!mappingResponse.ok) {
          throw new Error('Data is not available to download.');
        }

        storeInData = await mappingResponse.json();
      }

      // Check if data is available
      if (!storeInData.length) {
        setSnackbar({
          open: true,
          message: 'Data is not found. Please check your selection and try again.',
          severity: 'warning',
        });
        setLoading(false);
        return;
      }

      // Filter data based on role and permissions
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
          message: 'No data is available for your role and filters.',
          severity: 'warning',
        });
        setLoading(false);
        return;
      }

      // Format the rows for the report
      const rows = filteredData.map((item) => ({
        scheme: item.scheme,
        description: item.description,
        materialCode: item.materialCode,
        materialQty: item.materialQty,
        notes: item.notes || '',
        unit: item.unit || '',
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      const columns = [
        { field: 'scheme', headerName: 'Scheme' },
        { field: 'description', headerName: 'Description' },
        { field: 'materialCode', headerName: 'Material Code' },
        { field: 'materialQty', headerName: 'Material Qty' },
        { field: 'notes', headerName: 'Notes' },
        { field: 'unit', headerName: 'Unit' },
        { field: 'createdAt', headerName: 'Created At' },
        { field: 'updatedAt', headerName: 'Updated At' },
        { field: 'createdBy', headerName: 'Created By' },
        { field: 'updatedBy', headerName: 'Updated By' },
      ];

      const url =
        type === 'pdf'
          ? `${apiUrl}/api/selected_schemedownloadpdf-storein`
          : `${apiUrl}/api/storein-report-by-scheme`;

      const filename =
        type === 'pdf'
          ? `${selectedScheme}_StockIn_Report.pdf`
          : `${selectedScheme}_Selected_StockIn_Report.xlsx`;

      // Send data to the backend
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows, columns, role, department, selectedWarehouseDepartment }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate the report: ${errorText}`);
      }

      // Download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      // Show success message
      setSnackbar({
        open: true,
        message: `Your report (${filename}) has been downloaded successfully.`,
        severity: 'success',
      });
      handleSchemeDownloadPopoverClose();
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Something went wrong while generating the report.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentYear = () => new Date().getFullYear();

  const getYearsRange = () => {
    const currentYear = getCurrentYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
  };

  const handleDeleteRow = async (id) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    // Find the row to delete
    const rowToDelete = tableRows.find((row) => row.id === id);

    if (!rowToDelete) {
      setSnackbar({
        open: true,
        message: 'Row not found.',
        severity: 'error',
      });
      return;
    }

    try {
      // Step 1: Delete the stockout entries by materialCode
      const materialCode = rowToDelete.materialCode;
      const deleteStockOutResponse = await fetch(
        `${apiUrl}/api/stockout/materialCode/${encodeURIComponent(materialCode)}`,
        {
          method: 'DELETE',
        }
      );

      if (!deleteStockOutResponse.ok && deleteStockOutResponse.status !== 404) {
        // Handle errors other than 404 (e.g., 500)
        const errorData = await deleteStockOutResponse.json();
        throw new Error(errorData.message || 'Failed to delete from StockOut model');
      }

      // Step 2: Delete the row from the StockIn model
      if (rowToDelete._id) {
        // If the row has a valid `_id`, it exists in the database
        const deleteStockInResponse = await fetch(`${apiUrl}/api/storein/${rowToDelete._id}`, {
          method: 'DELETE',
        });

        if (!deleteStockInResponse.ok) {
          throw new Error('Failed to delete the row from the database');
        }
      }

      // Step 3: Remove the deleted row from the local state
      setTableRows((prevRows) => prevRows.filter((row) => row.id !== id));

      // Show success message
      setSnackbar({
        open: true,
        message: 'Row deleted successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting row:', error);

      // Show error message
      setSnackbar({
        open: true,
        message: error.message || 'Error deleting row. Please try again.',
        severity: 'error',
      });
    }
  };
  const columns = [
    { field: 'scheme', headerName: isPONumber ? 'PO' : 'Scheme', width: 100 },
    { field: 'materialCode', headerName: 'Material Code', width: 100 },
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'materialQty', headerName: 'Quantity', width: 100, editable: true },
    {
      field: 'unit',
      headerName: 'Unit',
      width: 130,
      editable: true,
      type:
        (role === 'SUPER_ADMIN' && selectedWarehouseDepartment === 'Telecom') || isPONumber
          ? 'singleSelect'
          : 'string',
      valueOptions:
        (role === 'SUPER_ADMIN' && selectedWarehouseDepartment === 'Telecom') || isPONumber
          ? ['Piece', 'Pair']
          : [],
      renderEditCell: (params) => {
        if ((role === 'SUPER_ADMIN' && selectedWarehouseDepartment === 'Telecom') || isPONumber) {
          return (
            <Select
              fullWidth
              value={params.value || ''}
              onChange={(event) => {
                params.api.setEditCellValue({
                  id: params.id,
                  field: params.field,
                  value: event.target.value,
                });
              }}
            >
              <MenuItem value="Piece">Piece</MenuItem>
              <MenuItem value="Pair">Pair</MenuItem>
            </Select>
          );
        }
        return (
          <TextField
            fullWidth
            value={params.value || ''}
            onChange={(event) => {
              params.api.setEditCellValue({
                id: params.id,
                field: params.field,
                value: event.target.value,
              });
            }}
          />
        );
      },
    },
    { field: 'notes', headerName: 'Notes', width: 100, editable: true },
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
      renderCell: (params) => (
        <IconButton onClick={() => handleDeleteRow(params.row.id)} color="error">
          <DeleteIcon sx={{ height: '18px' }} />
        </IconButton>
      ),
    },
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: {
            xs: '95%', // Full width on mobile
            sm: '90%', // Slightly smaller on tablets
            md: '85%', // Medium screens
            lg: '80%', // Large screens
          },
          maxWidth: 1000,
          height: {
            xs: '90vh', // Consistent height on mobile
            sm: '90vh', // Same height on tablets
            md: '90vh', // Same height on medium screens
            lg: '90vh', // Same height on large screens
          },
          maxHeight: 1000,
          bgcolor: 'background.paper',
          boxShadow: 24,
          pt: 4, // Consistent padding top
          pr: 4, // Consistent padding right
          pl: 4, // Consistent padding left
          pb: 0, // Consistent padding bottom
          borderRadius: 2,
          overflow: 'auto', // Enable scrolling if content overflows
        }}
      >
        <Typography variant="h6" mb={1}>
          Stock In Management
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
              {' '}
              {/* Consistent margin top */}
              {/* Month Selector */}
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    label="Month"
                    sx={{
                      p: 0, // remove internal padding
                      minHeight: '32px', // make the height more compact
                      fontSize: '0.875rem', // optional: smaller font
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
              {/* Year Selector */}
              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    label="Year"
                    sx={{
                      p: 0, // remove internal padding
                      minHeight: '32px', // make the height more compact
                      fontSize: '0.875rem', // optional: smaller font
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
              {/* Download Button */}
              <Grid item xs={4} sm={2} md={1}>
                <IconButton
                  onClick={handleDownloadPopoverOpen}
                  sx={{
                    width: 40,
                    height: 40,
                    p: 0.5, // minimal padding
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
              {/* Download for selected scheme */}
              <Grid item xs={8} sm={4} md={2}>
                <Button
                  onClick={handleSchemeDownloadPopoverOpen}
                  sx={{
                    backgroundColor: '#00284C',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#00288C',
                    },
                    // height: '40px', // Consistent button height
                    height: '32px', // reduced height
                    minWidth: 0, // optional: remove default minWidth
                    px: 1.5, // reduced horizontal padding
                    fontSize: '0.75rem', // optional: smaller font
                  }}
                  variant="contained"
                  color="inherit"
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
              {/* Action buttons - Maintain consistent spacing */}
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
                    xs: 2, // Margin top on mobile
                    sm: 0, // No margin on larger screens
                  },
                }}
              >
                <Button
                  sx={{
                    backgroundColor: 'black',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#333333',
                    },
                    // height: '40px', // Consistent button height
                    height: '32px', // reduced height
                    minWidth: 0, // optional: remove default minWidth
                    px: 1.5, // reduced horizontal padding
                    fontSize: '0.75rem', // optional: smaller font
                  }}
                  color="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                {role !== 'MANAGER' && (
                  <Button
                    sx={{
                      backgroundColor: '#00284C',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#00288C',
                      },
                      // height: '40px', // Consistent button height
                      height: '32px', // reduced height
                      minWidth: 0, // optional: remove default minWidth
                      px: 1.5, // reduced horizontal padding
                      fontSize: '0.75rem', // optional: smaller font
                    }}
                    variant="contained"
                    color="inherit"
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                )}
              </Grid>
            </Grid>
            {role !== 'MANAGER' && (
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} sm={8}>
                  <Autocomplete
                    size="small"
                    limitTags={2}
                    multiple
                    options={materials}
                    getOptionLabel={(option) => `${option.code} - ${option.description}`}
                    value={selectedMaterials}
                    onChange={(_, newValue) => setSelectedMaterials(newValue)}
                    sx={{
                      '& .MuiAutocomplete-root': {
                        minHeight: '80px',
                      },
                      '& .MuiAutocomplete-inputRoot': {
                        flexWrap: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingRight: {
                          xs: '30px', // Smaller on mobile
                          sm: '90px', // Larger on desktop
                        },
                      },
                      '& .MuiAutocomplete-tag': {
                        maxWidth: {
                          xs: '100px', // Smaller tags on mobile
                          sm: '150px', // Larger tags on desktop
                        },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                    filterOptions={(options, { inputValue }) =>
                      options.filter((option) => option?.code || option?.description)
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Select Materials" fullWidth />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    sx={{
                      backgroundColor: '#00284C',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#00288C',
                      },
                      height: '40px', // Consistent button height
                    }}
                    variant="contained"
                    color="inherit"
                    onClick={handleAddMaterials}
                    fullWidth
                  >
                    Add Materials
                  </Button>
                </Grid>
              </Grid>
            )}

            <Paper
              sx={{
                mt: 2,
                height: {
                  xs: '280px',
                  sm: '280px',
                  md: '280px',
                  lg: '280px',
                },
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <DataGrid
                rows={tableRows}
                columns={columns.map((col) => ({
                  ...col,
                  flex: 1, // Make columns flexible
                  minWidth: 100, // Minimum width for each column
                  resizable: true, // Enable column resizing
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
                  // Main container
                  '& .MuiDataGrid-main': {
                    overflow: 'auto',
                    flex: 1,
                  },

                  // Rows - complete padding removal
                  '& .MuiDataGrid-row': {
                    minHeight: '20px !important',
                    maxHeight: '20px !important',
                    padding: '0 !important',
                    margin: '0 !important',
                  },

                  // Cells - tight styling but with text overflow handling
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

                  // Column headers
                  '& .MuiDataGrid-columnHeader': {
                    padding: '0 4px !important',
                    fontSize: '0.5rem',
                    minHeight: '32px !important',
                  },

                  // Header title container
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    padding: '0 !important',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },

                  // Virtual scroller
                  '& .MuiDataGrid-virtualScroller': {
                    marginTop: '0 !important',
                    marginBottom: '0 !important',
                  },

                  // Column separator - visible for resizing
                  '& .MuiDataGrid-columnSeparator': {
                    display: 'block !important',
                  },

                  // Footer container
                  '& .MuiDataGrid-footerContainer': {
                    minHeight: '40px !important',
                  },

                  height: '100%',
                }}
                density="compact"
                disableColumnMenu={false} // Enable column menu for sorting/filtering
                disableRowSelectionOnClick
                disableColumnResize={false} // Enable column resizing
                onColumnWidthChange={(params) => {
                  // Optional: You can save column widths here if needed
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
  );
};

StockInModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  selectedScheme: PropTypes.string,
  selectedWarehouseDepartment: PropTypes.string,
  selectedWarehouseId: PropTypes.string,
  selectedDepartmentId: PropTypes.string,
};

export default StockInModal;
