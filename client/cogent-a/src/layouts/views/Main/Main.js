import React from "react";
import PropTypes from "prop-types";
// react plugin for creating charts
//import ChartistGraph from "react-chartist";
import {
  ContentCopy,
  Store,
  InfoOutline,
  Warning,
  DateRange,
  LocalOffer,
  Update,
  ArrowUpward,
  AccessTime,
  Accessibility
} from "@material-ui/icons";
import { withStyles, Grid } from "material-ui";

import {
  /*
  StatsCard,
  ChartCard,
  TasksCard,
  RegularCard,
  Table,
  */
  ItemGrid
} from "layouts/components";
/*
import {
  dailySalesChart,
  emailsSubscriptionChart,
  completedTasksChart
} from "variables/charts";
*/
import mainStyle from "assets/jss/material-dashboard-react/dashboardStyle";

class Main extends React.Component {
  state = {
    value: 0
  };
  handleChange = (event, value) => {
    this.setState({ value });
  };

  handleChangeIndex = index => {
    this.setState({ value: index });
  };
  render() {
    return (
      <div>
        <Grid container>
          <ItemGrid xs={12} sm={6} md={3}>
            1
          </ItemGrid>
          <ItemGrid xs={12} sm={6} md={3}>
            2
          </ItemGrid>
          <ItemGrid xs={12} sm={6} md={3}>
            3
          </ItemGrid>
          <ItemGrid xs={12} sm={6} md={3}>
            4
          </ItemGrid>
        </Grid>
        <Grid container>
          <ItemGrid xs={12} sm={12} md={4}>
            5
          </ItemGrid>
          <ItemGrid xs={12} sm={12} md={4}>
            6
          </ItemGrid>
          <ItemGrid xs={12} sm={12} md={4}>
            7
          </ItemGrid>
        </Grid>
        <Grid container>
          <ItemGrid xs={12} sm={12} md={6}>
            8
          </ItemGrid>
          <ItemGrid xs={12} sm={12} md={6}>
            9
          </ItemGrid>
        </Grid>
      </div>
    );
  }
}

Main.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(mainStyle)(Main);
