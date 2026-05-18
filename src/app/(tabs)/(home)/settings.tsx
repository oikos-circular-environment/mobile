import { type Href, Link } from "expo-router";
import {
	ArrowRight,
	CrownIcon,
	FactoryIcon,
	LogOutIcon,
	type LucideIcon,
	RecycleIcon,
	SproutIcon,
} from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/libs/utils";

type SettingsOption = {
	title: string;
	description: string;
	icon: LucideIcon;
	is_premium: boolean;
	highlight: boolean;
	link: Href;
};

export default function SettingsScreen() {
	const { signOut } = useAuthContext();

	const settingsOptions: SettingsOption[] = [
		{
			title: "Planos",
			description: "Descubra como podemos agregar valor ao seu negócio!",
			icon: CrownIcon,
			is_premium: false,
			highlight: true,
			link: "/plans",
		},
		{
			title: "Para empresas",
			description: "Gerencie suas empresas, produtos e serviços",
			icon: FactoryIcon,
			is_premium: true,
			highlight: false,
			link: "/(tabs)/(home)/companies",
		},
		{
			title: "Para coletores",
			description:
				"Para coletores independentes, gerencie suas coletas e ganhos",
			icon: RecycleIcon,
			is_premium: false,
			highlight: false,
			link: "/(tabs)/(home)/collectors",
		},
		{
			title: "Seja um patrocinador",
			description:
				"Patrocine a plataforma e ajude a manter os serviços gratuitos para todos os usuários",
			icon: SproutIcon,
			is_premium: false,
			highlight: false,
			link: "/(tabs)/(home)/sponsors",
		},
	];

	return (
		<ScrollView className="flex-1 p-4 bg-white">
			<View className="flex flex-col gap-8">
				<View className="flex  flex-col justify-between">
					<View className="flex flex-1 flex-col gap-2">
						{settingsOptions.map(option => (
							<Link href={option.link} key={option.title}>
								<Card
									key={option.title}
									className={cn(
										"flex flex-row flex-1 gap-2 items-center shadow-none",
										option.highlight ? "bg-primary" : "bg-white",
									)}
								>
									<View className="flex justify-center items-center p-2">
										<option.icon
											color={cn(option.highlight ? "white" : "black")}
											size={32}
											strokeWidth={1}
										/>
									</View>
									<View className="flex-1">
										<Heading
											className={cn(
												"text-xl ",
												option.highlight ? "text-white" : "text-black",
											)}
										>
											{option.title}
										</Heading>
										<Text
											className={cn(
												"text-muted ",
												option.highlight ? "text-white" : "text-black",
											)}
										>
											{option.description}
										</Text>
									</View>
									<View className="flex items-center p-2">
										<ArrowRight
											className="self-end"
											color={cn(option.highlight ? "white" : "black")}
										/>
									</View>
								</Card>
							</Link>
						))}
						<Pressable onPress={signOut}>
							<Card
								className={cn(
									"flex flex-row flex-1 gap-2 items-center shadow-none bg-red-100 border-red-100 mt-6",
								)}
							>
								<View className="flex justify-center items-center">
									<LogOutIcon color={"red"} size={18} />
								</View>
								<Heading className="text-xl font-semibold text-red-500">
									Desconectar
								</Heading>
							</Card>
						</Pressable>
					</View>
				</View>
			</View>
		</ScrollView>
	);
}
