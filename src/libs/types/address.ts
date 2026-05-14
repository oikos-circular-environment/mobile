export type Address = {
	id: string;
	street: string;
	number: string;
	complement: string | null;
	district: string;
	city: string;
	state: string;
	state_code: string;
	zip_code: string;
	latitude: number | null;
	longitude: number | null;
};
