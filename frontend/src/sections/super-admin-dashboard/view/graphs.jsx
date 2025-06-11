import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';

import AppCurrentVisits from 'src/sections/overview/app-current-visits';
import AppWebsiteVisits from 'src/sections/overview/app-website-visits';

const API_URL = import.meta.env.VITE_APP_URL;

export default function AppView() {
  const [chartData, setChartData] = useState({
    labels: [],
    series: [
      { name: 'Materials', type: 'column', fill: 'solid', data: [] },
      { name: 'Schemes', type: 'area', fill: 'gradient', data: [] },
    ],
  });
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [totalSchemes, setTotalSchemes] = useState(0);
  const [isPONumber, setIsPONumber] = useState(false); // Add state for isPONumber

  useEffect(() => {
    async function fetchData() {
      try {
        // Get user role and IDs from session storage
        const role = sessionStorage.getItem('role');
        const warehouseId = sessionStorage.getItem('warehouseId');
        const departmentId = sessionStorage.getItem('departmentId');
        const department = sessionStorage.getItem('department');

        // Check if the condition to convert scheme to PO Number is met
        const shouldConvertToPONumber =
          (role === 'WAREHOUSE_USER' || role === 'MANAGER') && department === 'Telecom';
        setIsPONumber(shouldConvertToPONumber); // Update the state

        // Fetch necessary data
        const materialsResponse = await fetch(`${API_URL}/api/materials`);
        const schemesResponse = await fetch(`${API_URL}/api/schemes`);
        const warehousesResponse = await fetch(`${API_URL}/api/warehouses`);

        const materials = await materialsResponse.json();
        const schemes = await schemesResponse.json();
        const warehouses = await warehousesResponse.json();

        // Apply role-based filtering for materials
        let filteredMaterials = [];
        if (role === 'SUPER_ADMIN') {
          filteredMaterials = materials;
        } else if (role === 'WAREHOUSE_USER') {
          filteredMaterials = materials.filter(
            (item) => item.isActive === true && String(item.warehouseId?._id) === warehouseId
          );
        } else if (role === 'MANAGER') {
          const departmentWarehouses = warehouses.filter(
            (w) => String(w.departmentId?._id || w.departmentId) === departmentId
          );
          const warehouseIds = departmentWarehouses.map((w) => String(w._id));
          filteredMaterials = materials.filter(
            (item) =>
              item.isActive === true &&
              warehouseIds.includes(String(item.warehouseId?._id || item.warehouseId))
          );
        }

        // Apply role-based filtering for schemes
        let filteredSchemes = [];
        if (role === 'SUPER_ADMIN') {
          filteredSchemes = schemes.filter((x) => x.isActive === true);
        } else if (role === 'MANAGER') {
          const storedDepartmentId = sessionStorage.getItem('departmentId');
          const departmentWarehouses = warehouses.filter(
            (w) => String(w.departmentId?._id || w.departmentId) === storedDepartmentId
          );
          const managerWarehouseIds = departmentWarehouses.map((w) => String(w._id));

          // Store warehouse IDs in session storage as in your original code
          sessionStorage.setItem('warehouseIds', JSON.stringify(managerWarehouseIds));

          filteredSchemes = schemes.filter(
            (x) =>
              x.isActive === true &&
              managerWarehouseIds.includes(String(x.warehouseId?._id || x.warehouseId))
          );
        } else if (role === 'WAREHOUSE_USER') {
          filteredSchemes = schemes.filter(
            (x) =>
              x.isActive === true &&
              String(x.warehouseId?._id) === sessionStorage.getItem('warehouseId')
          );
        }

        // Update total counts
        setTotalMaterials(filteredMaterials.length);
        setTotalSchemes(filteredSchemes.length);

        // Generate last 5 months + current month for chart data
        const dateLabels = [];
        const dateTimes = [];
        const materialsData = [];
        const schemesData = [];

        // Get current date and ensure it's set to the 1st of the month
        const currentDate = new Date();
        currentDate.setDate(1);
        // Force time to noon to avoid timezone issues
        currentDate.setHours(12, 0, 0, 0);

        for (let i = 4; i >= 0; i -= 1) {
          // Create a proper date for each month
          const date = new Date(currentDate);
          date.setMonth(currentDate.getMonth() - i);

          // Format for display labels
          const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          dateLabels.push(monthYear);

          // Store actual timestamps for the chart data
          dateTimes.push(date.getTime());

          // console.log('Generated Label:', monthYear, 'Date:', date.toISOString());

          // Count filtered materials for this exact month and year
          const materialsCount = filteredMaterials.filter((item) => {
            const itemDate = new Date(item.createdAt);
            return (
              itemDate.getMonth() === date.getMonth() &&
              itemDate.getFullYear() === date.getFullYear()
            );
          }).length;

          // Count filtered schemes for this exact month and year
          const schemesCount = filteredSchemes.filter((item) => {
            const itemDate = new Date(item.createdAt);
            return (
              itemDate.getMonth() === date.getMonth() &&
              itemDate.getFullYear() === date.getFullYear()
            );
          }).length;

          materialsData.push(materialsCount);
          schemesData.push(schemesCount);
        }

        // For debugging, show actual dates and filtered data
        // console.log('Final Labels:', dateLabels);
        // console.log(
        //   'Actual Dates:',
        //   dateTimes.map((t) => new Date(t).toISOString())
        // );
        // console.log('Filtered Materials Data:', materialsData);
        // console.log('Filtered Schemes Data:', schemesData);

        // Create chart data with actual timestamps as x-values
        const formattedMaterialsData = materialsData.map((value, index) => ({
          x: dateTimes[index],
          y: value,
        }));

        const formattedSchemesData = schemesData.map((value, index) => ({
          x: dateTimes[index],
          y: value,
        }));

        // Update series name if the condition is met
        const series = [
          {
            name: 'Materials',
            type: 'column',
            fill: 'solid',
            data: formattedMaterialsData,
          },
          {
            name: isPONumber ? 'PO Number' : 'Schemes',
            type: 'area',
            fill: 'gradient',
            data: formattedSchemesData,
          },
        ];

        setChartData({
          labels: dateLabels,
          series,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }

    fetchData();
  }, [isPONumber]);

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <AppWebsiteVisits
            title="Rawasialbina Statistics"
            // subheader="(+43%) than last year"
            chart={chartData}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <AppCurrentVisits
            // title="Current Visits"
            chart={{
              series: [
                { label: 'Materials', value: totalMaterials },
                { label: isPONumber ? 'PO Number' : 'Schemes', value: totalSchemes },
              ],
            }}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
