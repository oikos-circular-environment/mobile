import {
	getCurrentBusinessHour,
	isCompanyOpenNow,
} from "@/libs/market/is-company-open";
import type { MarketBusinessHour } from "@/libs/types/market";

// ---------------------------------------------------------------------------
// Fixtures extraídos do response real da API (11/jun/2026, quinta-feira)
// ---------------------------------------------------------------------------

const christianCesarHours: MarketBusinessHour[] = [
	{ id: "9c7d31f2", day_of_week: "SUNDAY", is_open: false, time_slots: [] },
	{
		id: "36643058",
		day_of_week: "MONDAY",
		is_open: true,
		time_slots: [
			{ id: "0334f711", start_time: "07:00", end_time: "11:00" },
			{ id: "ec5b3609", start_time: "13:00", end_time: "17:30" },
		],
	},
	{
		id: "c712d668",
		day_of_week: "TUESDAY",
		is_open: true,
		time_slots: [{ id: "8348a02d", start_time: "07:00", end_time: "17:30" }],
	},
	{
		id: "c3660291",
		day_of_week: "WEDNESDAY",
		is_open: true,
		time_slots: [{ id: "ba5b0ac5", start_time: "07:00", end_time: "17:30" }],
	},
	{
		id: "aa6dea71",
		day_of_week: "THURSDAY",
		is_open: true,
		time_slots: [{ id: "cbeb42f8", start_time: "07:00", end_time: "17:30" }],
	},
	{
		id: "c2e82ef3",
		day_of_week: "FRIDAY",
		is_open: true,
		time_slots: [{ id: "39aa5584", start_time: "07:00", end_time: "17:00" }],
	},
	{
		id: "eaec2298",
		day_of_week: "SATURDAY",
		is_open: true,
		time_slots: [{ id: "4a033746", start_time: "07:00", end_time: "12:00" }],
	},
];

const oikosHours: MarketBusinessHour[] = [
	{ id: "52c66131", day_of_week: "SUNDAY", is_open: false, time_slots: [] },
	{
		id: "93c14c2f",
		day_of_week: "MONDAY",
		is_open: true,
		time_slots: [
			{ id: "26fcf57c", start_time: "07:00", end_time: "11:00" },
			{ id: "6e3e6d38", start_time: "13:00", end_time: "17:30" },
		],
	},
	{
		id: "f9d3d4ef",
		day_of_week: "TUESDAY",
		is_open: true,
		time_slots: [{ id: "eb45c391", start_time: "07:00", end_time: "17:30" }],
	},
	{
		id: "7c4c04ef",
		day_of_week: "WEDNESDAY",
		is_open: false,
		time_slots: [{ id: "e39a887c", start_time: "07:00", end_time: "17:30" }],
	},
	{
		id: "7f04c62c",
		day_of_week: "THURSDAY",
		is_open: false,
		time_slots: [{ id: "53c9d5e6", start_time: "07:00", end_time: "17:30" }],
	},
	{
		id: "4d0527a2",
		day_of_week: "FRIDAY",
		is_open: false,
		time_slots: [{ id: "2cfa0cba", start_time: "07:00", end_time: "17:00" }],
	},
	{
		id: "a5c1f762",
		day_of_week: "SATURDAY",
		is_open: false,
		time_slots: [{ id: "277348c2", start_time: "07:00", end_time: "12:00" }],
	},
];

// 11/jun/2026 (quinta-feira) 10:48 — cenário do bug report
const thu_10h48 = new Date(2026, 5, 11, 10, 48, 0);

// ---------------------------------------------------------------------------
// Testes com dados reais da API
// ---------------------------------------------------------------------------

