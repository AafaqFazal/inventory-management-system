import { useState, useEffect, useCallback } from 'react';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import {
  Card,
  Table,
  Button,
  Toolbar,
  Container,
  TableBody,
  OutlinedInput,
  TableContainer,
  InputAdornment,
  TablePagination,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import UserTableRow from '../user-table-row';
import UserTableHead from '../user-table-head';
import TableEmptyRows from '../table-empty-rows';
import { applyFilter, getComparator } from '../utils';

export default function UserPage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [users, setUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState();

  const url = import.meta.env.VITE_APP_URL;

  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await fetch(`${url}/api/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch all users');
      }
      const data = await response.json();
      setUsers(data);
      console.log('All Users:', data);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  }, [url]);

  const fetchAttendanceByDate = useCallback(async () => {
    if (!selectedDate) {
      console.log('No date selected, fetching all users.');
      await fetchAllUsers(); // Ensure fetchAllUsers is awaited
      return;
    }

    try {
      const formattedDate = selectedDate.toLocaleDateString('en-CA');
      console.log('Fetching attendance for date:', formattedDate);
      const response = await fetch(`${url}/api//students/attendances?date=${formattedDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }
      const data = await response.json();

      console.log('Fetched Attendance Data:', data);

      if (!Array.isArray(data.attendanceData)) {
        console.error('Expected attendanceData to be an array but got:', data);
        return; // Exit if attendanceData is not an array
      }

      // Create updatedUsers for logging
      const updatedUsers = users.map((user) => {
        const attendanceRecord = data.attendanceData.find(
          (record) => record.studentId === user._id && record.attendances[0]?.date === formattedDate
        );
        return {
          ...user,
          attendance: attendanceRecord ? attendanceRecord.attendances : [], // Access the attendances array
        };
      });

      // Update users state only when the data changes
      setUsers(updatedUsers);
      console.log('Filtered Attendance Data:', updatedUsers);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  }, [selectedDate, fetchAllUsers, url, users]);

  useEffect(() => {
    // Fetch all users only once on component mount
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    // Fetch attendance data only when the date is changed
    fetchAttendanceByDate();
  };

  const handleSort = (event, id) => {
    const isAsc = orderBy === id && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(id);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const dataFiltered = applyFilter({
    inputData: users,
    comparator: getComparator(order, orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && filterName.trim() !== '';

  return (
    <Container sx={{ height: { lg: '60vh' }, minWidth: '75vw' }}>
      <Card>
        <Toolbar sx={{ height: 96, display: 'flex', alignItems: 'center', gap: 3, p: 1 }}>
          <div style={{ fontWeight: 'bold', color: '#3f3f46' }}>Attendance Overview</div>
          <OutlinedInput
            value={filterName}
            onChange={handleFilterByName}
            placeholder="Quick Search..."
            startAdornment={
              <InputAdornment position="start">
                <Iconify
                  icon="eva:search-fill"
                  sx={{ color: 'text.disabled', width: 20, height: 20 }}
                />
              </InputAdornment>
            }
            sx={{ width: 400, borderRadius: 2 }}
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={handleDateChange} // Change here
              renderInput={(props) => (
                <OutlinedInput
                  {...props}
                  sx={{ width: 160, borderRadius: 2, bgcolor: 'grey.100' }}
                />
              )}
            />
          </LocalizationProvider>
          <Button
            variant="contained"
            sx={{
              bgcolor: '#6C5CE7',
              direction: 'flex-end',
              color: 'white',
              textAlign: '',
              textTransform: 'none',
              borderRadius: 2,
              padding: '8px 16px',
              '&:hover': { bgcolor: '#5B4AC8' },
            }}
            onClick={fetchAttendanceByDate} // No need to call again here
          >
            View Attendance
          </Button>
        </Toolbar>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table>
              <UserTableHead
                order={order}
                orderBy={orderBy}
                rowCount={users.length}
                numSelected={0}
                onRequestSort={handleSort}
                headLabel={[
                  { id: 'idNumber', label: 'Id Number' },
                  { id: 'name', label: 'Name' },
                  { id: 'status', label: 'Status' },
                  { id: 'date', label: 'Date' },
                  { id: 'clockIn', label: 'ClockIn' },
                  { id: 'clockOut', label: 'ClockOut' },
                ]}
              />
              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <UserTableRow
                      key={row._id}
                      idNumber={row.idNumber}
                      name={row.fullName}
                      status={row.status}
                      date={selectedDate ? selectedDate.toLocaleDateString('en-CA') : 'No Date'}
                      clockIn={row.attendance?.[0]?.clockIn ?? 'No Clock In'}
                      clockOut={row.attendance?.[0]?.clockOut ?? 'No Clock Out'}
                    />
                  ))}
                <TableEmptyRows height={rowsPerPage - dataFiltered.length} />
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={users.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Container>
  );
}
