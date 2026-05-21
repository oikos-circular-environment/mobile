export type Address = {
	id: string;
	street: string;
	number: string;
	complement: string | null;
	district: string;
	city_ibge_id: number;
	city: string;
	state_ibge_id: number;
	state: string;
	state_code: string;
	zip_code: string;
	latitude: number | null;
	longitude: number | null;
};
