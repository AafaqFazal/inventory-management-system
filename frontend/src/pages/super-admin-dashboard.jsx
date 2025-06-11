import { Helmet } from 'react-helmet-async';

import UserView from '../sections/super-admin-dashboard/view/superAdminDashboard';

// ----------------------------------------------------------------------

export default function UserPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard | IMS </title>
      </Helmet>

      <UserView />
    </>
  );
}
