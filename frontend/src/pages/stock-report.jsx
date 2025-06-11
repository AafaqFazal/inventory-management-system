import { Helmet } from 'react-helmet-async';

import UserView from 'src/sections/stock-report/StockReport';

// ----------------------------------------------------------------------

export default function UserPage() {
  return (
    <>
      <Helmet>
        <title> Stock Report | IMS </title>
      </Helmet>

      <UserView />
    </>
  );
}
