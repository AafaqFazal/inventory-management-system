import { Helmet } from 'react-helmet-async';

import { UserView } from '../sections/user-management/view/index';

// ----------------------------------------------------------------------

export default function UserPage() {
  return (
    <>
      <Helmet>
        <title> User Management | IMS </title>
      </Helmet>

      <UserView />
    </>
  );
}
