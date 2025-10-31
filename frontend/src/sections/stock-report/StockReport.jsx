import React, { useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Box,
  Grid,
  Paper,
  Alert,
  Select,
  Button,
  Divider,
  Popover,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
} from '@mui/material';

export default function StockReport() {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [allSchemes, setAllSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [rows, setRows] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [updateCounts, setUpdateCounts] = useState({});
  const [warehouses, setWarehouses] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const warehouseId = sessionStorage.getItem('warehouseId');
  const userRole = sessionStorage.getItem('role');
  const departmentId = sessionStorage.getItem('departmentId');

  useEffect(() => {
    const policies = JSON.parse(sessionStorage.getItem('userPolicies')) || [];
    const readOnlyPolicy = policies.find((policy) => policy.mode === 'READ_ONLY');
    setIsReadOnly(!!readOnlyPolicy);
  }, []);

  // Set initial values for selectedDepartment and selectedWarehouse based on user role
  useEffect(() => {
    if (departmentId) {
      setSelectedDepartment(departmentId);
    }

    if (userRole === 'WAREHOUSE_USER' && warehouseId) {
      setSelectedWarehouse(warehouseId);

      // Fetch data for the automatically selected warehouse
      const fetchDataForWarehouse = async () => {
        const selectedWarehouseId = warehouseId;
        setSelectedScheme(null);
        setSelectedMaterials([]);

        // Filter schemes and materials based on the selected warehouse
        const filteredSchemes = allSchemes.filter(
          (scheme) => String(scheme.warehouseId?._id) === selectedWarehouseId
        );
        setSchemes(filteredSchemes);

        const filteredMaterials = allMaterials.filter(
          (material) => String(material.warehouseId?._id) === selectedWarehouseId
        );
        setMaterials(filteredMaterials);

        if (!selectedWarehouseId) {
          setRows([]);
          return;
        }

        const apiUrl = import.meta.env.VITE_APP_URL;
        try {
          const [stockOutResponse, stockInResponse] = await Promise.all([
            fetch(`${apiUrl}/api/stockout/warehouse/${selectedWarehouseId}`),
            fetch(`${apiUrl}/api/storein/warehouse/${selectedWarehouseId}`),
          ]);

          if (!stockOutResponse.ok && !stockInResponse.ok) {
            throw new Error('Stock data not found for the selected warehouse');
          }

          const stockOutData = stockOutResponse.ok ? await stockOutResponse.json() : [];
          const stockInData = stockInResponse.ok ? await stockInResponse.json() : [];

          console.log('Stock Out Data:', stockOutData);
          console.log('Stock In Data:', stockInData);

          const mergedDataMap = new Map();
          const currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

          if (Array.isArray(stockInData)) {
            stockInData.forEach((item, index) => {
              const materialKey = `${item.materialCode}-${item.description}`; // Use description instead of materialName
              const formattedDate = item.date
                ? new Date(item.date).toISOString().split('T')[0]
                : currentDate;

              mergedDataMap.set(materialKey, {
                id: `stockin-${index}-${Date.now()}`,
                schemeName: item.scheme || 'N/A',
                materialCode: item.materialCode,
                description: item.description || 'N/A',
                'Stock In': item.materialQty || 0,
                'Stock Out': 0,
                'Remaining Stock': item.materialQty || 0,
                date: formattedDate,
              });
            });
          }

          if (Array.isArray(stockOutData)) {
            stockOutData.forEach((item, index) => {
              const materialKey = `${item.materialCode}-${item.description}`;
              const formattedDate = item.date
                ? new Date(item.date).toISOString().split('T')[0]
                : currentDate;

              if (mergedDataMap.has(materialKey)) {
                const existingData = mergedDataMap.get(materialKey);
                existingData['Stock Out'] = item.materialQty || 0;
                existingData['Remaining Stock'] =
                  (existingData['Stock In'] || 0) - (item.materialQty || 0);
                existingData.date = existingData.date || formattedDate;
                mergedDataMap.set(materialKey, existingData);
              } else {
                mergedDataMap.set(materialKey, {
                  id: `stockout-${index}-${Date.now()}`,
                  schemeName: item.scheme || 'N/A',
                  materialCode: item.materialCode,
                  description: item.description || 'N/A',
                  'Stock In': 0,
                  'Stock Out': item.materialQty || 0,
                  'Remaining Stock': -(item.materialQty || 0),
                  date: formattedDate,
                });
              }
            });
          }

          const mergedData = Array.from(mergedDataMap.values());
          console.log('Merged Data:', mergedData);

          setRows(mergedData);
        } catch (error) {
          console.error('Error fetching stock data:', error);
          setRows([]);
          showSnackbar('Error fetching stock data. Please try again.', 'error');
        }
      };

      fetchDataForWarehouse();
    }
  }, [departmentId, warehouseId, userRole, allSchemes, allMaterials]); // Add dependencies used inside the effect

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

      const formattedRows = rows.map((row) => ({
        materialCode: row.materialCode,
        scheme: row.schemeName,
        poNumber: row.schemeName,
        description: row.description || row.materialName,
        stockin: row['Stock In'],
        stockOut: row['Stock Out'],
        remaningStock: row['Remaining Stock'],
        date: row.date || new Date().toISOString().split('T')[0], // Ensure date is always present
      }));

      const mapFieldName = (fieldName) => {
        if (fieldName === 'schemeName') return 'scheme';
        if (fieldName === 'Stock In') return 'stockin';
        if (fieldName === 'Stock Out') return 'stockOut';
        if (fieldName === 'Remaining Stock') return 'remaningStock';
        return fieldName;
      };

      const filteredColumns = columns
        .filter((col) => type === 'pdf' || col.field !== 'actions')
        .map((col) => ({
          field: mapFieldName(col.field),
          headerName: col.headerName,
        }));

      const url =
        type === 'pdf' ? `${apiUrl}/api/StockPdf-report` : `${apiUrl}/api/Stock-report-exl`;
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
          userRole,
          departmentName,
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

  const departmentName = departments.find((dep) => dep._id === selectedDepartment)?.name || '';

  const isPONumber =
    ((userRole === 'WAREHOUSE_USER' || userRole === 'MANAGER') && departmentName === 'Telecom') ||
    (userRole === 'SUPER_ADMIN' && departmentName === 'Telecom');

  console.log(`selectedDepartment ID: ${selectedDepartment}, Department Name: ${departmentName}`);

  const columns = [
    {
      field: 'schemeName',
      headerName: isPONumber ? 'PO' : 'Scheme',
      width: 130,
    },
    { field: 'materialCode', headerName: 'Material Code', width: 130 },
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
      editable: true,
      editMode: 'cell',
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 130,
      editable: false,
    },
  ];

  useEffect(() => {
    const fetchSchemes = async () => {
      const apiUrl = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${apiUrl}/api/schemes`);
        if (!response.ok) throw new Error('Failed to fetch schemes');
        const data = await response.json();
        setAllSchemes(data);
        const filteredSchemes = data.filter((scheme) => {
          const { isActive } = scheme;
          const matchesWarehouse =
            userRole === 'WAREHOUSE_USER' ? String(scheme.warehouseId?._id) === warehouseId : true;
          return isActive && matchesWarehouse;
        });
        setSchemes(filteredSchemes);
      } catch (error) {
        console.error('Error fetching schemes:', error);
      }
    };

    fetchSchemes();
  }, [warehouseId, userRole]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      const apiUrl = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${apiUrl}/api/warehouses`);
        if (!response.ok) throw new Error('Failed to fetch warehouses');
        const data = await response.json();
        setAllWarehouses(data);
        let filteredWarehouses = data;
        if (userRole === 'WAREHOUSE_USER') {
          filteredWarehouses = data.filter((warehouse) => warehouse._id === warehouseId);

          // Auto-select warehouse for WAREHOUSE_USER
          if (warehouseId && filteredWarehouses.length > 0) {
            setSelectedWarehouse(warehouseId);

            // Also filter schemes for this warehouse
            const warehouseSchemes = allSchemes.filter(
              (scheme) => String(scheme.warehouseId?._id) === warehouseId
            );
            setSchemes(warehouseSchemes);
          }
        } else if (userRole === 'MANAGER') {
          filteredWarehouses = data.filter(
            (warehouse) =>
              warehouse.isActive === true &&
              String(warehouse.departmentId?._id || warehouse.departmentId) === departmentId
          );
        }
        setWarehouses(filteredWarehouses);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };

    if (allSchemes.length > 0) {
      fetchWarehouses();
    }
  }, [warehouseId, userRole, departmentId, allSchemes]); // Add allSchemes as a dependency

  useEffect(() => {
    const fetchDepartments = async () => {
      const apiUrl = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${apiUrl}/api/departments`);
        if (!response.ok) throw new Error('Failed to fetch departments');
        const data = await response.json();
        let filteredDepartments = data;
        if (userRole === 'WAREHOUSE_USER' || userRole === 'MANAGER') {
          filteredDepartments = data.filter((dep) => dep._id === departmentId);

          // Auto-select department for both WAREHOUSE_USER and MANAGER
          if (departmentId && filteredDepartments.length > 0) {
            setSelectedDepartment(departmentId);

            // For MANAGER, we need to filter warehouses for this department
            if (userRole === 'MANAGER') {
              const departmentWarehouses = allWarehouses.filter(
                (warehouse) =>
                  String(warehouse.departmentId?._id || warehouse.departmentId) === departmentId
              );
              setWarehouses(departmentWarehouses);
            }
          }
        }
        setDepartments(filteredDepartments);
      } catch (error) {
        console.error('Error fetching Departments:', error);
      }
    };

    if (allWarehouses.length > 0) {
      fetchDepartments();
    }
  }, [userRole, departmentId, allWarehouses]);

  const handleDepartmentChange = (event) => {
    const selectedDepartmentId = event.target.value;
    setSelectedDepartment(selectedDepartmentId);

    // Clear rows when department changes
    setRows([]);

    // Filter warehouses based on the selected department
    const filteredWarehouses = allWarehouses.filter(
      (warehouse) =>
        String(warehouse.departmentId?._id || warehouse.departmentId) === selectedDepartmentId
    );
    setWarehouses(filteredWarehouses);

    // Reset selected warehouse and scheme
    setSelectedWarehouse('');
    setSelectedScheme(null);
  };
  const handleSchemeChange = async (event) => {
    const newSelectedSchemeName = event.target.value.trim();
    console.log('Selected Scheme in Parent:', newSelectedSchemeName);

    const selectedSchemeData = schemes.find((scheme) => scheme.code === newSelectedSchemeName);
    setSelectedScheme(selectedSchemeData);

    if (!newSelectedSchemeName) {
      // If scheme is deselected, fetch and show warehouse data
      if (selectedWarehouse) {
        const apiUrl = import.meta.env.VITE_APP_URL;
        try {
          const [stockOutResponse, stockInResponse] = await Promise.all([
            fetch(`${apiUrl}/api/stockout/warehouse/${selectedWarehouse}`),
            fetch(`${apiUrl}/api/storein/warehouse/${selectedWarehouse}`),
          ]);

          if (!stockOutResponse.ok && !stockInResponse.ok) {
            throw new Error('Stock data not found for the selected warehouse');
          }

          const stockOutData = stockOutResponse.ok ? await stockOutResponse.json() : [];
          const stockInData = stockInResponse.ok ? await stockInResponse.json() : [];

          console.log('Stock Out Data:', stockOutData);
          console.log('Stock In Data:', stockInData);

          const mergedDataMap = new Map();
          const currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

          // Process Stock In Data
          if (Array.isArray(stockInData)) {
            stockInData.forEach((item, index) => {
              const materialKey = `${item.materialCode}-${item.description}-${item.scheme || 'N/A'}-${item.date || currentDate}`; // Include scheme and date in the key
              const formattedDate = item.date
                ? new Date(item.date).toISOString().split('T')[0]
                : currentDate;

              mergedDataMap.set(materialKey, {
                id: `stockin-${index}-${Date.now()}`,
                schemeName: item.scheme || 'N/A',
                materialCode: item.materialCode,
                description: item.description || 'N/A',
                'Stock In': item.materialQty || 0,
                'Stock Out': 0,
                'Remaining Stock': item.materialQty || 0,
                date: formattedDate,
              });
            });
          }

          // Process Stock Out Data
          if (Array.isArray(stockOutData)) {
            stockOutData.forEach((item, index) => {
              const materialKey = `${item.materialCode}-${item.description}-${item.scheme || 'N/A'}-${item.date || currentDate}`; // Include scheme and date in the key
              const formattedDate = item.date
                ? new Date(item.date).toISOString().split('T')[0]
                : currentDate;

              if (mergedDataMap.has(materialKey)) {
                const existingData = mergedDataMap.get(materialKey);
                existingData['Stock Out'] = item.materialQty || 0;
                existingData['Remaining Stock'] =
                  (existingData['Stock In'] || 0) - (item.materialQty || 0);
                existingData.date = existingData.date || formattedDate;
                mergedDataMap.set(materialKey, existingData);
              } else {
                mergedDataMap.set(materialKey, {
                  id: `stockout-${index}-${Date.now()}`,
                  schemeName: item.scheme || 'N/A',
                  materialCode: item.materialCode,
                  description: item.description || 'N/A',
                  'Stock In': 0,
                  'Stock Out': item.materialQty || 0,
                  'Remaining Stock': -(item.materialQty || 0),
                  date: formattedDate,
                });
              }
            });
          }

          const mergedData = Array.from(mergedDataMap.values());
          console.log('Merged Data:', mergedData);

          setRows(mergedData);
        } catch (error) {
          console.error('Error fetching stock data:', error);
          setRows([]);
          showSnackbar('Error fetching stock data. Please try again.', 'error');
        }
      } else {
        // If no warehouse is selected, clear the rows
        setRows([]);
      }
      return;
    }

    // Fetch scheme data if a scheme is selected
    const apiUrl = import.meta.env.VITE_APP_URL;
    try {
      const [stockOutResponse, stockInResponse] = await Promise.all([
        fetch(`${apiUrl}/api/stockout/checkscheme/${encodeURIComponent(newSelectedSchemeName)}`),
        fetch(`${apiUrl}/api/checkscheme/${encodeURIComponent(newSelectedSchemeName)}`),
      ]);

      if (!stockOutResponse.ok && !stockInResponse.ok) {
        throw new Error('Scheme data not found in either API');
      }

      const stockOutData = stockOutResponse.ok ? await stockOutResponse.json() : [];
      const stockInData = stockInResponse.ok ? await stockInResponse.json() : [];

      console.log('Stock Out Data:', stockOutData);
      console.log('Stock In Data:', stockInData);

      const mergedDataMap = new Map();
      const currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

      if (Array.isArray(stockInData)) {
        stockInData.forEach((item, index) => {
          const materialKey = `${item.materialCode}-${item.description}-${item.scheme || 'N/A'}-${item.date || currentDate}`; // Include scheme and date in the key
          const formattedDate = item.date
            ? new Date(item.date).toISOString().split('T')[0]
            : currentDate;

          mergedDataMap.set(materialKey, {
            id: `stockin-${index}-${Date.now()}`,
            schemeName: newSelectedSchemeName,
            materialCode: item.materialCode,
            materialName: item.name || 'N/A',
            description: item.description,
            'Stock In': item.materialQty || 0,
            'Stock Out': 0,
            'Remaining Stock': item.materialQty || 0,
            date: formattedDate,
          });
        });
      }

      if (Array.isArray(stockOutData)) {
        stockOutData.forEach((item, index) => {
          const materialKey = `${item.materialCode}-${item.description}-${item.scheme || 'N/A'}-${item.date || currentDate}`; // Include scheme and date in the key
          const formattedDate = item.date
            ? new Date(item.date).toISOString().split('T')[0]
            : currentDate;

          if (mergedDataMap.has(materialKey)) {
            const existingData = mergedDataMap.get(materialKey);
            existingData['Stock Out'] = item.materialQty || 0;
            existingData['Remaining Stock'] =
              (existingData['Stock In'] || 0) - (item.materialQty || 0);
            existingData.date = existingData.date || formattedDate;
            mergedDataMap.set(materialKey, existingData);
          } else {
            mergedDataMap.set(materialKey, {
              id: `stockout-${index}-${Date.now()}`,
              schemeName: newSelectedSchemeName,
              materialCode: item.materialCode,
              materialName: item.name || 'N/A',
              description: item.description,
              'Stock In': 0,
              'Stock Out': item.materialQty || 0,
              'Remaining Stock': -(item.materialQty || 0),
              date: formattedDate,
            });
          }
        });
      }

      const mergedData = Array.from(mergedDataMap.values());
      console.log('Merged Data:', mergedData);

      setRows(mergedData);
    } catch (error) {
      console.error('Error fetching scheme data:', error);
      setRows([]);
      showSnackbar('Error fetching scheme data. Please try again.', 'error');
    }
  };

  const handleWarehouseChange = useCallback(
    async (event) => {
      const selectedWarehouseId = event.target.value;
      setSelectedWarehouse(selectedWarehouseId);
      setSelectedScheme(null);
      setSelectedMaterials([]);

      // Filter schemes and materials based on the selected warehouse
      const filteredSchemes = allSchemes.filter(
        (scheme) => String(scheme.warehouseId?._id) === selectedWarehouseId
      );
      setSchemes(filteredSchemes);

      const filteredMaterials = allMaterials.filter(
        (material) => String(material.warehouseId?._id) === selectedWarehouseId
      );
      setMaterials(filteredMaterials);

      if (!selectedWarehouseId) {
        setRows([]);
        return;
      }

      const apiUrl = import.meta.env.VITE_APP_URL;
      try {
        const [stockOutResponse, stockInResponse] = await Promise.all([
          fetch(`${apiUrl}/api/stockout/warehouse/${selectedWarehouseId}`),
          fetch(`${apiUrl}/api/storein/warehouse/${selectedWarehouseId}`),
        ]);

        if (!stockOutResponse.ok && !stockInResponse.ok) {
          throw new Error('Stock data not found for the selected warehouse');
        }

        const stockOutData = stockOutResponse.ok ? await stockOutResponse.json() : [];
        const stockInData = stockInResponse.ok ? await stockInResponse.json() : [];

        console.log('Stock Out Data:', stockOutData);
        console.log('Stock In Data:', stockInData);

        const mergedDataMap = new Map();
        const currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

        // Process Stock In Data
        if (Array.isArray(stockInData)) {
          stockInData.forEach((item, index) => {
            const materialKey = `${item.materialCode}-${item.description}-${item.scheme || 'N/A'}-${item.date || currentDate}`; // Include scheme and date in the key
            const formattedDate = item.date
              ? new Date(item.date).toISOString().split('T')[0]
              : currentDate;

            mergedDataMap.set(materialKey, {
              id: `stockin-${index}-${Date.now()}`,
              schemeName: item.scheme || 'N/A',
              materialCode: item.materialCode,
              description: item.description || 'N/A',
              'Stock In': item.materialQty || 0,
              'Stock Out': 0,
              'Remaining Stock': item.materialQty || 0,
              date: formattedDate,
            });
          });
        }

        // Process Stock Out Data
        if (Array.isArray(stockOutData)) {
          stockOutData.forEach((item, index) => {
            const materialKey = `${item.materialCode}-${item.description}-${item.scheme || 'N/A'}-${item.date || currentDate}`; // Include scheme and date in the key
            const formattedDate = item.date
              ? new Date(item.date).toISOString().split('T')[0]
              : currentDate;

            if (mergedDataMap.has(materialKey)) {
              const existingData = mergedDataMap.get(materialKey);
              existingData['Stock Out'] = item.materialQty || 0;
              existingData['Remaining Stock'] =
                (existingData['Stock In'] || 0) - (item.materialQty || 0);
              existingData.date = existingData.date || formattedDate;
              mergedDataMap.set(materialKey, existingData);
            } else {
              mergedDataMap.set(materialKey, {
                id: `stockout-${index}-${Date.now()}`,
                schemeName: item.scheme || 'N/A',
                materialCode: item.materialCode,
                description: item.description || 'N/A',
                'Stock In': 0,
                'Stock Out': item.materialQty || 0,
                'Remaining Stock': -(item.materialQty || 0),
                date: formattedDate,
              });
            }
          });
        }

        const mergedData = Array.from(mergedDataMap.values());
        console.log('Merged Data:', mergedData);

        setRows(mergedData);
      } catch (error) {
        console.error('Error fetching stock data:', error);
        setRows([]);
        showSnackbar('Error fetching stock data. Please try again.', 'error');
      }
    },
    [allSchemes, allMaterials, setRows]
  );
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const processRowUpdate = (newRow) => {
    const updatedRows = rows.map((row) => {
      if (row.id === newRow.id) {
        const updateCount = (updateCounts[row.id] || 0) + 1;
        setUpdateCounts((prevCounts) => ({
          ...prevCounts,
          [row.id]: updateCount,
        }));
        if (updateCount === 2) {
          const updatedBy = sessionStorage.getItem('role');
          return { ...newRow, updatedBy };
        }
        return newRow;
      }
      return row;
    });
    setRows(updatedRows);
    return newRow;
  };

  return (
    <Box sx={{ maxWidth: '100%', paddingX: 2 }}>
      <Typography variant="h4" mb={4}>
        Stock Report
      </Typography>
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
          <Box sx={{ minWidth: 200 }}>
            <Typography sx={{ mb: 1 }}>Department</Typography>
            <Select
              fullWidth
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              displayEmpty
              disabled={userRole === 'WAREHOUSE_USER' || userRole === 'MANAGER'}
            >
              <MenuItem value="">Select Department</MenuItem>
              {departments.map((dep) => (
                <MenuItem key={dep._id} value={dep._id}>
                  {dep.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ minWidth: 200 }}>
            <Typography sx={{ mb: 1 }}>Warehouse</Typography>
            <Select
              fullWidth
              value={selectedWarehouse}
              onChange={handleWarehouseChange}
              disabled={!selectedDepartment || userRole === 'WAREHOUSE_USER'}
              displayEmpty
            >
              <MenuItem value="">Select Warehouse</MenuItem>
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse._id} value={warehouse._id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ minWidth: 200 }}>
            <Typography sx={{ mb: 1 }}>{isPONumber ? 'PO' : 'Scheme'}</Typography>
            <Select
              fullWidth
              value={selectedScheme ? selectedScheme.code : ''}
              onChange={handleSchemeChange}
              displayEmpty
              disabled={!selectedWarehouse}
            >
              <MenuItem value="">Select {isPONumber ? 'PO' : 'Scheme'}</MenuItem>
              {schemes.map((scheme) => (
                <MenuItem key={scheme.id} value={scheme.code}>
                  {scheme.code}
                </MenuItem>
              ))}
            </Select>
          </Box>
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
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
          <Typography color="primary">
            <b>
              {selectedDepartment
                ? departments.find((dep) => dep._id === selectedDepartment)?.name ||
                  'No department selected'
                : 'No department selected'}
            </b>
          </Typography>
          <Typography color="primary">
            <b>
              {selectedWarehouse
                ? warehouses.find((warehouse) => warehouse._id === selectedWarehouse)?.name ||
                  'No warehouse selected'
                : 'No warehouse selected'}
            </b>
          </Typography>
          <Typography color="primary">
            <b>{selectedScheme?.code || (isPONumber ? 'No PO Selected' : 'No Scheme Selected')}</b>
          </Typography>
        </Box>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) => console.error(error)}
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
      </Paper>
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
    </Box>
  );
}
