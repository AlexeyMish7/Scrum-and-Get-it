import React from 'react';
import { Breadcrumbs, Typography, Link as MUILink } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const BreadcrumbsBar: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <Breadcrumbs sx={{ padding: '1rem 2rem' }}>
      <MUILink component={Link} underline="hover" color="inherit" to="/">
        Home
      </MUILink>
      {pathnames.map((value, index) => {
        const path = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        return isLast ? (
          <Typography color="text.primary" key={path}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </Typography>
        ) : (
          <MUILink
            component={Link}
            to={path}
            underline="hover"
            color="inherit"
            key={path}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </MUILink>
        );
      })}
    </Breadcrumbs>
  );
};

export default BreadcrumbsBar;