import { useNavigation } from 'expo-router';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/index';
const OpenNavMenuBtn = () => {
  const navigation =
    useNavigation<DrawerNavigationProp<ReactNavigation.RootParamList>>();
  return (
   <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
              <Ionicons
                name="menu-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity> 
  )
}

export default OpenNavMenuBtn