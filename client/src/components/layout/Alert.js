import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

const Alert = ({ alerts }) =>
  alert !== null &&
  alerts.length > 0 &&
  alerts.map((alert) => {
    return (
      <div key={alert.id} className={`alert alert-${alert.alertType}`}>
        {alert.msg}
      </div>
    );
  });

const mapStateToProps = (state) => ({
  alerts: state.alert,
});

Alert.propTypes = {
  alerts: PropTypes.array.isRequired,
};

export default connect(mapStateToProps, {})(Alert);
