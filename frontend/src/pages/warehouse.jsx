import React from 'react';
import { Helmet } from 'react-helmet-async';

// eslint-disable-next-line import/no-unresolved
import Warehouses from 'src/sections/warehouse/view/user-view';

export default function departments() {
  return (
    <>
      <Helmet>
        <title> Warehouse |IMS</title>
      </Helmet>
      <Warehouses />
    </>
  );
}
