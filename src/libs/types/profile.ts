import type { Address } from "./address";
import type { Attachment } from "./attachement";

export type Profile = {
	user_id: string;
	full_name: string;
	display_name: string;
	cpf: string;
	phone: string;
	is_collector: boolean;
	id: string;
	created_at: Date;
	updated_at: Date;
	address: Address | null;
	profile_image: Attachment | null;
};
