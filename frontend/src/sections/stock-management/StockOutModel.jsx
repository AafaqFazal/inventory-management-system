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
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null); // State for download popover
  const [materials, setMaterials] = useState([]); // State to store fetched materials
  const [schemeDownloadAnchorEl, setSchemeDownloadAnchorEl] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const role = sessionStorage.getItem('role');
  const warehouseId = sessionStorage.getItem('warehouseId'); // Get warehouseId from session storage
  const department = sessionStorage.getItem('department');
  const departmentId = sessionStorage.getItem('departmentId');
  const isPONumber =
    ((role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom') ||
    (role === 'SUPER_ADMIN' && selectedWarehouseDepartment === 'Telecom');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page when rows per page changes
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
      // Fetch data directly instead of using fetchSchemeData function
      const checkSchemeUrl = `${apiUrl}/api/stockout/checkscheme/${encodeURIComponent(selectedScheme)}`;
      const checkSchemeResponse = await fetch(checkSchemeUrl);

      if (!checkSchemeResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      let storeInData = await checkSchemeResponse.json();

      // If no data found, try the mapping API
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

      // Filter the data based on role and permissions if needed
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

      // Format the rows for the Excel file
      const rows = filteredData.map((item) => ({
        scheme: item.scheme,
        description: item.description,
        materialCode: item.materialCode,
        materialQty: item.materialQty,
        // type: item.type || '',
        notes: item.notes || '',
        address: item.address || '',
        unit: item.unit || '',
        areaCode: item.areaCode || '',
        receiverName: item.receiverName || '',
        createdAt: item.createdAt || new Date().toISOString(),
        // updatedAt: item.updatedAt || '',
        // createdBy: item.createdBy || userId,
        // updatedBy: item.updatedBy || '',
      }));

      const columns = [
        { field: 'scheme', headerName: 'Scheme' },
        { field: 'description', headerName: 'Description' },
        { field: 'materialCode', headerName: 'Material Code' },
        { field: 'materialQty', headerName: 'Material Qty' },
        { field: 'address', headerName: 'Address' },
        { field: 'unit', headerName: 'Unit' },
        { field: 'areaCode', headerName: 'Area Code' },
        { field: 'receiverName', headerName: 'Receiver Name' },
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

      // Send the rows and columns to the backend
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
      // Fetch data from stockout API
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
          console.log('StockOut Data:', stockoutData); // Log StockOut data
        } catch (jsonError) {
          console.error('JSON parse error for stockout API:', jsonError);
        }
      }

      // Fetch data from mapping API
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
          console.log('Mapping Data:', mappingData); // Log Mapping data
        } catch (jsonError) {
          console.error('JSON parse error for mapping API:', jsonError);
        }
      }

      // Merge data
      const mergedData = mergeData(stockoutData, mappingData);
      console.log('Merged Data:', mergedData); // Log Merged data

      // Set merged data to table rows
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
  }, []); // Add dependencies if needed, e.g., setLoading, setSnackbar, etc.
  // Add dependencies if needed, e.g., setLoading, setSnackbar, etc.

  const mergeData = (stockoutData, mappingData) => {
    const mergedData = [...stockoutData];

    // Create a map of stockout data by materialCode for quick lookup
    const stockoutMap = new Map();
    stockoutData.forEach((row) => {
      if (row.materialCode) {
        stockoutMap.set(row.materialCode, row);
      }
    });

    // Add mapping data to mergedData if it doesn't already exist in stockout data
    mappingData.forEach((mappingRow) => {
      if (!stockoutMap.has(mappingRow.materialCode)) {
        mergedData.push({
          ...mappingRow,
          materialQty: 0, // Set materialQty to 0 for data from mapping API
          id: mappingRow._id || `generated-${Date.now()}-${mappingRow.materialCode}`, // Ensure unique ID
        });
      }
    });

    // Ensure all rows have a unique ID
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

    // Validate required fields for each row
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
      fetchMaterials(); // Fetch materials when the modal opens
      setPage(0); // Reset to the first page when a new scheme is selected
      setRowsPerPage(10); // Reset rows per page to default
    } else {
      setTableRows([]); // Clear table rows if no scheme is selected or modal is closed
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

  // Handle download popover open
  const handleDownloadPopoverOpen = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  // Handle download popover close
  const handleDownloadPopoverClose = () => {
    setDownloadAnchorEl(null);
  };

  // Handle download action
  // Handle download of reports
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
    { field: 'materialCode', headerName: 'Material Code', width: 100, editable: true },
    { field: 'description', headerName: 'Description', width: 150, editable: true },
    {
      field: 'materialQty',
      headerName: 'Material Qty',
      width: 100,
      editable: true,
      type: 'number',
    },
    { field: 'receiverName', headerName: 'Receiver Name', width: 120, editable: true },
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
    {
      field: 'areaCode',
      headerName: isPONumber ? 'Site ID' : 'Area Code',
      width: 100,
      editable: true,
    },
    { field: 'address', headerName: isPONumber ? 'Notes' : 'Address', width: 100, editable: true },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 150,
      editable: false,
      valueGetter: (params) => (params ? new Date(params).toISOString().split('T')[0] : ''),
    },
  ];

  // Handle scheme download popover open
  const handleSchemeDownloadPopoverOpen = (event) => {
    setSchemeDownloadAnchorEl(event.currentTarget);
  };

  // Handle scheme download popover close
  const handleSchemeDownloadPopoverClose = () => {
    setSchemeDownloadAnchorEl(null);
  };

  return (
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
                    // height: '40px',
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

              {/* Action buttons */}
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
                    backgroundColor: 'black',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#333333',
                    },
                    // height: '40px',
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
                      // height: '40px',
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
