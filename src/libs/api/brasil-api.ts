import axios from "axios";
import { client } from "../brasil-api-sdk/client.gen";

const baseURL = "https://brasilapi.com.br/api";

export const brasil_api = axios.create({
	baseURL,
});

client.setConfig({ baseURL, throwOnError: true });
