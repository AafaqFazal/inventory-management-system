// import GradeTable from "src/sections/grade/gradeView";
import { Helmet } from 'react-helmet-async';

import ForgetPassword from 'src/sections/forget-password/forgetPassword';

// ----------------------------------------------------------------------

export default function gradePage() {
  return (
    <>
      <Helmet>
        <title>Grade | IMS </title>
      </Helmet>
      {/* <div style={{height:"60vh"}}> */}
      <ForgetPassword />
      {/* </div> */}
    </>
  );
}
