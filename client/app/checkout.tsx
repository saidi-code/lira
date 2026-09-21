import { View, Text } from 'react-native'
import {useCart} from '../hooks/useCart'
import { useAuth } from "@clerk/clerk-expo";
import {useState} from "react"


const checkout = () => {
    const [addressList,setAddressList]=useState([])
    const [selectedShippingAddress,setShipingAddress]=useState("")
    const [isLoadingListAddress,setIsLoadingListAddress]= useState(true)
    const { cartTotal, clearCart,cartItems } = useCart();
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "stripe">("cash");
    const { getToken } = useAuth();
    const fetchAddress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/addresses", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const addressList = data.data;
      if (addressList.length > 0) {
        // Find default or first address
        const def = addressList.find((a: any) => a.isDefault) || addressList[0];
        setSelectedAddress(def as Address);
      }
    } catch (error: any) {
      console.error("Error fetching addresses:", error);
    } finally {
      setIsLoadingListAddress(false);
    }
    // const addressList = dummyAddress;
    // if (addressList.length > 0) {
    //   // Find default or first address
    //   const def = addressList.find((a: any) => a.isDefault) || addressList[0];
    //   setSelectedAddress(def as Address);
    // }
    // setPageLoading(false);
  };
  return (
    <View>
      <Text>checkout</Text>
    </View>
  )
}

export default checkout