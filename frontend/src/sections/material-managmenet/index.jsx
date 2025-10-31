import React, { useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Grid,
  Chip,
  Paper,
  Alert,
  Select,
  Popover,
  Divider,
  MenuItem,
  Snackbar,
  Typography,
  IconButton,
  InputLabel,
  FormControl,
  CircularProgress,
} from '@mui/material';

const StockReportScreen = () => {
  const [tableRows, setTableRows] = useState([]);
  const [allTableRows, setAllTableRows] = useState([]); // Store all data for filtering
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [materials, setMaterials] = useState([]); // Available materials
  const [selectedMaterial, setSelectedMaterial] = useState(''); // Selected material filter
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);

  const role = sessionStorage.getItem('role');
  const department = sessionStorage.getItem('department');
  const departmentId = sessionStorage.getItem('departmentId');
  const warehouseId = sessionStorage.getItem('warehouseId');

  // Fetch warehouses based on user role
  const fetchWarehouses = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${apiUrl}/api/warehouses`);
      if (!response.ok) throw new Error('Failed to fetch warehouses');
      const data = await response.json();

      let filteredWarehouses = [];

      if (role === 'SUPER_ADMIN') {
        filteredWarehouses = data.filter((warehouse) => warehouse.isActive === true);
      } else if (role === 'MANAGER') {
        filteredWarehouses = data.filter(
          (warehouse) =>
            warehouse.isActive === true &&
            String(warehouse.departmentId?._id || warehouse.departmentId) === departmentId
        );
      } else if (role === 'WAREHOUSE_USER') {
        filteredWarehouses = data.filter(
          (warehouse) => warehouse.isActive === true && String(warehouse._id) === warehouseId
        );
      }

      setWarehouses(filteredWarehouses);
      return filteredWarehouses;
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      setSnackbar({
        open: true,
        message: `Failed to fetch warehouses: ${error.message}`,
        severity: 'error',
      });
      return [];
    }
  }, [role, departmentId, warehouseId]);

  // Filter data based on user's accessible warehouses
  const filterDataByRole = useCallback(
    (data, userWarehouses) => {
      if (role === 'SUPER_ADMIN') {
        return data; // Super admin sees all data
      }

      // Get warehouse IDs that the user has access to
      const accessibleWarehouseIds = userWarehouses.map((warehouse) => String(warehouse._id));

      // Filter data to only include items from accessible warehouses
      return data.filter((item) => accessibleWarehouseIds.includes(String(item.warehouseId)));
    },
    [role]
  );

  // Extract unique materials from processed data - wrapped in useCallback
  const extractMaterials = useCallback((processedData) => {
    const uniqueMaterials = processedData.reduce((acc, item) => {
      const materialKey = `${item.materialCode}-${item.description}`;
      if (!acc.find((m) => m.value === materialKey)) {
        acc.push({
          value: materialKey,
          label: `${item.materialCode} - ${item.description}`,
          materialCode: item.materialCode,
          description: item.description,
        });
      }
      return acc;
    }, []);

    // Sort materials by material code
    return uniqueMaterials.sort((a, b) => a.materialCode.localeCompare(b.materialCode));
  }, []);

  // Filter table rows based on selected material
  const filterTableRowsByMaterial = useCallback((allRows, selectedMaterialValue) => {
    if (!selectedMaterialValue || selectedMaterialValue === '') {
      return allRows;
    }
    return allRows.filter(
      (row) => `${row.materialCode}-${row.description}` === selectedMaterialValue
    );
  }, []);

  // Handle material selection change
  const handleMaterialChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedMaterial(selectedValue);

    // Filter the table rows based on selected material
    const filteredRows = filterTableRowsByMaterial(allTableRows, selectedValue);
    setTableRows(filteredRows);
  };

  // Clear material filter
  const clearMaterialFilter = () => {
    setSelectedMaterial('');
    setTableRows(allTableRows);
  };

  const processStockData = useCallback(
    (storeInData, stockOutData) => {
      // Create a map to aggregate materials by code and description
      const materialMap = new Map();

      // Process storein data
      storeInData.forEach((item) => {
        const key = `${item.materialCode}-${item.description}`;
        if (materialMap.has(key)) {
          const existing = materialMap.get(key);
          materialMap.set(key, {
            ...existing,
            stockIn: existing.stockIn + (item.materialQty || 0),
            date: item.createdAt > existing.date ? item.createdAt : existing.date,
          });
        } else {
          materialMap.set(key, {
            id: key,
            materialCode: item.materialCode,
            description: item.description,
            schemeName: item.scheme || '',
            stockIn: item.materialQty || 0,
            stockOut: 0,
            remainingStock: item.materialQty || 0,
            date: item.createdAt,
            warehouseId: item.warehouseId, // Include warehouse info for reference
          });
        }
      });

      // Process stockout data
      stockOutData.forEach((item) => {
        const key = `${item.materialCode}-${item.description}`;
        if (materialMap.has(key)) {
          const existing = materialMap.get(key);
          const stockOutQty = item.materialQty || 0;
          materialMap.set(key, {
            ...existing,
            stockOut: existing.stockOut + stockOutQty,
            remainingStock: existing.stockIn - (existing.stockOut + stockOutQty),
            date: item.createdAt > existing.date ? item.createdAt : existing.date,
          });
        } else {
          materialMap.set(key, {
            id: key,
            materialCode: item.materialCode,
            description: item.description,
            schemeName: item.scheme || '',
            stockIn: 0,
            stockOut: item.materialQty || 0,
            remainingStock: -(item.materialQty || 0),
            date: item.createdAt,
            warehouseId: item.warehouseId, // Include warehouse info for reference
          });
        }
      });

      // Convert map to array and format dates
      const processedData = Array.from(materialMap.values()).map((item) => ({
        ...item,
        date: new Date(item.date).toLocaleDateString(),
      }));

      // Set all data and extract materials
      setAllTableRows(processedData);
      const availableMaterials = extractMaterials(processedData);
      setMaterials(availableMaterials);

      // Apply current material filter if exists
      const filteredData = filterTableRowsByMaterial(processedData, selectedMaterial);
      setTableRows(filteredData);
    },
    [extractMaterials, filterTableRowsByMaterial, selectedMaterial]
  );

  // Fetch data from APIs with role-based filtering
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_APP_URL;

      // First, get the warehouses the user has access to
      const userWarehouses = await fetchWarehouses();

      if (userWarehouses.length === 0 && role !== 'SUPER_ADMIN') {
        setSnackbar({
          open: true,
          message: 'No accessible warehouses found for your role',
          severity: 'warning',
        });
        setTableRows([]);
        setAllTableRows([]);
        setMaterials([]);
        return;
      }

      // Fetch storein data
      const storeInResponse = await fetch(`${apiUrl}/api/storein`);
      if (!storeInResponse.ok) throw new Error('Failed to fetch storein data');
      const storeInData = await storeInResponse.json();

      // Fetch stockout data
      const stockOutResponse = await fetch(`${apiUrl}/api/stockout`);
      if (!stockOutResponse.ok) throw new Error('Failed to fetch stockout data');
      const stockOutData = await stockOutResponse.json();

      // Filter data based on user role and accessible warehouses
      const filteredStoreInData = filterDataByRole(storeInData, userWarehouses);
      const filteredStockOutData = filterDataByRole(stockOutData, userWarehouses);

      // Process and combine filtered data
      processStockData(filteredStoreInData, filteredStockOutData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: `Failed to fetch data: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [role, processStockData, fetchWarehouses, filterDataByRole]);

  // Process and combine stock data

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadPopoverOpen = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadPopoverClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleDownload = async (type) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    try {
      setLoading(true);

      // Use currently filtered rows for download
      const formattedRows = tableRows.map((row) => ({
        materialCode: row.materialCode,
        scheme: row.schemeName,
        poNumber: row.schemeName,
        description: row.description,
        stockin: row.stockIn,
        stockOut: row.stockOut,
        remaningStock: row.remainingStock,
        date: row.date,
      }));

      const mapFieldName = (fieldName) => {
        if (fieldName === 'schemeName') return 'scheme';
        if (fieldName === 'stockIn') return 'stockin';
        if (fieldName === 'stockOut') return 'stockOut';
        if (fieldName === 'remainingStock') return 'remaningStock';
        return fieldName;
      };

      const filteredColumns = columns
        .filter((col) => type === 'pdf' || col.field !== 'actions')
        .map((col) => ({
          field: mapFieldName(col.field),
          headerName: col.headerName,
        }));

      const url =
        type === 'pdf' ? `${apiUrl}/api/material-report` : `${apiUrl}/api/material-report-exl`;
      const filename = type === 'pdf' ? 'Material_Report.pdf' : 'Material_Report.xlsx';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: formattedRows,
          columns: filteredColumns,
          department: sessionStorage.getItem('department'),
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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

  const columns = [
    { field: 'materialCode', headerName: 'Material Code', width: 200 },
    { field: 'description', headerName: 'Description', width: 250 },
    {
      field: 'stockIn',
      headerName: 'Stock In',
      width: 150,
      editable: false,
    },
    {
      field: 'stockOut',
      headerName: 'Stock Out',
      width: 150,
      editable: false,
    },
    {
      field: 'remainingStock',
      headerName: 'Remaining Stock',
      width: 150,
      editable: false,
    },
  ];

  return (
    <Box sx={{ maxWidth: '100%', paddingX: 2 }}>
      <Typography variant="h4" mb={4}>
        Material Report
        {role === 'WAREHOUSE_USER' && (
          <Typography variant="subtitle1" color="text.secondary">
            (Showing data for your warehouse only)
          </Typography>
        )}
        {role === 'MANAGER' && (
          <Typography variant="subtitle1" color="text.secondary">
            (Showing data for your department warehouses)
          </Typography>
        )}
      </Typography>
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Material Filter Dropdown */}
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="material-select-label">All Material</InputLabel>
              <Select
                labelId="material-select-label"
                id="material-select"
                value={selectedMaterial}
                label="Filter by Material"
                onChange={handleMaterialChange}
                displayEmpty
              >
                <MenuItem value="">All Materials </MenuItem>
                {materials.map((material) => (
                  <MenuItem key={material.value} value={material.value}>
                    {material.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Show selected material as chip */}
          {selectedMaterial && (
            <Grid item>
              <Chip
                label={
                  materials.find((m) => m.value === selectedMaterial)?.label || selectedMaterial
                }
                onDelete={clearMaterialFilter}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Grid>
          )}

          {/* Download Button */}
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

          {/* Results count */}
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Showing {tableRows.length} of {allTableRows.length} materials
              {selectedMaterial && ' (filtered)'}
            </Typography>
          </Grid>
        </Box>

        {loading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            autoHeight
            checkboxSelection={false}
            pageSizeOptions={[5, 10, 25]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#000000 !important',
                color: '#ffffff !important',
              },
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: '#000000 !important',
                color: '#ffffff !important',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                color: '#ffffff !important',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                color: '#ffffff !important',
              },
              '& .MuiDataGrid-sortIcon': {
                color: '#ffffff !important',
              },
              '& .MuiDataGrid-menuIconButton': {
                color: '#ffffff !important',
              },
              '& .MuiDataGrid-filterIcon': {
                color: '#ffffff !important',
              },
              '& .MuiDataGrid-iconButtonContainer': {
                color: '#ffffff !important',
              },
              '& .MuiDataGrid-columnSeparator': {
                color: '#ffffff !important',
              },
            }}
          />
        )}
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StockReportScreen;