describe("isCompanyOpenNow — dados reais da API", () => {
	it("Christian Cesar: THURSDAY is_open=true → retorna true às 10:48", () => {
		expect(isCompanyOpenNow(christianCesarHours, thu_10h48)).toBe(true);
	});

	it("Oikos Economia Circular: THURSDAY is_open=false → retorna false às 10:48 (cadastro fechado no backend)", () => {
		expect(isCompanyOpenNow(oikosHours, thu_10h48)).toBe(false);
	});

	it("Christian Cesar: MONDAY tem dois turnos — aberto às 08:00", () => {
		const mon_08h = new Date(2026, 5, 8, 8, 0, 0);
		expect(isCompanyOpenNow(christianCesarHours, mon_08h)).toBe(true);
	});

	it("Christian Cesar: MONDAY entre turnos (11:30) → fechado", () => {
		const mon_11h30 = new Date(2026, 5, 8, 11, 30, 0);
		expect(isCompanyOpenNow(christianCesarHours, mon_11h30)).toBe(false);
	});

	it("Christian Cesar: MONDAY segundo turno às 14:00 → aberto", () => {
		const mon_14h = new Date(2026, 5, 8, 14, 0, 0);
		expect(isCompanyOpenNow(christianCesarHours, mon_14h)).toBe(true);
	});

	it("Christian Cesar: SATURDAY aberto às 10:00", () => {
		const sat_10h = new Date(2026, 5, 13, 10, 0, 0);
		expect(isCompanyOpenNow(christianCesarHours, sat_10h)).toBe(true);
	});

	it("Christian Cesar: SATURDAY fechado após meio-dia (12:01)", () => {
		const sat_12h01 = new Date(2026, 5, 13, 12, 1, 0);
		expect(isCompanyOpenNow(christianCesarHours, sat_12h01)).toBe(false);
	});

	it("Christian Cesar: SUNDAY is_open=false → fechado", () => {
		const sun_10h = new Date(2026, 5, 7, 10, 0, 0);
		expect(isCompanyOpenNow(christianCesarHours, sun_10h)).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// Testes unitários da lógica central
// ---------------------------------------------------------------------------

describe("isCompanyOpenNow — lógica", () => {
	const thursdayOpen: MarketBusinessHour[] = [
		{
			id: "bh-thu",
			day_of_week: "THURSDAY",
			is_open: true,
			time_slots: [{ id: "ts-1", start_time: "07:00", end_time: "17:30" }],
		},
	];

	it("retorna true dentro do horário", () => {
		expect(isCompanyOpenNow(thursdayOpen, thu_10h48)).toBe(true);
	});

	it("retorna true exatamente na abertura (07:00)", () => {
		expect(isCompanyOpenNow(thursdayOpen, new Date(2026, 5, 11, 7, 0, 0))).toBe(
			true,
		);
	});

	it("retorna true exatamente no fechamento (17:30)", () => {
		expect(
			isCompanyOpenNow(thursdayOpen, new Date(2026, 5, 11, 17, 30, 0)),
		).toBe(true);
	});

	it("retorna false um minuto antes da abertura (06:59)", () => {
		expect(
			isCompanyOpenNow(thursdayOpen, new Date(2026, 5, 11, 6, 59, 0)),
		).toBe(false);
	});

	it("retorna false um minuto após o fechamento (17:31)", () => {
		expect(
			isCompanyOpenNow(thursdayOpen, new Date(2026, 5, 11, 17, 31, 0)),
		).toBe(false);
	});

	it("retorna false quando is_open=false mesmo com horário válido", () => {
		const closed = [{ ...thursdayOpen[0], is_open: false }];
		expect(isCompanyOpenNow(closed, thu_10h48)).toBe(false);
	});

	it("retorna false quando time_slots está vazio", () => {
		const noSlots = [{ ...thursdayOpen[0], time_slots: [] }];
		expect(isCompanyOpenNow(noSlots, thu_10h48)).toBe(false);
	});

	it("retorna false para array vazio", () => {
		expect(isCompanyOpenNow([], thu_10h48)).toBe(false);
	});

	it("retorna false para dia diferente do cadastrado", () => {
		const friday = new Date(2026, 5, 12, 10, 48, 0);
		expect(isCompanyOpenNow(thursdayOpen, friday)).toBe(false);
	});
});

describe("getCurrentBusinessHour", () => {
	it("retorna THURSDAY para data de quinta-feira", () => {
		expect(getCurrentBusinessHour(christianCesarHours, thu_10h48)).toEqual(
			christianCesarHours.find(h => h.day_of_week === "THURSDAY"),
		);
	});

	it("retorna null quando não há entrada para o dia", () => {
		const onlyThursday = christianCesarHours.filter(
			h => h.day_of_week === "THURSDAY",
		);
		const friday = new Date(2026, 5, 12, 10, 48, 0);
		expect(getCurrentBusinessHour(onlyThursday, friday)).toBeNull();
	});

	it("retorna null para array vazio", () => {
		expect(getCurrentBusinessHour([], thu_10h48)).toBeNull();
	});
});
