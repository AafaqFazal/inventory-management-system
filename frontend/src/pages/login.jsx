import { Helmet } from 'react-helmet-async';

import Footer from 'src/layouts/dashboard/footer';

import { LoginView } from 'src/sections/login';
// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title> Login | IMS </title>
      </Helmet>

      <LoginView />
      <Footer />
    </>
  );
}
