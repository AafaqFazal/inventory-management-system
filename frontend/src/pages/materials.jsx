import React from 'react';
import { Helmet } from 'react-helmet-async';

// eslint-disable-next-line import/no-unresolved
import Materials from 'src/sections/material/view/user-view';

export default function departments() {
  return (
    <>
      <Helmet>
        <title> Material |IMS</title>
      </Helmet>
      <Materials />
    </>
  );
}
