import {
  // Import the creation function
  createDrawerNavigator,
  // Import the types
  DrawerNavigationEventMap,
  DrawerNavigationOptions,
} from "@react-navigation/drawer";
import {
  DrawerNavigationState,
  type ParamListBase,
} from "@react-navigation/native";

import { withLayoutContext } from "expo-router";

const { Navigator } = createDrawerNavigator();

// This can be used like `<Drawer />`
export const Drawer = withLayoutContext<
  DrawerNavigationOptions,
  typeof Navigator,
  DrawerNavigationState<ParamListBase>,
  DrawerNavigationEventMap
>(Navigator);