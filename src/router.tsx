import React from "react";
import { HashRouter, Route, Switch, BrowserRouter } from "react-router-dom";
import Room from "./pages/Room";
import DashBoard from "./pages/Dashboard";

const BasicRoute = () => (
  <HashRouter>
    <Switch>
      <Route exact path="/" component={DashBoard} />
      <Route exact path="/room" component={Room} />
    </Switch>
  </HashRouter>
);

export default BasicRoute;
