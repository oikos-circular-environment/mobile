import UserImage from "@/assets/images/mock/user-mock-image.png";
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16, borderBlockColor: 'gray', borderWidth: 1, borderRadius: 8, padding: 16 }}>
        <Image
          source={UserImage}
          style={{ width: 48, height: 48, borderRadius: 8 }}
        />
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Christian Cesar Rodrigues Santos</Text>
          <Text style={{ fontSize: 16, color: 'gray' }}>Rondonópolis - MT</Text>
        </View>
      </View>

      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-xl font-bold text-blue-500">
          Welcome to Nativewind!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
