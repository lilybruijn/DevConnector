import "./App.css";
import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Route, Routes } from "react-router";
import Navbar from "./components/layout/Navbar";
import Landing from "./components/layout/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import Alert from "./components/layout/Alert";

// Redux
import store from "./store";
import { Provider } from "react-redux";
import { loadUser } from "./actions/auth";
import { setAuthToken } from "./utils/setAuthToken";
import Dashboard from "./components/dashboard/Dashboard";
import PrivateRoute from "./components/routing/PrivateRoute";

if (localStorage.getItem("token")) {
  setAuthToken(localStorage.getItem("token"));
}

const App = () => {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <Provider store={store}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
        <section className="container">
          <Alert />
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={<PrivateRoute component={Dashboard} />}
            />
          </Routes>
        </section>
      </Router>
    </Provider>
  );
};

export default App;
