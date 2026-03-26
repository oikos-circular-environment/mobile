import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs tintColor="#3d6300">
      <NativeTabs.Trigger name="(market)">
        <Icon
          sf={{
            default: "dollarsign.circle",
            selected: "dollarsign.circle.fill",
          }}
        />
        <Label>Mercado</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(complaints)">
        <Icon sf={{ default: "shield", selected: "shield.fill" }} />
        <Label>Denunciar</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(home)">
        <Icon sf={{ default: "leaf", selected: "leaf.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(donations)">
        <Icon sf={{ default: "globe", selected: "globe" }} />
        <Label>Doações</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(learn)">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>Aprender</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
