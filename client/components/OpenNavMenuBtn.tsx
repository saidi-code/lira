import { useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/index';
const OpenNavMenuBtn = () => {
      const navigation = useNavigation();
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