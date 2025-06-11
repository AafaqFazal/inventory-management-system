import React, { useState, useEffect } from 'react';

import { Box, Grid, Paper, Typography } from '@mui/material';

import Graphs from './graphs';

function Dashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [totalDepartments, setTotalDepartements] = useState(0);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [totalWareHouses, setTotalWareHouses] = useState(0);
  const [totalManagers, setTotalManagers] = useState(0);
  const [totalWarehouseUsers, setTotalWarehouseUsers] = useState(0);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchWarehouses(); // Fetch warehouses on component mount
  }, []);

  const fetchWarehouses = async () => {
    const url = import.meta.env.VITE_APP_URL;
    try {
      const response = await fetch(`${url}/api/warehouses`);
      const data = await response.json();
      setWarehouses(data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const warehouseId = sessionStorage.getItem('warehouseId');
  const warehouseName = sessionStorage.getItem('warehouse'); // Retrieve warehouse name
  const departmentId = sessionStorage.getItem('departmentId');
  const role = sessionStorage.getItem('role');

  useEffect(() => {
    const fetchTotalUsers = async () => {
      const url = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${url}/api/user/getusers`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setTotalStudents(data.users.length);
        const managerUsers = data.users.filter((user) => user.role === 'MANAGER');
        setTotalManagers(managerUsers.length);
        const warehouseUsers = data.users.filter((user) => user.role === 'WAREHOUSE_USER');
        setTotalWarehouseUsers(warehouseUsers.length);
      } catch (error) {
        console.error('Error fetching total students:', error);
      }
    };

    const fetchTotalSchemes = async () => {
      const url = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${url}/api/schemes`);
        if (!response.ok) {
          throw new Error('Failed to fetch schemes');
        }
        const data = await response.json();
        if (role === 'SUPER_ADMIN') {
          setTotalSchemes(data.filter((x) => x.isActive === true).length);
        } else if (role === 'MANAGER') {
          const storedDepartmentId = sessionStorage.getItem('departmentId');
          const departmentWarehouses = warehouses.filter(
            (w) => String(w.departmentId?._id || w.departmentId) === storedDepartmentId
          );
          const managerWarehouseIds = departmentWarehouses.map((w) => String(w._id));
          sessionStorage.setItem('warehouseIds', JSON.stringify(managerWarehouseIds));
          setTotalSchemes(
            data.filter(
              (x) =>
                x.isActive === true &&
                managerWarehouseIds.includes(String(x.warehouseId?._id || x.warehouseId))
            ).length
          );
        } else if (role === 'WAREHOUSE_USER') {
          setTotalSchemes(
            data.filter(
              (x) =>
                x.isActive === true &&
                String(x.warehouseId?._id) === sessionStorage.getItem('warehouseId')
            ).length
          );
        }
      } catch (error) {
        console.error('Error fetching schemes:', error);
      }
    };

    const fetchTotalDepartments = async () => {
      const url = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${url}/api/departments`);
        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        setTotalDepartements(data.length);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    const fetchTotalWarehouse = async () => {
      const url = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${url}/api/warehouses`);
        if (!response.ok) {
          throw new Error('Failed to fetch warehouses');
        }
        const data = await response.json();
        const storedDepartmentId = sessionStorage.getItem('departmentId');

        let filteredWarehouses = [];

        if (role === 'SUPER_ADMIN') {
          // For SUPER_ADMIN, count all active warehouses
          filteredWarehouses = data.filter((x) => x.isActive === true);
        } else if (role === 'MANAGER') {
          // For MANAGER, count warehouses in their department
          filteredWarehouses = data.filter(
            (w) =>
              String(w.departmentId?._id || w.departmentId) === storedDepartmentId && // Match department
              w.isActive === true // Include only active warehouses
          );
        } else if (role === 'WAREHOUSE_USER') {
          // For WAREHOUSE_USER, count only their assigned warehouse
          const assignedWarehouseId = sessionStorage.getItem('warehouseId');
          filteredWarehouses = data.filter(
            (w) =>
              String(w._id) === assignedWarehouseId && // Match warehouse ID
              w.isActive === true // Include only active warehouses
          );
        } else {
          // Default case (e.g., for other roles or unauthenticated users)
          filteredWarehouses = [];
        }

        // Update the total warehouses count
        setTotalWareHouses(filteredWarehouses.length);
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    };

    const fetchTotalMaterials = async () => {
      const url = import.meta.env.VITE_APP_URL;
      try {
        const response = await fetch(`${url}/api/materials`);
        if (!response.ok) {
          throw new Error('Failed to fetch materials');
        }
        const data = await response.json();

        let filteredData = [];

        if (role === 'SUPER_ADMIN') {
          filteredData = data;
        } else if (role === 'WAREHOUSE_USER') {
          filteredData = data.filter(
            (item) => item.isActive === true && String(item.warehouseId?._id) === warehouseId
          );
        } else if (role === 'MANAGER') {
          const departmentWarehouses = warehouses.filter(
            (w) => String(w.departmentId?._id || w.departmentId) === departmentId
          );
          const warehouseIds = departmentWarehouses.map((w) => String(w._id));
          filteredData = data.filter(
            (item) =>
              item.isActive === true &&
              warehouseIds.includes(String(item.warehouseId?._id || item.warehouseId))
          );
        }

        setTotalMaterials(filteredData.length);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    fetchTotalUsers();
    fetchTotalSchemes();
    fetchTotalDepartments();
    fetchTotalWarehouse();
    fetchTotalMaterials();
  }, [role, warehouseId, departmentId, warehouses]); // Add dependencies

  const formattedTime = currentTime.toLocaleTimeString();
  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const userRole = sessionStorage.getItem('role');
  const department = sessionStorage.getItem('department');
  const isPONumber = (role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom';
  const stats = [
    {
      title: 'Departments',
      value: totalDepartments,
      note: 'available in RawasiAlbina',
      roles: ['SUPER_ADMIN'],
    },
    {
      title: 'Warehouses',
      value: totalWareHouses,
      note: 'available in RawasiAlbina',
      roles: ['SUPER_ADMIN', 'MANAGER'],
    },
    {
      title: 'Materials',
      value: totalMaterials,
      note: 'available in RawasiAlbina',
      roles: ['SUPER_ADMIN', 'WAREHOUSE_USER', 'MANAGER'],
    },
    {
      title: isPONumber ? 'PO Number' : 'Scheme',
      value: totalSchemes,
      note: 'available in RawasiAlbina',
      roles: ['SUPER_ADMIN', 'WAREHOUSE_USER', 'MANAGER'],
    },
    {
      title: 'Total Accounts',
      value: totalStudents,
      note: 'available in RawasiAlbina',
      roles: ['SUPER_ADMIN'],
    },
    {
      title: 'Total Managers',
      value: totalManagers,
      note: 'available in RawasiAlbina',
      roles: ['SUPER_ADMIN'],
    },
    {
      title: 'Total Warehouse Users',
      value: totalWarehouseUsers,
      note: 'available in RawasiAlbina',
      roles: ['SUPER_ADMIN'],
    },
  ];

  const visibleStats = stats.filter((stat) => stat.roles.includes(userRole));

  // Organize the data to pass to the Graphs component
  const graphData = {
    totalStudents,
    totalSchemes,
    totalDepartments,
    totalMaterials,
    totalWareHouses,
    totalManagers,
    totalWarehouseUsers,
    warehouses,
  };

  return (
    <>
      <Box sx={{ p: 3, backgroundColor: '#f3f4f6' }}>
        <Typography variant="h6" sx={{ mb: 3, color: '#6c63ff' }}>
          Dashboard {role === 'WAREHOUSE_USER' && `- ${warehouseName}`}{' '}
          {/* Display warehouse name */}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3} lg={3} sx={{ gridRow: 'span 2' }}>
            <Paper
              elevation={3}
              sx={{ p: 3, textAlign: 'center', borderRadius: 2, height: '100%' }}
            >
              <Typography variant="h4" sx={{ color: '#6c63ff', fontSize: '2rem' }}>
                {formattedTime}
              </Typography>
              <Typography variant="subtitle2" sx={{ color: 'gray' }}>
                Realtime Insight
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, color: 'black', fontSize: '1.1rem' }}>
                Today: {formattedDate}
              </Typography>
            </Paper>
          </Grid>

          {visibleStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} lg={3} key={index}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h3" sx={{ color: '#333', fontSize: '2rem' }}>
                  {stat.value}
                </Typography>
                <Typography variant="h6" sx={{ mt: 1, color: '#6c63ff', fontSize: '1.1rem' }}>
                  {stat.title}
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'gray', mt: 1, fontSize: '0.9rem' }}>
                  {stat.note}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Graphs data={graphData} />
    </>
  );
}

export default Dashboard;
