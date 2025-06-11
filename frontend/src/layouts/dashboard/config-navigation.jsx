import ImgIcon from 'src/components/svg-color/ImgIcon';

// ----------------------------------------------------------------------

const icon = (path) => <ImgIcon src={path} sx={{ width: 1, height: 1 }} />;

// Function to get dynamic navConfig based on sessionStorage
export const getNavConfig = () => {
  // Retrieve user policies, role, and department from session storage
  const userPolicies = JSON.parse(sessionStorage.getItem('userPolicies')) || [];
  const userRole = sessionStorage.getItem('role'); // Get the user's role
  const userDepartment = sessionStorage.getItem('department'); // Get the user's department

  // Sort policies by 'order' field
  const sortedUserPolicies = userPolicies.sort((a, b) => a.order - b.order);

  // Build dynamic navConfig based on sorted user policies
  return sortedUserPolicies
    .map((policy) => {
      let title = policy.URL_Name;

      // Check if the user is a Warehouse User or Manager and belongs to the Telecom department
      if (
        (userRole === 'WAREHOUSE_USER' || userRole === 'MANAGER') &&
        userDepartment === 'Telecom' &&
        policy.URL === '/schemes' // Assuming this is the URL for Schemes
      ) {
        title = 'PO Number'; // Change the URL_Name to "PO Number"
      }

      return {
        title, // Use the updated title
        path: policy.URL, // URL from policies
        icon: icon(policy.Icon), // Icon for each policy item
      };
    })
    .filter((policy) => {
      // Show "PO Tracking" only if the user's department is Telecom
      if (policy.path === '/po-tracking') {
        return userDepartment === 'Telecom';
      }
      return true; // Include all other policies
    });
};
