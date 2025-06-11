import React, { useState, useEffect } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import { Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  Chip,
  Paper,
  Alert,
  Select,
  Button,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  IconButton,
  Autocomplete,
} from '@mui/material';

import StockInModal from './StockInModel';
import StockOutModal from './StockOutModel';
import RemainingStockReport from './RemainingStockModel';

export default function MaterialManagement() {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [warehouseAutoSet, setWarehouseAutoSet] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isStockReportModalOpen, setIsStockReportModalOpen] = useState(false);
  const [allSchemes, setAllSchemes] = useState([]); // Store all schemes
  const [schemes, setSchemes] = useState([]); // Filtered schemes
  const [allMaterials, setAllMaterials] = useState([]); // Store all materials
  const [materials, setMaterials] = useState([]); // Filtered materials
  const [rows, setRows] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [updateCounts, setUpdateCounts] = useState({});
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedWarehouseDepartment, setSelectedWarehouseDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  // Get the warehouse ID from session storage
  const warehouseId = sessionStorage.getItem('warehouseId');
  const userRole = sessionStorage.getItem('role');
  const departmentId = sessionStorage.getItem('departmentId');

  useEffect(() => {
    const fetchDepartments = async () => {
      const apiUrl = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${apiUrl}/api/departments`);
        if (!response.ok) throw new Error('Failed to fetch departments');
        const data = await response.json();

        // Store all departments
        setDepartments(data);

        // Retrieve departmentId from sessionStorage
        const sessionDepartmentId = sessionStorage.getItem('departmentId');

        // Automatically set the selected department for WAREHOUSE_USER and MANAGER
        if (userRole === 'WAREHOUSE_USER' || userRole === 'MANAGER') {
          const userDepartment = data.find((dep) => dep._id === sessionDepartmentId);
          if (userDepartment) {
            setSelectedDepartment(userDepartment._id); // Set the selected department
          }
        }
      } catch (error) {
        console.error('Error fetching Departments:', error);
      }
    };

    fetchDepartments();
  }, [userRole, departmentId]);

  // Fetch warehouses from the API when the component mounts

  useEffect(() => {
    const fetchWarehouses = async () => {
      const apiUrl = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${apiUrl}/api/warehouses`);
        if (!response.ok) throw new Error('Failed to fetch warehouses');
        const data = await response.json();

        // Store all warehouses
        setAllWarehouses(data);

        // Retrieve warehouseId from sessionStorage
        const sessionWarehouseId = sessionStorage.getItem('warehouseId');

        // Filter warehouses based on user role
        let filteredWarehouses = data;
        if (userRole === 'WAREHOUSE_USER') {
          // Ensure the warehouseId matches the one in sessionStorage
          filteredWarehouses = data.filter((warehouse) => warehouse._id === sessionWarehouseId);

          // Automatically set the selected warehouse for WAREHOUSE_USER
          if (sessionWarehouseId && filteredWarehouses.length > 0) {
            setSelectedWarehouse(sessionWarehouseId);
            setWarehouseAutoSet(true);

            // Find the selected warehouse and set its department
            const selectedWarehouseData = filteredWarehouses[0];
            setSelectedWarehouseDepartment(selectedWarehouseData?.departmentId?.name || '');

            // Filter schemes based on the selected warehouse
            const filteredSchemes = allSchemes.filter(
              (scheme) => String(scheme.warehouseId?._id) === sessionWarehouseId
            );
            setSchemes(filteredSchemes);

            // Filter materials based on the selected warehouse
            const filteredMaterials = allMaterials.filter(
              (material) => String(material.warehouseId?._id) === sessionWarehouseId
            );
            setMaterials(filteredMaterials);
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

    fetchWarehouses();
  }, [warehouseId, userRole, departmentId, allSchemes, allMaterials]);

  // Then update the handleDepartmentChange function:
  const handleDepartmentChange = (event) => {
    const selectedDepartmentId = event.target.value;
    setSelectedDepartment(selectedDepartmentId);

    // Filter warehouses based on the selected department ID from allWarehouses
    const filteredWarehouses = allWarehouses.filter(
      (warehouse) =>
        String(warehouse.departmentId?._id || warehouse.departmentId) === selectedDepartmentId
    );
    setWarehouses(filteredWarehouses);
    setSelectedWarehouse(''); // Reset selected warehouse when department changes
  };

  useEffect(() => {
    const policies = JSON.parse(sessionStorage.getItem('userPolicies')) || [];
    const readOnlyPolicy = policies.find((policy) => policy.mode === 'READ_ONLY');
    setIsReadOnly(!!readOnlyPolicy);
  }, []);

  const department = sessionStorage.getItem('department');
  const selDepartment = departments.find((dep) => dep._id === selectedDepartment)?.name || '';
  const isPONumber =
    ((userRole === 'WAREHOUSE_USER' || userRole === 'MANAGER') && department === 'Telecom') ||
    (userRole === 'SUPER_ADMIN' && selDepartment === 'Telecom');
  const columns = [
    {
      field: 'schemeName',
      headerName: isPONumber ? 'PO' : 'Scheme',
      width: 130,
    },
    { field: 'materialCode', headerName: 'Material Code', width: 130 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'materialName', headerName: 'Material Name', width: 130 },
    {
      field: 'materialQty',
      headerName: 'P.Material Qty',
      width: 130,
      editable: true,
      editMode: 'cell',
    },
    {
      field: 'unit',
      headerName: 'Unit',
      width: 130,
      editable: true,
      type: isPONumber ? 'singleSelect' : 'string', // Use dropdown for SUPER_ADMIN with Telecom warehouse or Telecom users
      valueOptions:
        (userRole === 'SUPER_ADMIN' && selectedWarehouseDepartment === 'Telecom') || isPONumber
          ? ['Piece', 'Pair']
          : [], // Options for SUPER_ADMIN with Telecom warehouse or Telecom users
      renderEditCell: (params) => {
        if (
          (userRole === 'SUPER_ADMIN' && selectedWarehouseDepartment === 'Telecom') ||
          isPONumber
        ) {
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
    { field: 'type', headerName: 'Type', width: 130, editable: true },
    { field: 'notes', headerName: 'Notes', width: 130, editable: true },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) =>
        !isReadOnly && (
          <IconButton onClick={() => handleDeleteRow(params.row.id)} color="error">
            <DeleteIcon />
          </IconButton>
        ),
    },
  ];

  // Fetch materials from the API when the component mounts
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_APP_URL;
    const fetchMaterials = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/materials`);
        if (!response.ok) throw new Error('Failed to fetch materials');
        const data = await response.json();

        // Store all materials
        setAllMaterials(data);

        // Filter materials based on warehouse ID and active status
        const filteredMaterials = data.filter((material) => {
          const { isActive } = material;
          const matchesWarehouse =
            userRole === 'WAREHOUSE_USER'
              ? String(material.warehouseId?._id) === warehouseId
              : true;
          return isActive && matchesWarehouse;
        });

        setMaterials(filteredMaterials); // Store filtered materials in state
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    fetchMaterials();
  }, [warehouseId, userRole]);

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

        // Filter schemes based on warehouse ID and active status
        const filteredSchemes = data.filter((scheme) => {
          const { isActive } = scheme;
          const matchesWarehouse =
            userRole === 'WAREHOUSE_USER' ? String(scheme.warehouseId?._id) === warehouseId : true;
          return isActive && matchesWarehouse;
        });

        setSchemes(filteredSchemes); // Store filtered schemes in state
      } catch (error) {
        console.error('Error fetching schemes:', error);
      }
    };

    fetchSchemes();
  }, [warehouseId, userRole]);

  // Handle warehouse selection
  const handleWarehouseChange = (event) => {
    const selectedWarehouseId = event.target.value;
    setSelectedWarehouse(selectedWarehouseId);

    // Find the selected warehouse and set its department
    const selectedWarehouseData = warehouses.find(
      (warehouse) => warehouse._id === selectedWarehouseId
    );
    setSelectedWarehouseDepartment(selectedWarehouseData?.departmentId?.name || '');

    // Clear selected scheme and materials when warehouse changes
    setSelectedScheme(null);
    setSelectedMaterials([]);

    // Filter schemes based on the selected warehouse
    const filteredSchemes = allSchemes.filter(
      (scheme) => String(scheme.warehouseId?._id) === selectedWarehouseId
    );
    setSchemes(filteredSchemes);

    // Filter materials based on the selected warehouse
    const filteredMaterials = allMaterials.filter(
      (material) => String(material.warehouseId?._id) === selectedWarehouseId
    );
    setMaterials(filteredMaterials);
  };

  // Handle scheme selection
  const handleSchemeChange = async (event) => {
    const newSelectedSchemeName = event.target.value.trim(); // Get the scheme name
    console.log('Selected Scheme in Parent:', newSelectedSchemeName); // Debugging log

    const selectedSchemeData = schemes.find((scheme) => scheme.code === newSelectedSchemeName);
    setSelectedScheme(selectedSchemeData); // Store the entire scheme object if needed elsewhere

    if (!newSelectedSchemeName) {
      setRows([]);
      return;
    }
    const apiUrl = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(
        `${apiUrl}/api/checkSchemeMaterialMapping/${encodeURIComponent(newSelectedSchemeName)}`
      );

      if (!response.ok) throw new Error('Scheme data not found');

      let data = await response.json();

      if (!Array.isArray(data)) {
        console.error('Invalid data received:', data);
        setRows([]);
        return;
      }

      data = data.map((row, index) => ({
        ...row,
        id: row.id || row._id,
        schemeName: newSelectedSchemeName, // Add scheme name to the row
      }));

      console.log('Fetched Scheme Data in Parent:', data); // Debugging log
      setRows(data);
    } catch (error) {
      console.error('Error fetching scheme data:', error);
      setRows([]);
    }
  };

  // // Handle material selection
  // const handleMaterialChange = (_, newValue) => {
  //   setSelectedMaterials(newValue);
  // };

  const handleOpenStockInModal = () => {
    setIsStockInModalOpen(true);
  };

  const handleCloseStockInModal = () => {
    setIsStockInModalOpen(false);
  };

  const handleSaveStockIn = (updatedRows) => {
    console.log('Updated Rows:', updatedRows);
  };

  const handleOpenStockReportModal = () => {
    setIsStockReportModalOpen(true);
  };
  const handleCloseStockReportModal = () => {
    setIsStockReportModalOpen(false);
  };
  const handleOpenStockOutModal = () => {
    setIsStockOutModalOpen(true);
  };

  const handleCloseStockOutModal = () => {
    setIsStockOutModalOpen(false);
  };

  const handleSaveStockOut = (updatedRows) => {
    console.log('Updated Rows:', updatedRows);
  };
  const handleSaveStockReport = (updatedRows) => {
    console.log('Updated Rows:', updatedRows);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddItems = () => {
    if (!selectedScheme) {
      alert('Please select a scheme first.');
      return;
    }

    const newRows = selectedMaterials.map((material) => ({
      id: material._id || material.id, // Unique ID
      schemeName: selectedScheme.code,
      materialCode: material.code,
      materialName: material.name || 'N/A',
      description: material.description,
      materialQty: 0,
      unit: isPONumber ? 'Piece' : '',
      type: '',
      notes: '',
    }));

    setRows([...rows, ...newRows]);
    setSelectedMaterials([]);
  };

  const handleDeleteRow = async (id) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

    // Check if the row exists in the database (has a valid ID)
    const rowToDelete = rows.find((row) => row.id === id);

    if (rowToDelete && rowToDelete._id) {
      // If the row has a valid `_id`, it exists in the database
      try {
        const response = await fetch(`${apiUrl}/api/schemeMaterialMapping/${rowToDelete._id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete the row from the database');
        }

        // Remove the deleted row from the state
        setRows(rows.filter((row) => row.id !== id));
        showSnackbar('Row deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting row:', error);
        showSnackbar('Error deleting row. Please try again.', 'error');
      }
    } else {
      // If the row doesn't have a valid `_id`, it's only in the local state
      setRows(rows.filter((row) => row.id !== id));
      showSnackbar('Row removed successfully!', 'success');
    }
  };

  const handleDeleteAll = () => {
    setRows([]);
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

  const handleSchemeMapping = async () => {
    if (rows.length === 0) {
      showSnackbar('No materials selected. Please add materials to save the mapping.', 'error');
      return;
    }

    const createdBy = sessionStorage.getItem('role');

    // Find the selected warehouse name
    const selectedWarehouseData = warehouses.find(
      (warehouse) => warehouse._id === selectedWarehouse
    );
    const warehouseName = selectedWarehouseData ? selectedWarehouseData.name : '';

    if (!warehouseName) {
      console.error('Warehouse name not found:', selectedWarehouse);
      showSnackbar('Warehouse not found.', 'error');
      return;
    }

    // Map rows to match the schema
    const updatedRows = rows.map((row) => ({
      scheme: row.schemeName,
      materialName: row.materialName,
      materialCode: row.materialCode,
      description: row.description,
      materialQty: row.materialQty,
      unit: row.unit,
      type: row.type,
      notes: row.notes,
      departmentId: selectedDepartment,
      warehouseId: selectedWarehouse,
      warehouseIdScheme: selectedWarehouse,
      warehouseName,
      createdBy,
      updatedBy: row.updatedBy || createdBy,
    }));

    console.log('Data being sent (scheme mapping):', updatedRows);

    const apiUrl = import.meta.env.VITE_APP_URL;
    try {
      // First try to save - backend will validate
      const response = await fetch(`${apiUrl}/api/schemeMaterialMapping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRows.length === 1 ? updatedRows[0] : updatedRows),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.missingFields) {
          throw new Error(`Missing required fields: ${errorData.missingFields.join(', ')}`);
        }
        throw new Error(errorData.message || 'Failed to save materials.');
      }

      const result = await response.json();
      showSnackbar(result.message || 'Materials stored successfully!', 'success');
    } catch (error) {
      console.error('Error storing materials', error);
      showSnackbar(error.message || 'Failed to save materials.', 'error');
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', paddingX: 2 }}>
      <Typography variant="h4" mb={4}>
        Stock Management
      </Typography>
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ mb: 1 }}>Department</Typography>
            <Select
              fullWidth
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              disabled={userRole === 'WAREHOUSE_USER' || userRole === 'MANAGER'} // Disable for warehouse users and managers
              displayEmpty
            >
              <MenuItem value="">Select Department</MenuItem>
              {departments.map((dep) => (
                <MenuItem key={dep._id} value={dep._id}>
                  {dep.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography sx={{ mb: 1 }}>Warehouse</Typography>
            <Select
              fullWidth
              value={selectedWarehouse}
              onChange={handleWarehouseChange}
              disabled={!selectedDepartment || userRole === 'WAREHOUSE_USER'} // Disable for warehouse users
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
          <Box>
            <Typography sx={{ mb: 1 }}>{isPONumber ? 'PO' : 'Scheme'}</Typography>
            <Select
              fullWidth
              value={selectedScheme ? selectedScheme.code : ''} // Use the scheme name
              onChange={handleSchemeChange}
              displayEmpty
              disabled={!selectedWarehouse} // Disable if no warehouse is selected
            >
              <MenuItem value="">Select {isPONumber ? 'PO' : 'Scheme'}</MenuItem>
              {schemes.map((scheme) => (
                <MenuItem key={scheme.id} value={scheme.code}>
                  {scheme.code}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0, // Prevent growing beyond container
              overflow: 'hidden', // Hide overflow
            }}
          >
            <Typography sx={{ mb: 1 }}>Materials</Typography>
            <Autocomplete
              fullWidth
              limitTags={2}
              multiple
              options={materials}
              getOptionLabel={(option) => `${option.code} - ${option.description}`}
              value={selectedMaterials}
              onChange={(_, newValue) => setSelectedMaterials(newValue)}
              sx={{
                '& .MuiAutocomplete-root': {
                  minHeight: '100%',
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
                    xs: '100%', // Smaller tags on mobile
                    sm: '100%', // Larger tags on desktop
                  },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
              filterOptions={(options, { inputValue }) =>
                options.filter((option) => option?.code || option?.description)
              }
              renderInput={(params) => <TextField {...params} label="Select Materials" fullWidth />}
              ListboxProps={{ sx: { maxWidth: '100%' } }}
              disabled={!selectedWarehouse}
            />
          </Box>
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
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
            onClick={handleSchemeMapping}
            disabled={isReadOnly || !selectedWarehouse} // Disable if no warehouse is selected
          >
            Save Scheme Mapping
          </Button>
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
            onClick={handleOpenStockInModal}
            disabled={!selectedScheme || rows.length === 0}
          >
            Open Stock In
          </Button>
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
            onClick={handleOpenStockOutModal}
            disabled={!selectedScheme || rows.length === 0}
          >
            Open Stock Out
          </Button>
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
            onClick={handleOpenStockReportModal}
            disabled={!selectedScheme || rows.length === 0}
          >
            Remaining Stock
          </Button>
          {!isReadOnly && (
            <>
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
                onClick={handleAddItems}
                disabled={selectedMaterials.length === 0 || !selectedWarehouse} // Disable if no warehouse is selected
              >
                Add
              </Button>
              <Button
                sx={{
                  backgroundColor: 'red',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#C0392B',
                  },
                }}
                color="error"
                onClick={handleDeleteAll}
                disabled={rows.length === 0}
              >
                Delete All
              </Button>
            </>
          )}
        </Box>
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
      <StockInModal
        open={isStockInModalOpen}
        onClose={handleCloseStockInModal}
        onSave={handleSaveStockIn}
        selectedScheme={selectedScheme?.code}
        selectedWarehouseDepartment={selectedWarehouseDepartment}
        selectedWarehouseId={selectedWarehouse}
        selectedDepartmentId={selectedDepartment}
      />
      <StockOutModal
        open={isStockOutModalOpen}
        onClose={handleCloseStockOutModal}
        selectedScheme={selectedScheme?.code}
        onSave={handleSaveStockOut}
        selectedWarehouseDepartment={selectedWarehouseDepartment}
        selectedDepartmentId={selectedDepartment}
        selectedWarehouseId={selectedWarehouse}
      />
      <RemainingStockReport
        open={isStockReportModalOpen}
        onClose={handleCloseStockReportModal}
        selectedScheme={selectedScheme?.code}
        onSave={handleSaveStockReport}
        selectedWarehouseDepartment={selectedWarehouseDepartment}
      />
    </Box>
  );
}
