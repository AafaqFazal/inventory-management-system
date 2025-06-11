import React from 'react';
import { Helmet } from 'react-helmet-async';

// eslint-disable-next-line import/no-unresolved
import Departments from 'src/sections/departments/view/user-view';

export default function departments() {
  return (
    <>
      <Helmet>
        <title> Departments |IMS</title>
      </Helmet>
      <Departments />
    </>
  );
}
