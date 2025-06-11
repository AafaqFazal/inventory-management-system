import { Helmet } from 'react-helmet-async';

import PoTracking from 'src/sections/po-tracking/view/user-view';
// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title> PO Tracking | IMS </title>
      </Helmet>

      <PoTracking />
    </>
  );
}
