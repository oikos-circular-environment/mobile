import axios from "axios";

export const brasil_api = axios.create({
	baseURL: "https://brasilapi.com.br/api",
});
