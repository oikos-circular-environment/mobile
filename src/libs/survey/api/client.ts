import type { AppRouter } from "@oikos-circular-environment/survey-api/routers/index";
import { createTRPCClient, httpLink } from "@trpc/client";

export const surveyClient = createTRPCClient<AppRouter>({
	links: [
		httpLink({
			url: `${process.env.EXPO_PUBLIC_SURVEY_BASE_URL}/api/trpc`,
			headers: () => ({
				"x-client-key": process.env.EXPO_PUBLIC_SURVEY_CLIENT_API_KEY ?? "",
			}),
		}),
	],
});
