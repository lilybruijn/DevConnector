import React from "react";
import { connect } from "react-redux";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

const PrivateRoute = ({
  component: Component,
  auth: { isAuthenticated, loading },
}) => {
  if (loading) return <h1>Loading</h1>;
  if (isAuthenticated && !loading) return <Component />;
  return <Navigate to="/login" />;
};

PrivateRoute.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps, {})(PrivateRoute);
