import { Helmet } from 'react-helmet-async';

import Footer from 'src/layouts/dashboard/footer';

import MaterialManagmenet from 'src/sections/material-managmenet/index';
// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title> Material Management | IMS </title>
      </Helmet>

      <MaterialManagmenet />
      {/* <Footer /> */}
    </>
  );
}
