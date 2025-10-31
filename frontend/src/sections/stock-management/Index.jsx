import React, { useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  Box,
  Chip,
  Grid,
  Paper,
  Alert,
  Select,
  Button,
  Dialog,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
} from '@mui/material';

import StockInModal from './StockInModel';
import StockOutModal from './StockOutModel';
import RemainingStockReport from './RemainingStockModel';

export default function MaterialManagement() {
  const [modalMaterialData, setModalMaterialData] = useState({});
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
  const [availableMaterials, setAvailableMaterials] = useState([]); // Materials not in rows
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
  // new field added
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editMaterialQty, setEditMaterialQty] = useState(0);
  const [editUnit, setEditUnit] = useState('');
  const [editType, setEditType] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Get the selected department name from the dropdown
  const selectedDepartmentName =
    departments.find((dep) => dep._id === selectedDepartment)?.name || '';
  const isElectrical = selectedDepartmentName === 'Electrical'; // Check if selected department is Electrical
  const isTelecom = selectedDepartmentName === 'Telecom'; // Check if selected department is Telecom

  const handleOpenEditModal = (row) => {
    setEditingRow(row);
    setEditMaterialQty(row.materialQty || 0);
    setEditUnit(row.unit || '');
    setEditType(row.type || '');
    setEditNotes(row.notes || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRow(null);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;

    try {
      const apiUrl = import.meta.env.VITE_APP_URL;

      // Prepare the update data
      const updateData = {
        materialQty: editMaterialQty,
        unit: editUnit,
        type: editType,
        notes: editNotes,
      };

      // For Electrical department, use static values for type and notes
      if (isElectrical) {
        updateData.type = 'Electrical Type'; // Static value for Electrical department
        updateData.notes = 'Electrical Notes'; // Static value for Electrical department
      }

      // If the row exists in the database (has _id), update it via API
      if (editingRow._id) {
        const response = await fetch(`${apiUrl}/api/schemeMaterialMapping/${editingRow._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update the row in the database');
        }

        // Update local state with the response data
        const updatedRow = await response.json();

        const updatedRows = rows.map((row) => {
          if (row.id === editingRow.id) {
            return {
              ...row,
              materialQty: updatedRow.materialQty,
              unit: updatedRow.unit,
              type: updatedRow.type,
              notes: updatedRow.notes,
            };
          }
          return row;
        });

        setRows(updatedRows);
        showSnackbar('Row updated successfully!', 'success');
      } else {
        // If it's a local row (no _id), just update the local state
        const updatedRows = rows.map((row) => {
          if (row.id === editingRow.id) {
            return {
              ...row,
              materialQty: editMaterialQty,
              unit: editUnit,
              type: isElectrical ? 'Electrical Type' : editType, // Use static value for Electrical
              notes: isElectrical ? 'Electrical Notes' : editNotes, // Use static value for Electrical
            };
          }
          return row;
        });

        setRows(updatedRows);
        showSnackbar('Row updated successfully!', 'success');
      }

      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating row:', error);
      showSnackbar(error.message || 'Error updating row. Please try again.', 'error');
    }
  };

  const updateMaterialData = (materialId, field, value) => {
    setModalMaterialData((prev) => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [field]: value,
      },
    }));
  };

  const handleOpenAddModal = () => {
    if (!selectedScheme) {
      alert('Please select a scheme first.');
      return;
    }

    if (selectedMaterials.length === 0) {
      alert('Please select at least one material.');
      return;
    }

    // Initialize data for each selected material
    const initialData = {};
    selectedMaterials.forEach((material) => {
      initialData[material._id] = {
        materialQty: 0,
        unit: isTelecom ? 'Piece' : '', // Default value for Telecom
        type: isElectrical ? 'Electrical Type' : '', // Static value for Electrical
        notes: isElectrical ? 'Electrical Notes' : '', // Static value for Electrical
      };
    });

    setModalMaterialData(initialData);
    setIsAddModalOpen(true);
  };

  // Function to handle closing the add modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Function to handle adding items from the modal
  const handleAddFromModal = () => {
    // Validate that all required fields are filled
    const isValid = selectedMaterials.every((material) => {
      const data = modalMaterialData[material._id];
      return data && data.materialQty > 0 && data.unit && (isElectrical ? true : data.type);
    });

    if (!isValid) {
      alert('Please fill all required fields for all materials.');
      return;
    }

    const newRows = selectedMaterials.map((material) => ({
      id: material._id || material.id,
      schemeName: selectedScheme.code,
      materialCode: material.code,
      materialName: material.name || 'N/A',
      description: material.description,
      materialQty: modalMaterialData[material._id].materialQty,
      unit: modalMaterialData[material._id].unit,
      type: modalMaterialData[material._id].type,
      notes: modalMaterialData[material._id].notes,
    }));

    setRows([...rows, ...newRows]);
    setSelectedMaterials([]);
    setModalMaterialData({});
    setIsAddModalOpen(false);
  };

  // Function to filter available materials (not in rows)
  const updateAvailableMaterials = useCallback(() => {
    const usedMaterialIds = rows.map((row) => row.materialCode); // Get material codes from rows
    const filteredMaterials = materials.filter(
      (material) => !usedMaterialIds.includes(material.code)
    );
    setAvailableMaterials(filteredMaterials);
  }, [rows, materials]);

  // Update available materials whenever rows or materials change
  useEffect(() => {
    updateAvailableMaterials();
  }, [updateAvailableMaterials]);

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
    setSelectedScheme(null); // Reset selected scheme
    setSelectedMaterials([]); // Reset selected materials
    setRows([]); // Reset rows
  };

  useEffect(() => {
    const policies = JSON.parse(sessionStorage.getItem('userPolicies')) || [];
    const readOnlyPolicy = policies.find((policy) => policy.mode === 'READ_ONLY');
    setIsReadOnly(!!readOnlyPolicy);
  }, []);

  const selDepartment = departments.find((dep) => dep._id === selectedDepartment)?.name || '';
  const isPONumber =
    ((userRole === 'WAREHOUSE_USER' || userRole === 'MANAGER') &&
      selectedDepartmentName === 'Telecom') ||
    (userRole === 'SUPER_ADMIN' && selDepartment === 'Telecom');

  // Update columns to remove editable properties and add edit icon
  const columns = [
    {
      field: 'schemeName',
      headerName: isPONumber ? 'PO' : 'Scheme',
      width: 130,
    },
    { field: 'materialCode', headerName: 'Material Code', width: 130 },
    { field: 'description', headerName: 'Description', width: 200 },
    // Conditionally show Material Name column only if not Electrical department
    ...(isElectrical ? [] : [{ field: 'materialName', headerName: 'Material Name', width: 130 }]),
    {
      field: 'unit',
      headerName: isElectrical ? 'UOM' : 'Unit', // UOM for Electrical, Unit for others
      width: 130,
    },
    {
      field: 'materialQty',
      headerName: 'P.Material Qty',
      width: 130,
    },
    // Conditionally show Type column only if not Electrical department
    ...(isElectrical ? [] : [{ field: 'type', headerName: 'Type', width: 130 }]),
    // Conditionally show Notes column only if not Electrical department
    ...(isElectrical ? [] : [{ field: 'notes', headerName: 'Notes', width: 130 }]),
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          {!isReadOnly && (
            <>
              <IconButton
                onClick={() => handleOpenEditModal(params.row)}
                sx={{ color: 'rgb(74,115,15,0.9)' }}
              >
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleDeleteRow(params.row.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
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
    setRows([]);

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

  // Handle scheme selection - Updated for Autocomplete
  const handleSchemeChange = async (event, newValue) => {
    const selectedSchemeData = newValue; // newValue is the complete scheme object
    setSelectedScheme(selectedSchemeData);

    if (!selectedSchemeData) {
      setRows([]);
      return;
    }

    const newSelectedSchemeName = selectedSchemeData.code;
    console.log('Selected Scheme in Parent:', newSelectedSchemeName); // Debugging log

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
      unit: isTelecom ? 'Piece' : '', // Default for Telecom
      type: isElectrical ? 'Electrical Type' : '', // Static value for Electrical
      notes: isElectrical ? 'Electrical Notes' : '', // Static value for Electrical
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

  // Function to render unit/UOM dropdown based on department
  const renderUnitDropdown = (value, onChange, required = true) => {
    if (isTelecom) {
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

    if (isElectrical) {
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
            <Autocomplete
              fullWidth
              options={schemes}
              getOptionLabel={(option) => option.code}
              value={selectedScheme}
              onChange={handleSchemeChange}
              disabled={!selectedWarehouse} // Disable if no warehouse is selected
              renderInput={(params) => (
                <TextField {...params} placeholder={`Select ${isPONumber ? 'PO' : 'Scheme'}`} />
              )}
              filterOptions={(options, { inputValue }) =>
                options.filter((option) =>
                  option.code.toLowerCase().includes(inputValue.toLowerCase())
                )
              }
              isOptionEqualToValue={(option, value) => option._id === value?._id}
            />
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
              options={availableMaterials} // Use filtered available materials
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
                options.filter(
                  (option) =>
                    (option.code && option.code.toLowerCase().includes(inputValue.toLowerCase())) ||
                    (option.description &&
                      option.description.toLowerCase().includes(inputValue.toLowerCase()))
                )
              }
              renderInput={(params) => <TextField {...params} label="Select Materials" fullWidth />}
              ListboxProps={{ sx: { maxWidth: '100%' } }}
              disabled={!selectedWarehouse}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              getOptionDisabled={(option) => {
                // Disable materials that are already in rows
                const usedMaterialIds = rows.map((row) => row.materialCode);
                return usedMaterialIds.includes(option.code);
              }}
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
          disableRowSelectionOnClick
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

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
            onClick={handleSchemeMapping}
            disabled={isReadOnly || !selectedWarehouse} // Disable if no warehouse is selected
          >
            Save Scheme Mapping
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
            onClick={handleOpenStockInModal}
            disabled={!selectedScheme || rows.length === 0}
          >
            Open Stock In
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
            onClick={handleOpenStockOutModal}
            disabled={!selectedScheme || rows.length === 0}
          >
            Open Stock Out
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
            onClick={handleOpenStockReportModal}
            disabled={!selectedScheme || rows.length === 0}
          >
            Remaining Stock
          </Button>
          {!isReadOnly && (
            <>
              <Button
                variant="contained"
                sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
                onClick={handleOpenAddModal}
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} maxWidth="md" fullWidth>
        <DialogTitle bgcolor="black" color="white">
          Edit Material for {editingRow?.schemeName || (isPONumber ? 'PO' : 'Scheme')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Non-editable fields */}
            <Box
              sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#f9f9f9' }}
            >
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Material Details (Read-only)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Code:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ p: 1, bgcolor: 'white', borderRadius: 1 }}>
                    {editingRow?.materialCode || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Name:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ p: 1, bgcolor: 'white', borderRadius: 1 }}>
                    {editingRow?.materialName || 'N/A'}
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
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Material Quantity"
                  type="number"
                  value={editMaterialQty}
                  onChange={(e) => setEditMaterialQty(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                {renderUnitDropdown(editUnit, (e) => setEditUnit(e.target.value), true)}
              </Grid>
              {/* Conditionally show Type field only if not Electrical department */}
              {!isElectrical && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Type"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    required
                  />
                </Grid>
              )}
              {/* Conditionally show Notes field only if not Electrical department */}
              {!isElectrical && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Optional notes..."
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button sx={{ background: 'grey' }} variant="contained" onClick={handleCloseEditModal}>
            Cancel
          </Button>
          <Button
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
            variant="contained"
            onClick={handleSaveEdit}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} maxWidth="md" fullWidth>
        <DialogTitle bgcolor="black" color="white">
          Add Materials to {selectedScheme?.code || (isPONumber ? 'PO' : 'Scheme')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Selected Materials ({selectedMaterials.length})
            </Typography>

            {selectedMaterials.map((material, index) => (
              <Box
                key={material._id}
                sx={{
                  mb: 3,
                  p: 2,
                  border: '2px solid #e0e0e0',
                  borderRadius: 2,
                  bgcolor: index % 2 === 0 ? '#f9f9f9' : '#f5f5f5',
                }}
              >
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Material {index + 1} - Details (Read-only)
                </Typography>

                {/* Read-only material details */}
                <Box
                  sx={{
                    mb: 2,
                    p: 1.5,
                    border: '1px solid #d0d0d0',
                    borderRadius: 1,
                    bgcolor: 'white',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Code:</strong>
                      </Typography>
                      <Typography variant="body1">{material.code}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Name:</strong>
                      </Typography>
                      <Typography variant="body1">{material.name || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        <strong>Description:</strong>
                      </Typography>
                      <Typography variant="body1">
                        {material.description || 'No description'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Editable fields for this specific material */}
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Material {index + 1} - Configuration (Required)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Material Quantity"
                      type="number"
                      value={modalMaterialData[material._id]?.materialQty || 0}
                      onChange={(e) =>
                        updateMaterialData(material._id, 'materialQty', Number(e.target.value))
                      }
                      inputProps={{ min: 1 }}
                      required
                      helperText={
                        !modalMaterialData[material._id]?.materialQty ||
                        modalMaterialData[material._id]?.materialQty <= 0
                          ? 'Quantity is required and must be greater than 0'
                          : ''
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    {renderUnitDropdown(
                      modalMaterialData[material._id]?.unit || '',
                      (e) => updateMaterialData(material._id, 'unit', e.target.value),
                      true
                    )}
                  </Grid>
                  {/* Conditionally show Type field only if not Electrical department */}
                  {!isElectrical && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Type"
                        value={modalMaterialData[material._id]?.type || ''}
                        onChange={(e) => updateMaterialData(material._id, 'type', e.target.value)}
                        required
                        helperText={
                          !modalMaterialData[material._id]?.type ? 'Type is required' : ''
                        }
                      />
                    </Grid>
                  )}
                  {/* Conditionally show Notes field only if not Electrical department */}
                  {!isElectrical && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        value={modalMaterialData[material._id]?.notes || ''}
                        onChange={(e) => updateMaterialData(material._id, 'notes', e.target.value)}
                        multiline
                        rows={2}
                        placeholder="Optional notes for this material..."
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button sx={{ background: 'grey' }} variant="contained" onClick={handleCloseAddModal}>
            Cancel
          </Button>
          <Button
            onClick={handleAddFromModal}
            variant="contained"
            sx={{ backgroundColor: 'rgb(7, 85, 162,1)' }}
            disabled={selectedMaterials.some((material) => {
              const data = modalMaterialData[material._id];
              return (
                !data ||
                !data.materialQty ||
                data.materialQty <= 0 ||
                !data.unit ||
                (isElectrical ? false : !data.type) // Type is only required for non-Electrical
              );
            })}
          >
            Add All Materials to Grid
          </Button>
        </DialogActions>
      </Dialog>

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
