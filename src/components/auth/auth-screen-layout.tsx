import { Sparkles } from "lucide-react-native";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthScreenLayoutProps) {
  return (
    <ScrollView
      className="flex-1 bg-black"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="relative min-h-full flex-1 justify-center px-5 py-10">
        {/* <Image
          source={Background}
          resizeMode="cover"
          className="absolute inset-0 h-full w-full"
        />
        <BlurView intensity={45} tint="dark" className="absolute inset-0" /> */}

        <Card className="z-10 w-full self-center max-w-md gap-6 rounded-2xl border border-white/20 bg-black/70 p-5 shadow-none">
          <View className="gap-6">
            <View className="flex-row items-center gap-3">
              <Sparkles size={18} color="#f8fafc" />
              <View className="h-px flex-1 bg-white/20" />
            </View>
            <View className="gap-1">
              <Heading className="text-2xl text-white">{title}</Heading>
              <Text className="text-sm text-white/70">{subtitle}</Text>
            </View>
          </View>

          {children}
        </Card>

        {footer ? (
          <View className="z-10 mt-5 items-center">{footer}</View>
        ) : null}
      </View>
    </ScrollView>
  );
}
