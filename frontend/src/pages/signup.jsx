import { Helmet } from 'react-helmet-async';

// import { LoginView } from 'src/sections/login';
import SignUpView from 'src/sections/signup/signup-view';

// ----------------------------------------------------------------------

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title> SignUp | IMS </title>
      </Helmet>

      <SignUpView />
    </>
  );
}
