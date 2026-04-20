import {
  ShieldCheckIcon,
  ShieldQuestionMarkIcon,
  ShieldXIcon,
} from "lucide-react-native";
import { View } from "react-native";
import type { ComplaintStatus } from "@/libs/types/complaint";

interface ComplaintStatusProps {
  status: ComplaintStatus;
}
export function ComplaintStatusComponent({ status }: ComplaintStatusProps) {
  switch (status) {
    case "resolved":
      return (
        <View className="items-center gap-2 rounded-md bg-lime-100 p-1">
          <ShieldCheckIcon size={12} strokeWidth={2.5} color="#3F6212" />
        </View>
      );
    case "pending":
      return (
        <View className="items-center gap-2 rounded-md bg-amber-100 p-1">
          <ShieldQuestionMarkIcon size={12} strokeWidth={2.5} color="#FE9A00" />
        </View>
      );
    case "canceled":
      return (
        <View className="items-center gap-2 rounded-md bg-red-100 p-1">
          <ShieldXIcon size={12} strokeWidth={2.5} color="#991B1B" />
        </View>
      );
  }
}
