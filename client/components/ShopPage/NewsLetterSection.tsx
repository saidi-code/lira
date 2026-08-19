import { View, Text,TouchableOpacity,TextInput } from 'react-native'
import {useState} from 'react'
import NewsLetterSkeleton from './NewsLetterSkeleton';

const NewsLetterSection = ({ isLoading}:{isLoading:boolean}) => {
  const [email, setEmail] = useState("");

  return isLoading ? <NewsLetterSkeleton/> : (
     <View className="px-2 mx-4 pt-[47px] pb-12 bg-[#b89354]/10 rounded-[40px] items-start gap-4 mb-12">
            <View className="self-stretch items-center">
              <Text className="text-center text-[#785920] text-2xl font-bold font-jazera">
                مجلة ليرة الرقمية
              </Text>
            </View>
            <View className="flex items-center justify-center mb-4">
              <View className="mx-3">
                <Text className="text-center text-[#4e4639] text-base font-bady">
                  اشترك لتصلك أحدث المقالات والمجموعات الحصرية من عالم الفخامة
                </Text>
              </View>
            </View>
            <View className="w-full max-w-[448px] relative">
              <View className="relative w-full bg-white rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                <TextInput
                  className="w-full py-[23px] pl-[104px] pr-8 text-end text-gray-500 text-base font-normal font-tajawal"
                  placeholder="بريدك الإلكتروني"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  textAlign="right"
                  style={{ minHeight: 66 }}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                className="absolute left-[8px] top-1/2 -translate-y-1/2 px-6 py-3 bg-[#b89354] rounded-full justify-center items-center"
                onPress={() => {
                  console.log("Subscribe with:", email);
                }}
              >
                <Text className="text-center text-white text-base font-medium font-tajawal leading-6">
                  انضمام
                </Text>
              </TouchableOpacity>
            </View>
          </View>
  )
}

export default NewsLetterSection