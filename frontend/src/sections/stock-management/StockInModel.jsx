import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [schemeDownloadAnchorEl, setSchemeDownloadAnchorEl] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [availableMaterials, setAvailableMaterials] = useState([]); // Materials not in rows

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalMaterialQty, setModalMaterialQty] = useState(0);
  const [modalUnit, setModalUnit] = useState('');
  const [modalNotes, setModalNotes] = useState('');

  const role = sessionStorage.getItem('role');
  const warehouseId = sessionStorage.getItem('warehouseId');
  const department = sessionStorage.getItem('department');
  const departmentId = sessionStorage.getItem('departmentId');
  const userId = sessionStorage.getItem('userId');
  const warehouse = sessionStorage.getItem('warehouse');
  const name = sessionStorage.getItem('fullName');
  const isPONumber = (role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom';
  // Add these state variables near the other state declarations
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editMaterialQty, setEditMaterialQty] = useState(0);
  const [editUnit, setEditUnit] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [modalMaterialData, setModalMaterialData] = useState({});
  const isElectricalDepartment = selectedWarehouseDepartment === 'Electrical';

  // Add these functions
  const handleOpenEditModal = (row) => {
    setEditingRow(row);
    setEditMaterialQty(row.materialQty || 0);
    setEditUnit(row.unit || '');
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
        notes: editNotes,
      };

      // If the row exists in the database (has _id), update it via API
      if (editingRow._id) {
        const response = await fetch(`${apiUrl}/api/storein/${editingRow._id}`, {
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

        const updatedRows = tableRows.map((row) => {
          if (row.id === editingRow.id) {
            return {
              ...row,
              materialQty: updatedRow.materialQty,
              unit: updatedRow.unit,
              notes: updatedRow.notes,
              updatedAt: new Date().toISOString(),
            };
          }
          return row;
        });

        setTableRows(updatedRows);
        setSnackbar({
          open: true,
          message: 'Row updated successfully!',
          severity: 'success',
        });
        handleCloseEditModal();
        return;
      }

      // If it's a local row (no _id), just update the local state
      const updatedRows = tableRows.map((row) => {
        if (row.id === editingRow.id) {
          return {
            ...row,
            materialQty: editMaterialQty,
            unit: editUnit,
            notes: editNotes,
            updatedAt: new Date().toISOString(),
          };
        }
        return row;
      });

      setTableRows(updatedRows);
      setSnackbar({
        open: true,
        message: 'Row updated successfully!',
        severity: 'success',
      });
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating row:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error updating row. Please try again.',
        severity: 'error',
      });
    }
  };

  // Function to filter available materials (not in rows)
  const updateAvailableMaterials = useCallback(() => {
    const usedMaterialCodes = tableRows.map((row) => row.materialCode);
    const filteredMaterials = materials.filter(
      (material) => !usedMaterialCodes.includes(material.code)
    );
    setAvailableMaterials(filteredMaterials);
  }, [tableRows, materials]);

  // Update available materials whenever rows or materials change
  useEffect(() => {
    updateAvailableMaterials();
  }, [updateAvailableMaterials]);

  // Function to handle opening the add modal
  const handleOpenAddModal = () => {
    if (selectedMaterials.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one material.',
        severity: 'warning',
      });
      return;
    }

    // Initialize material data for each selected material
    const initialData = {};
    selectedMaterials.forEach((material) => {
      let unit = '';
      if (isElectricalDepartment) {
        unit = 'EA';
      } else if (isPONumber) {
        unit = 'Piece';
      }

      initialData[material._id] = {
        materialQty: 0,
        unit,
        notes: '',
      };
    });
    setModalMaterialData(initialData);
    setIsAddModalOpen(true);
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
  // Function to handle closing the add modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setModalMaterialData({}); // Clear the data when closing
  };

  // Function to handle adding items from the modal
  const handleAddFromModal = () => {
    const currentDate = new Date().toISOString();

    const newRows = selectedMaterials.map((material) => {
      // Get the specific data for this material from modalMaterialData
      const materialData = modalMaterialData[material._id] || {};

      return {
        id: `${material.code}-${Date.now()}-${Math.random()}`, // Added Math.random() to ensure uniqueness
        scheme: selectedScheme,
        materialCode: material.code,
        materialName: material.name || 'N/A',
        description: material.description,
        materialQty: materialData.materialQty || 0, // Use the specific material's quantity
        unit: materialData.unit || '', // Use the specific material's unit
        notes: materialData.notes || 'Notes', // Use the specific material's notes
        departmentId: selectedDepartmentId,
        warehouseId: selectedWarehouseId,
        createdBy: userId,
        createdAt: currentDate,
        updatedAt: currentDate,
      };
    });

    setTableRows([...tableRows, ...newRows]);
    setSelectedMaterials([]);
    setModalMaterialData({}); // Clear the modal data
    setIsAddModalOpen(false);

    setSnackbar({
      open: true,
      message: 'Materials added successfully!',
      severity: 'success',
    });
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
  }, [warehouseId, role]);

  const fetchSchemeData = useCallback(
    async (scheme) => {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_APP_URL;

      const checkSchemeUrl = `${apiUrl}/api/checkscheme/${encodeURIComponent(scheme)}`;

      try {
        const rawResponse = await fetch(checkSchemeUrl);
        const responseText = await rawResponse.text();

        if (
          responseText.toLowerCase().startsWith('<!doctype') ||
          responseText.toLowerCase().startsWith('<html')
        ) {
          console.error('Received HTML instead of JSON');

          const mappingUrl = `${apiUrl}/api/checkSchemeMaterialMapping/${encodeURIComponent(scheme)}`;
          console.log('Trying mapping URL directly:', mappingUrl);

          const mappingResponse = await fetch(mappingUrl);
          const mappingText = await mappingResponse.text();

          try {
            const mappingData = JSON.parse(mappingText);
            console.log('Successfully got JSON from mapping API');

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

        try {
          const data = JSON.parse(responseText);

          if (
            (Array.isArray(data) && data.length === 0) ||
            (data.message && data.message.includes('No data found'))
          ) {
            console.log('No data found, trying mapping API');

            const mappingUrl = `${apiUrl}/api/checkSchemeMaterialMapping/${encodeURIComponent(scheme)}`;
            console.log('Mapping URL:', mappingUrl);

            const mappingResponse = await fetch(mappingUrl);
            const mappingData = await mappingResponse.json();

            const processedData = Array.isArray(mappingData)
              ? mappingData.map((row, index) => ({
                  ...row,
                  id: row.id || row._id,
                  createdBy: row.createdBy || userId,
                }))
              : [];

            setTableRows(processedData);
          } else {
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

  useEffect(() => {
    if (open && selectedScheme) {
      fetchSchemeData(selectedScheme);
      fetchMaterials();
    } else {
      setTableRows([]);
    }
  }, [open, selectedScheme, fetchMaterials, fetchSchemeData]);

  const handleRowSelection = (selection) => {
    setSelectedRows(selection);
  };

  const handleSave = async () => {
    // debugger;
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

      // Access the users array from the response
      const usersData = await usersResponse.json();

      // Access the users array from the response
      const usersArray = usersData.users;

      // Find the manager of the department
      const manager = usersArray.find(
        (user) => String(user.departmentId) === departmentId && user.role === 'MANAGER'
      );

      // Find ALL SUPER_ADMINS (not just one)
      const superAdmins = usersArray.filter((user) => user.role === 'SUPER_ADMIN');

      if (!manager && superAdmins.length === 0) {
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
          // Don't throw error here as we don't want to fail the entire operation
          console.warn('Failed to send notification to manager, but operation completed');
        }
      }

      // Send notification to ALL SUPER_ADMINS (if any exist)
      if (superAdmins.length > 0) {
        // Use Promise.all to send all notifications in parallel
        const superAdminNotificationPromises = superAdmins.map(async (superAdmin) => {
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
            console.error(
              `SUPER_ADMIN notification error for user ${superAdmin.userId}:`,
              errorResponse
            );
            throw new Error(`Failed to send notification to SUPER_ADMIN: ${superAdmin.userId}`);
          }

          return superAdminNotificationResponse.json();
        });

        // Wait for all notifications to be sent
        await Promise.all(superAdminNotificationPromises);
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

  // Updated handleAddMaterials to use modal instead
  const handleAddMaterials = () => {
    handleOpenAddModal();
  };

  const handleDownloadPopoverOpen = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadPopoverClose = () => {
    setDownloadAnchorEl(null);
  };

  const handleSchemeDownloadPopoverOpen = (event) => {
    setSchemeDownloadAnchorEl(event.currentTarget);
  };

  const handleSchemeDownloadPopoverClose = () => {
    setSchemeDownloadAnchorEl(null);
  };

  const handleDownload = async (type) => {
    const apiUrl = import.meta.env.VITE_APP_URL;

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Server Error. Please try again.';
        throw new Error(errorMessage);
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
        message: `Your report (${filename}) has been downloaded successfully.`,
        severity: 'success',
      });
      handleDownloadPopoverClose();
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

      const checkSchemeUrl = `${apiUrl}/api/checkscheme/${encodeURIComponent(selectedScheme)}`;
      const checkSchemeResponse = await fetch(checkSchemeUrl);

      if (!checkSchemeResponse.ok) {
        throw new Error('Data is not available to download.');
      }

      let storeInData = await checkSchemeResponse.json();

      if (!storeInData.length) {
        const mappingUrl = `${apiUrl}/api/checkSchemeMaterialMapping/${encodeURIComponent(selectedScheme)}`;
        const mappingResponse = await fetch(mappingUrl);

        if (!mappingResponse.ok) {
          throw new Error('Data is not available to download.');
        }

        storeInData = await mappingResponse.json();
      }

      if (!storeInData.length) {
        setSnackbar({
          open: true,
          message: 'Data is not found. Please check your selection and try again.',
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
          message: 'No data is available for your role and filters.',
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
        unit: item.unit || '',
        createdAt: item.createdAt || new Date().toISOString(),
      }));

      const columns = [
        { field: 'scheme', headerName: 'Scheme' },
        { field: 'description', headerName: 'Description' },
        { field: 'materialCode', headerName: 'Material Code' },
        // { field: 'notes', headerName: 'Notes' },
        ...(isElectricalDepartment ? [] : [{ field: 'notes', headerName: 'Notes' }]),
        { field: 'unit', headerName: isElectricalDepartment ? 'UOM' : 'Unit' },
        { field: 'materialQty', headerName: 'Material Qty' },
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
      const { materialCode } = rowToDelete;
      const deleteStockOutResponse = await fetch(
        `${apiUrl}/api/stockout/materialCode/${encodeURIComponent(materialCode)}`,
        {
          method: 'DELETE',
        }
      );

      if (!deleteStockOutResponse.ok && deleteStockOutResponse.status !== 404) {
        const errorData = await deleteStockOutResponse.json();
        throw new Error(errorData.message || 'Failed to delete from StockOut model');
      }

      if (rowToDelete._id) {
        const deleteStockInResponse = await fetch(`${apiUrl}/api/storein/${rowToDelete._id}`, {
          method: 'DELETE',
        });

        if (!deleteStockInResponse.ok) {
          throw new Error('Failed to delete the row from the database');
        }
      }

      setTableRows((prevRows) => prevRows.filter((row) => row.id !== id));

      setSnackbar({
        open: true,
        message: 'Row deleted successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting row:', error);

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
    { field: 'unit', headerName: isElectricalDepartment ? 'UOM' : 'Unit', width: 300 },
    { field: 'materialQty', headerName: 'Quantity', width: 100, editable: false },
    ...(isElectricalDepartment ? [] : [{ field: 'notes', headerName: 'Notes', width: 130 }]),
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
              onClick={() => handleOpenEditModal(params.row)}
              sx={{ color: 'rgb(74,115,15,0.9)' }}
              size="small"
            >
              <EditIcon sx={{ height: '16px' }} />
            </IconButton>
            <IconButton onClick={() => handleDeleteRow(params.row.id)} color="error" size="small">
              <DeleteIcon sx={{ height: '16px' }} />
            </IconButton>
          </Box>
        );
      },
    },
  ];
  // Function to render unit/UOM dropdown based on department
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
              {/* Month Selector */}
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
              {/* Year Selector */}
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
              {/* Download Button */}
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
              {/* Download for selected scheme */}
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
                    backgroundColor: 'grey',
                    color: 'white',

                    height: '32px',
                    minWidth: 0,
                    px: 1.5,
                    fontSize: '0.75rem',
                  }}
                  color="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                {role !== 'MANAGER' && (
                  <Button
                    sx={{
                      // backgroundColor: '#00284C',
                      // color: 'white',
                      // '&:hover': {
                      //   backgroundColor: '#00288C',
                      // },
                      backgroundColor: 'rgb(7, 85, 162,1)',
                      height: '32px',
                      minWidth: 0,
                      px: 1.5,
                      fontSize: '0.75rem',
                    }}
                    variant="contained"
                    // color="inherit"
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
                    options={availableMaterials} // Use filtered available materials
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
                          xs: '30px',
                          sm: '90px',
                        },
                      },
                      '& .MuiAutocomplete-tag': {
                        maxWidth: {
                          xs: '100px',
                          sm: '150px',
                        },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                    filterOptions={(options, { inputValue }) =>
                      options.filter(
                        (option) =>
                          (option.code &&
                            option.code.toLowerCase().includes(inputValue.toLowerCase())) ||
                          (option.description &&
                            option.description.toLowerCase().includes(inputValue.toLowerCase()))
                      )
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Select Materials" fullWidth />
                    )}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    getOptionDisabled={(option) => {
                      // Disable materials that are already in rows
                      const usedMaterialCodes = tableRows.map((row) => row.materialCode);
                      return usedMaterialCodes.includes(option.code);
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    sx={{
                      height: '40px',
                      backgroundColor: 'rgb(7, 85, 162,1)',
                    }}
                    variant="contained"
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
                  flex: 1,
                  minWidth: 100,
                  resizable: true,
                }))}
                checkboxSelection={false}
                onRowSelectionModelChange={handleRowSelection}
                getRowId={(row) => row.id}
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
              />
            </Paper>
          </>
        )}

        {/* Edit Modal */}
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
                      <strong>Code:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
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

                {!isElectricalDepartment && (
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
                        error={
                          !modalMaterialData[material._id]?.materialQty ||
                          modalMaterialData[material._id]?.materialQty <= 0
                        }
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
                        true,
                        material._id
                      )}
                    </Grid>
                    {!isElectricalDepartment && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Notes"
                          value={modalMaterialData[material._id]?.notes || ''}
                          onChange={(e) =>
                            updateMaterialData(material._id, 'notes', e.target.value)
                          }
                          multiline
                          rows={3}
                          placeholder="Optional notes..."
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
                return !data || !data.materialQty || data.materialQty <= 0 || !data.unit;
              })}
            >
              Add All Materials to Grid
            </Button>
          </DialogActions>
        </Dialog>

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
