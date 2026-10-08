import React, { useState,useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { api } from '@/config/api';
import { COLORS } from '@/constants';
import { usePrice } from '@/hooks/usePrice';

const brandsOptions = [
    { label: 'الكل', value: '' },
  { label: 'نسيج الشرق', value: 'نسيج الشرق' },
  { label: 'فنون يدوية', value: 'فنون يدوية' },
  { label: 'تراثنا الأصيل', value: 'تراثنا الأصيل' },
  {label:"لطافة", value:"لطافة"},
];

// const categoriesOptions = CATEGORIES.map((c) => ({ label: c.title, value: c.title }));

const colorOptions = ['#000000', '#ffffff', '#B89354', '#D4AF37'];

const sizesOptions = [
  { label: 'الكل', value: '' },
  { label: 'صغير', value: 's' },
  { label: 'متوسط', value: 'm' },
  { label: 'كبير', value: 'l' },
  { label: 'كبير جداً', value: 'xxl' },
];

interface SearchPageProps {
  showFilterModal: boolean;
  setShowFilterModal: (visible: boolean) => void;
  selectedCategory?: string;
  setSelectedCategory?: (cat: string) => void;
  selectedColor?: string;
  setSelectedColor?: (color: string) => void;
  selectedSize?: string;
  setSelectedSize?: (size: string) => void;
  selectedBrand?: string;
  setSelectedBrand?: (brand: string) => void;
  priceRange?: [number, number];
  setPriceRange?: (range: [number, number]) => void;
  onApply?: () => void;
  searchResultsCount?: number;
}

const FilterProductsModal: React.FC<SearchPageProps> = ({
  showFilterModal,
  setShowFilterModal,
  searchResultsCount,
  selectedCategory: externalCategory,
  setSelectedCategory: externalSetCategory,
  selectedColor: externalColor,
  setSelectedColor: externalSetColor,
  selectedSize: externalSize,
  setSelectedSize: externalSetSize,
  selectedBrand: externalBrand,
  setSelectedBrand: externalSetBrand,
  priceRange: externalPrice,
  setPriceRange: externalSetPrice,
  onApply,
}) => {
  // Formatter kept separate from the `price` slider state below.
  const format = usePrice();

  const [localCategory, setLocalCategory] = useState('الكل');
  const [localColor, setLocalColor] = useState('');
  const [localSize, setLocalSize] = useState('');
  const [localBrand, setLocalBrand] = useState('');
  const [localPrice, setLocalPrice] = useState<[number, number]>([150, 2500]);
  const [fetchCategoriesLoading, setFetchCategoriesLoading] = useState(false);

const [categoriesOptions, setCategoriesOptions] = useState<{ label: string; value: string }[]>([]);
  const category = externalCategory ?? localCategory;
  const setCategory = externalSetCategory ?? setLocalCategory;
  const color = externalColor ?? localColor;
  const setColor = externalSetColor ?? setLocalColor;
  const size = externalSize ?? localSize;
  const setSize = externalSetSize ?? setLocalSize;
  const brand = externalBrand ?? localBrand;
  const setBrand = externalSetBrand ?? setLocalBrand;
  const price = externalPrice ?? localPrice;
  const setPrice = externalSetPrice ?? setLocalPrice;

  const [openCategory, setOpenCategory] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);

  const fetchCategories = async () => {
    try {
      setFetchCategoriesLoading(true);
      const res = await api.get('/categories');
      const categories = res.data || [];
      const fetchedCategoriesOptions = await categories.map((c: any) => ({
        label: c.title,
        value: c._id,
      }));


      setCategoriesOptions([
        { label: 'الكل', value: 'الكل' },
        ...fetchedCategoriesOptions
      ]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setFetchCategoriesLoading(false);
    }
  }; 
  const handleApply = () => {
    onApply?.();
    setShowFilterModal(false);
  
  };

  const handleReset = () => {
    setCategory('الكل');
    setColor('');
    setSize('');
    setBrand('');
    setPrice([150, 2500]);
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <Modal
      visible={showFilterModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View className="bg-surface flex-1 rounded-t-2xl p-4 relative">
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          nestedScrollEnabled={true}   // ✅ allows nested scrolling on Android
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-primary-100">
            <TouchableOpacity onPress={handleReset} className="flex-row items-center gap-2">
              <Ionicons name="repeat-outline" size={18} color={COLORS.inactive} />
              <Text className="text-sm font-base font-body text-primary-700">إعادة تعيين</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close-outline" size={24} color={COLORS.inactive} />
            </TouchableOpacity>
          </View>

          {/* ===== Category ===== */}
          <View className="mb-8">
            <View className="border-r-2 border-primary-700 mb-8">
              <Text className="font-tajwal mr-4 text-2xl text-body font-bold text-right">
                التصفية حسب الفئات
              </Text>
            </View>
            <View className="flex-row gap-4 mx-4 self-end">
              <DropDownPicker
                open={openCategory}
                value={category}
                items={categoriesOptions}
                setOpen={setOpenCategory}
                setValue={setCategory as any}
                setItems={() => {}}
                listMode="SCROLLVIEW"
                placeholder="اختر الفئة"
                loading={fetchCategoriesLoading}
                style={{
                  borderColor: '#7a5b14',
                  borderWidth: 1,
                  borderRadius: 8,
                }}
                textStyle={{
                  fontFamily: 'tajwal-medium',
                  fontSize: 16,
                  color: COLORS.primary,
                  textAlign: 'right',
                }}
                dropDownContainerStyle={{
                  borderColor: COLORS.primary,
                  borderWidth: 1,
                  borderRadius: 8,
                }}
                listItemContainerStyle={{
                  borderBottomColor: COLORS.inactive,
                  borderBottomWidth: 1,
                }}
                listItemLabelStyle={{
                  fontFamily: 'tajwal-medium',
                  fontSize: 16,
                  color: '#201b16',
                }}
              />
            </View>
          </View>

          {/* ===== Color ===== */}
          <View className="mb-8">
            <View className="border-r-2 border-primary-700 mb-8">
              <Text className="font-tajwal mr-4 text-2xl text-body font-bold text-right">
                التصفية حسب اللون
              </Text>
            </View>
            <View className="flex-row gap-4 mx-4 self-end mb-8 flex-wrap">
              {colorOptions.map((c, index) => (
                <TouchableOpacity
                  onPress={() => setColor(c)}
                  key={index}
                  style={{
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 2,
                    borderColor: color === c ? COLORS.active : COLORS.inactive,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {color === c && <Ionicons name="checkmark-sharp" color="#785920" size={14} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setColor('')}
                style={{
                  borderWidth: color === '' ? 3 : 2,
                  borderColor: color === '' ? COLORS.primary : COLORS.inactive,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#f5ede4',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text className="text-xs font-tajwal text-primary">الكل</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ===== Brands ===== */}
          <View className="mb-8">
            <View className="border-r-2 border-primary-700 mb-8">
              <Text className="font-tajwal mr-4 text-2xl text-body font-bold text-right">
                العلامات التجارية
              </Text>
            </View>
            <View className="flex-col self-end gap-3 p-4 rounded-lg">
              <DropDownPicker
                open={openBrand}
                value={brand}
                items={brandsOptions}
                setOpen={setOpenBrand}
                setValue={setBrand as any}
                setItems={() => {}}
                listMode="SCROLLVIEW"
                placeholder="اختر العلامات التجارية"
                style={{
                  borderColor: '#7a5b14',
                  borderWidth: 1,
                  borderRadius: 8,
                }}
                textStyle={{
                  fontFamily: 'tajwal-medium',
                  fontSize: 16,
                  color: COLORS.primary,
                  textAlign: 'right',
                }}
                dropDownContainerStyle={{
                  borderColor: COLORS.primary,
                  borderWidth: 1,
                  borderRadius: 8,
                }}
                listItemContainerStyle={{
                  borderBottomColor: COLORS.inactive,
                  borderBottomWidth: 1,
                }}
                listItemLabelStyle={{
                  fontFamily: 'tajwal-medium',
                  fontSize: 16,
                  color: '#201b16',
                }}
              />
            </View>
          </View>

          {/* ===== Price Range ===== */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between border-r-2 border-primary-700 mb-8">
              <Text className="font-tajwal mr-4 text-xl leading-7 text-accent font-bold text-left">
                {format(price[1])} - {format(price[0])}
              </Text>
              <Text className="font-tajwal mr-4 text-2xl leading-7 text-body font-bold text-right">
                نطاق السعر
              </Text>
            </View>
            <View className="flex-1 mx-auto">
              <MultiSlider
                values={price}
                min={0}
                max={5000}
                step={50}
                onValuesChange={(values) => setPrice(values as [number, number])}
                selectedStyle={{ backgroundColor: '#785920' }}
                unselectedStyle={{ backgroundColor: '#d1c5b4' }}
                markerStyle={{ backgroundColor: '#785920', width: 24, height: 24 }}
                trackStyle={{ height: 4, width: '100%' }}
              />
              <View className="flex-row items-end justify-between">
                <Text className="text-body text-sm font-tajwal">{format(0)}</Text>
                <Text className="text-body text-right text-sm font-tajwal">+{format(5000)}</Text>
              </View>
            </View>
          </View>
{category === 'ملابس' && (
  <View className="mb-12">
    <View className="border-r-2 border-primary-700 mb-8">
      <Text className="font-tajwal mr-4 text-2xl text-body font-bold text-right">
        المقاس
      </Text>
    </View>
    <View className="flex justify-end flex-row gap-3 p-3 flex-wrap">
      {sizesOptions.map((s, index) => (
        <TouchableWithoutFeedback
          key={index}
          onPress={() => setSize(s.value)}
        >
          <View
            style={{
              backgroundColor: size === s.value ? '#b89354' : '#d1c5b4',
              borderColor: '#fcf9f1',
              borderWidth: 1,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text
              className={`font-tajwal text-base ${
                size === s.value ? 'text-white' : 'text-inactive'
              }`}
            >
              {s.label}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      ))}
    </View>
  </View>
)}
        
        </ScrollView>

        {/* Footer */}
        <View className="bg-[#fcf9f1]/90 py-4 px-6 border-t border-t-primary-100 flex-row justify-between items-center">
          <TouchableOpacity
            onPress={handleApply}
            className="px-12 py-3 bg-[#785920] rounded-full justify-center items-center"
          >
            <Text className="text-white text-lg font-bold font-tajwal leading-7">
              تطبيق الفلاتر
            </Text>
          </TouchableOpacity>

          <View className="items-end">
            <Text className="text-[#4c4542] text-[10px] font-tajwal">النتائج</Text>
            <Text className="text-accent text-base font-tajwal"> قطعة {searchResultsCount}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterProductsModal;