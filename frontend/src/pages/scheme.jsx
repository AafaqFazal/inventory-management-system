import React from 'react';
import { Helmet } from 'react-helmet-async';

// eslint-disable-next-line import/no-unresolved
import Schemes from 'src/sections/scheme/view/user-view';

export default function departments() {
  return (
    <>
      <Helmet>
        <title> Scheme |IMS</title>
      </Helmet>
      <Schemes />
    </>
  );
}
