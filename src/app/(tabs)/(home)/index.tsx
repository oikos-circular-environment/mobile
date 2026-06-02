import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { ArrowUpRightIcon, SettingsIcon } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import OikosLogo from "@/assets/icons/icon.png";
import { colors } from "@/components/style/colors";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useAuthContext } from "@/contexts/auth-context";
import { createCompanies } from "@/libs/factories/create-companies";

export default function HomeScreen() {
	const marketCompanies = createCompanies(5);
	const { user, isAuthenticated, isLoading } = useAuthContext();
	const router = useRouter();
	const contentOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (isAuthenticated && user === null) {
			toast.warning(
				"Finalize seu cadastro",
				"Para mantermos um lugar seguro, precisamos que preencha as informações.",
			);
			router.push("/(tabs)/(home)/profile");
		}
	});

	useEffect(() => {
		if (!isLoading) {
			Animated.timing(contentOpacity, {
				toValue: 1,
				duration: 400,
				useNativeDriver: true,
			}).start();
		} else {
			contentOpacity.setValue(0);
		}
	}, [isLoading, contentOpacity]);

	return (
		<ScrollView className="flex-1 p-4 bg-white">
			<View className="flex flex-col gap-4">
				{isLoading ? (
					<Card className="flex flex-row gap-4 shadow-none items-center">
						<HStack space="xs" className="flex flex-1 items-center">
							<Skeleton variant="rounded" className="w-12 h-12 mr-2" />
							<View className="flex-1">
								<SkeletonText _lines={2} gap={1} className="h-4 w-full" />
							</View>
						</HStack>
					</Card>
				) : (
					<Animated.View style={{ opacity: contentOpacity }}>
						{isAuthenticated && user ? (
							<Card className="flex flex-row gap-4 shadow-none">
								<Link href="/(tabs)/(home)/profile" asChild>
									<Pressable className="flex flex-1 flex-row gap-4">
										<Image
											source={
												user.profile.profile_image
													? user.profile.profile_image.url
													: OikosLogo
											}
											style={{
												width: 40,
												height: 40,
												borderRadius: 4,
											}}
										/>
										<View className="flex flex-col flex-1">
											<Heading numberOfLines={1}>
												{user.profile.display_name}
											</Heading>
											<Text className="text-muted-foreground">
												{`${user.profile.address?.street}, ${user.profile.address?.number}`}
											</Text>
										</View>
									</Pressable>
								</Link>
								<View className="flex flex-row gap-2 items-center">
									{/* <Link href="/(tabs)/(home)/notifications" asChild>
										<Button variant="secondary" size="icon">
											<BellIcon size={12} />
										</Button>
									</Link> */}
									<Link href="/(tabs)/(home)/settings" asChild>
										<Button variant="secondary" size="icon">
											<SettingsIcon size={18} />
										</Button>
									</Link>
								</View>
							</Card>
						) : (
							<Link href="/sign-in">
								<Card className="flex flex-row justify-between shadow-none bg-secondary">
									<View className="flex-1">
										<Heading className="text-2xl">Bem-Vindos a Oikos!</Heading>
										<Text className="text-muted-foreground">
											Estamos felizes de você estar aqui conosco, colabore com o
											nosso ecosistema
										</Text>
									</View>
									<Card className="bg-primary items-center justify-center">
										<ArrowUpRightIcon color={colors.white} />
									</Card>
								</Card>
							</Link>
						)}
					</Animated.View>
				)}
			</View>
		</ScrollView>
	);
}
