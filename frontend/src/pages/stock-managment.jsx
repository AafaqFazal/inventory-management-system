import { Helmet } from 'react-helmet-async';

import UserView from 'src/sections/stock-management/Index';

// ----------------------------------------------------------------------

export default function UserPage() {
  return (
    <>
      <Helmet>
        <title> Stock Management | IMS </title>
      </Helmet>

      <UserView />
    </>
  );
}
