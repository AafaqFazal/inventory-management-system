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

const StockReportModal = ({
  open,
  onClose,
  onSave,
  selectedScheme,
  selectedWarehouseDepartment,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
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

  const fetchSchemeData = async (scheme) => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_APP_URL;

    try {
      // Fetch Stock Out and Stock In data in parallel
      const [stockOutResponse, stockInResponse] = await Promise.all([
        fetch(`${apiUrl}/api/stockout/checkscheme/${encodeURIComponent(scheme)}`),
        fetch(`${apiUrl}/api/checkscheme/${encodeURIComponent(scheme)}`),
      ]);

      // Process Stock Out data
      const stockOutData = stockOutResponse.ok ? await stockOutResponse.json() : [];
      // Process Stock In data
      const stockInData = stockInResponse.ok ? await stockInResponse.json() : [];

      console.log('Stock Out Data:', stockOutData);
      console.log('Stock In Data:', stockInData);

      // Create a map to merge data by unique material identifiers
      const mergedDataMap = new Map();

      // Process Stock In data
      if (Array.isArray(stockInData)) {
        stockInData.forEach((item, index) => {
          const materialKey = `${item.materialCode}-${item.materialName}`;

          mergedDataMap.set(materialKey, {
            id: `stockin-${index}-${Date.now()}`,
            schemeName: scheme,
            materialCode: item.materialCode,

            description: item.description,
            'Stock In': item.materialQty || 0,
            'Stock Out': 0, // Default Stock Out to 0
            'Remaining Stock': item.materialQty || 0, // Remaining Stock is same as Stock In initially
          });
        });
      }

      // Process Stock Out data and merge with existing entries or add new ones
      if (Array.isArray(stockOutData)) {
        stockOutData.forEach((item, index) => {
          const materialKey = `${item.materialCode}-${item.materialName}`;

          if (mergedDataMap.has(materialKey)) {
            // Update existing entry
            const existingData = mergedDataMap.get(materialKey);
            existingData['Stock Out'] = item.materialQty || 0;
            existingData['Remaining Stock'] =
              (existingData['Stock In'] || 0) - (item.materialQty || 0);
            mergedDataMap.set(materialKey, existingData);
          } else {
            // Add new entry for Stock Out data (if no Stock In data exists)
            mergedDataMap.set(materialKey, {
              id: `stockout-${index}-${Date.now()}`,
              schemeName: scheme,
              materialCode: item.materialCode,

              description: item.description,
              'Stock In': 0, // Default Stock In to 0
              'Stock Out': item.materialQty || 0,
              'Remaining Stock': -(item.materialQty || 0),
            });
          }
        });
      }

      // Convert map to array
      const mergedData = Array.from(mergedDataMap.values()).map((row) => ({
        ...row,
        date: new Date().toISOString().split('T')[0], // Add current date
      }));

      console.log('Merged Data:', mergedData);
      setTableRows(mergedData);
    } catch (error) {
      console.error('Error fetching scheme data:', error);
      setTableRows([]);
      setSnackbar({
        open: true,
        message: 'Failed to fetch scheme data',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowSelection = (selection) => {
    setSelectedRows(selection);
  };

  const processRowUpdate = (newRow) => {
    const updatedRows = tableRows.map((row) => {
      if (row.id === newRow.id) {
        // Calculate Remaining Stock based on updated Stock In and Stock Out
        const remainingStock = (newRow['Stock In'] || 0) - (newRow['Stock Out'] || 0);
        return { ...newRow, 'Remaining Stock': remainingStock };
      }
      return row;
    });

    setTableRows(updatedRows);
    return newRow;
  };
  // Handle download popover open
  const handleDownloadPopoverOpen = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  // Handle download popover close
  const handleDownloadPopoverClose = () => {
    setDownloadAnchorEl(null);
  };

  // handleDownload Function for StockReportModal
  const handleDownload = async (type) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    try {
      setLoading(true);

      // Format the data consistently for both PDF and Excel
      const formattedRows = tableRows.map((row) => ({
        materialCode: row.materialCode,
        scheme: row.schemeName,
        poNumber: row.schemeName, // Include PO Number for Telecom
        description: row.description || row.materialName,
        stockin: row['Stock In'],
        stockOut: row['Stock Out'],
        remaningStock: row['Remaining Stock'],
        date: row.date,
      }));

      // Create a mapping function to convert frontend field names to backend expected names
      const mapFieldName = (fieldName) => {
        if (fieldName === 'schemeName') return 'scheme';
        if (fieldName === 'Stock In') return 'stockin';
        if (fieldName === 'Stock Out') return 'stockOut';
        if (fieldName === 'Remaining Stock') return 'remaningStock';
        return fieldName;
      };

      // Filter out the "action" column for Excel
      const filteredColumns = columns
        .filter((col) => type === 'pdf' || col.field !== 'actions') // Skip 'actions' for Excel
        .map((col) => ({
          field: mapFieldName(col.field),
          headerName: col.headerName,
        }));

      const url =
        type === 'pdf'
          ? `${apiUrl}/api/remainingStockPdf-report`
          : `${apiUrl}/api/remainingStock-report`;
      const filename = type === 'pdf' ? 'Stock_Report.pdf' : 'Stock_Report.xlsx';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: formattedRows,
          columns: filteredColumns,
          department: sessionStorage.getItem('department'),
          selectedWarehouseDepartment,
          role,
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
      window.URL.revokeObjectURL(downloadUrl); // Clean up

      setSnackbar({
        open: true,
        message: `${filename} downloaded successfully`,
        severity: 'success',
      });
      handleDownloadPopoverClose(); // Close the popover after download
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
  useEffect(() => {
    if (open && selectedScheme) {
      fetchSchemeData(selectedScheme);
      fetchMaterials(); // Fetch materials when the modal opens
    } else {
      setTableRows([]); // Clear table rows if no scheme is selected or modal is closed
    }
  }, [open, selectedScheme, fetchMaterials]);

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
      field: 'schemeName',
      headerName: isPONumber ? 'PO' : 'Scheme',
      width: 130,
    },
    { field: 'materialCode', headerName: 'Material Code', width: 130 },
    // { field: 'materialName', headerName: 'Material Name', width: 130 },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'Stock In',
      headerName: 'Stock In',
      width: 130,
      editable: true,
      editMode: 'cell',
    },
    {
      field: 'Stock Out',
      headerName: 'Stock Out',
      width: 130,
      editable: true,
      editMode: 'cell',
    },
    {
      field: 'Remaining Stock',
      headerName: 'Remaining Stock',
      width: 130,
      editable: false, // Disable editing for Remaining Stock
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 130,
      editable: false,
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
          Remaining Stock
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
            <Grid container justifyContent="flex-start" sx={{ mt: 2 }}>
              {/* Download Button */}
              <Grid item xs={12} sm={6} md={3}>
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

              {/* Action buttons */}
              <Grid
                item
                xs={12}
                sm={6}
                md={9}
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                }}
              >
                <Button
                  sx={{
                    backgroundColor: 'grey',

                    height: '40px',
                  }}
                  variant="contained"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>

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
                    backgroundColor: '#000000 !important',
                    color: '#ffffff !important',
                  },

                  // Header title container
                  '& .MuiDataGrid-columnHeaderTitleContainer': {
                    padding: '0 !important',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    backgroundColor: '#000000 !important',
                    color: '#ffffff !important',
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

StockReportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  selectedScheme: PropTypes.string,
  selectedWarehouseDepartment: PropTypes.string,
};

export default StockReportModal;
