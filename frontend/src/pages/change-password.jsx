// import GradeTable from "src/sections/grade/gradeView";
import { Helmet } from 'react-helmet-async';

import ChangePassword from 'src/sections/forget-password/changePassword';

// ----------------------------------------------------------------------

export default function gradePage() {
  return (
    <>
      <Helmet>
        <title>Change Password | IMS </title>
      </Helmet>
      <div style={{ height: '60vh' }}>
        <ChangePassword />
      </div>
    </>
  );
}
