import MainPage from "layouts/views/Main/Main";
/*
import UserProfile from "layouts/views/UserProfile/UserProfile.jsx";
import TableList from "layouts/views/TableList/TableList.jsx";
import Typography from "layouts/views/Typography/Typography.jsx";
import Icons from "layouts/views/Icons/Icons.jsx";
import Maps from "layouts/views/Maps/Maps.jsx";
import NotificationsPage from "layouts/views/Notifications/Notifications.jsx";
*/

import {
  Dashboard,
  Person,
  ContentPaste,
  LibraryBooks,
  BubbleChart,
  LocationOn,
  Notifications
} from "@material-ui/icons";

const viewRoutes = [
  {
    path: "/main",
    sidebarName: "Main",
    navbarName: "Main",
    icon: BubbleChart,
    component: MainPage
  },
  {
    path: "/user",
    sidebarName: "User Profile",
    navbarName: "Profile",
    icon: Person,
    component: MainPage
  },
  {
    path: "/table",
    sidebarName: "Table List",
    navbarName: "Table List",
    icon: ContentPaste,
    component: MainPage
  },
  {
    path: "/typography",
    sidebarName: "Typography",
    navbarName: "Typography",
    icon: LibraryBooks,
    component: MainPage
  },
  {
    path: "/icons",
    sidebarName: "Icons",
    navbarName: "Icons",
    icon: BubbleChart,
    component: MainPage
  },
  {
    path: "/maps",
    sidebarName: "Maps",
    navbarName: "Map",
    icon: LocationOn,
    component: MainPage
  },
  {
    path: "/notifications",
    sidebarName: "Notifications",
    navbarName: "Notifications",
    icon: Notifications,
    component: MainPage
  },
  { redirect: true, path: "/", to: "/main", navbarName: "Redirect" }
];

export default viewRoutes;
