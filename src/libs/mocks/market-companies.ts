import type {
	BusinessHour,
	DayOfWeek,
	TimeSlot,
} from "@/libs/types/business-hour";
import type { Company } from "@/libs/types/companies";
import type { Service } from "@/libs/types/service";
import type { Waste } from "@/libs/types/waste";

const wasteItems: Waste[] = [
	{
		id: "waste-aluminio",
		name: "Alumínio",
		description: "Lata, aerossol, panelas, garrafas",
		price: 8,
		unit: "KG",
		wasteType: "RECYCLABLE",
		sub_items: ["lata", "aerossol", "panelas", "garrafas"],
	},
	{
		id: "waste-ferro",
		name: "Ferro",
		description: "Panela de pressão, ferramentas, peças automotivas",
		price: 0.4,
		unit: "KG",
		wasteType: "RECYCLABLE",
		sub_items: ["panela de pressão", "ferramentas", "peças automotivas"],
	},
	{
		id: "waste-cobre",
		name: "Cobre",
		description: "Fios",
		price: 40,
		unit: "KG",
		wasteType: "RECYCLABLE",
		sub_items: ["fios"],
	},
];

const serviceItems: Service[] = [
	{
		id: "service-limpeza",
		name: "Limpeza de terreno",
		description: "Carpinação",
		price: 2,
		quantity: 1,
		unit: "M2",
		observations: null,
		sub_items: ["capina", "retirada de resíduos leves"],
		wasteType: "GARBAGE",
	},
	{
		id: "service-jardinagem",
		name: "Jardinagem",
		description: "Carpinação",
		price: 2,
		quantity: 1,
		unit: "M2",
		observations: null,
		sub_items: ["capina", "podas pequenas"],
		wasteType: "GARBAGE",
	},
];

const weekOrder: DayOfWeek[] = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
];

const buildTimeSlot = (
	companyKey: string,
	day: DayOfWeek,
	index: number,
	startTime: string,
	endTime: string,
): TimeSlot => ({
	id: `${companyKey}-${day}-slot-${index}`,
	startTime,
	endTime,
});

const buildBusinessHours = (
	companyKey: string,
	config: Partial<
		Record<DayOfWeek, { is_open: boolean; slots: Array<[string, string]> }>
	>,
): BusinessHour[] => {
	return weekOrder.map(day => {
		const dayConfig = config[day] ?? { is_open: false, slots: [] };

		return {
			id: `${companyKey}-${day}`,
			dayOfWeek: day,
			is_open: dayConfig.is_open,
			timeSlots: dayConfig.slots.map((slot, index) =>
				buildTimeSlot(companyKey, day, index + 1, slot[0], slot[1]),
			),
		};
	});
};

export const marketCompaniesMock: Company[] = [
	{
		id: "grupo-alemao",
		identity: "09438591000158",
		identityType: "CNPJ",
		companyType: "COMPANY",
		status: true,
		isHeadquarters: true,
		businessName: "Sucatão do Alemão Allan Ramos Thurow",
		corporateName: "Grupo Alemão",
		acceptAppointments: true,
		email: "contato@grupoalemao.com",
		phones: ["(66) 3427-1510"],
		address: {
			id: "address-grupo-alemao",
			street: "Av. Valter Farias Ribeiro",
			number: "653",
			complement: null,
			district: "Parque Sagrada Família",
			city: "Rondonópolis",
			state: "Mato Grosso",
			stateAcronym: "MT",
			zipCode: "78735-338",
			latitude: -16.482,
			longitude: -54.65,
		},
		startedActivityIn: new Date("2016-02-09"),
		businessHours: buildBusinessHours("grupo-alemao", {
			MONDAY: {
				is_open: true,
				slots: [
					["07:00", "11:00"],
					["13:00", "17:00"],
				],
			},
			TUESDAY: {
				is_open: true,
				slots: [
					["07:00", "11:00"],
					["13:00", "17:00"],
				],
			},
			WEDNESDAY: {
				is_open: true,
				slots: [
					["07:00", "11:00"],
					["13:00", "17:00"],
				],
			},
			THURSDAY: {
				is_open: true,
				slots: [
					["07:00", "11:00"],
					["13:00", "17:00"],
				],
			},
			FRIDAY: {
				is_open: true,
				slots: [
					["07:00", "11:00"],
					["13:00", "17:00"],
				],
			},
			SATURDAY: {
				is_open: true,
				slots: [["08:00", "12:00"]],
			},
			SUNDAY: {
				is_open: false,
				slots: [],
			},
		}),
		waste: wasteItems,
		services: serviceItems,
	},
	{
		id: "sucatao-do-dinao",
		identity: "26723876000103",
		identityType: "CNPJ",
		companyType: "COMPANY",
		status: true,
		isHeadquarters: true,
		businessName: "Sucatão do Dinão",
		corporateName: "Sucatão do Dinão",
		acceptAppointments: false,
		email: "contato@sucataododinao.com",
		phones: ["(66) 99999-8899"],
		address: {
			id: "address-sucatao-dinao",
			street: "Rua Paraíba",
			number: "210",
			complement: null,
			district: "Jardim Tropical",
			city: "Rondonópolis",
			state: "Mato Grosso",
			stateAcronym: "MT",
			zipCode: "78700-100",
			latitude: -16.48,
			longitude: -54.62,
		},
		startedActivityIn: new Date("2018-05-18"),
		businessHours: buildBusinessHours("sucatao-do-dinao", {
			MONDAY: {
				is_open: true,
				slots: [["08:00", "18:00"]],
			},
			TUESDAY: {
				is_open: true,
				slots: [["08:00", "18:00"]],
			},
			WEDNESDAY: {
				is_open: true,
				slots: [["08:00", "18:00"]],
			},
			THURSDAY: {
				is_open: true,
				slots: [["08:00", "18:00"]],
			},
			FRIDAY: {
				is_open: true,
				slots: [["08:00", "17:30"]],
			},
			SATURDAY: {
				is_open: true,
				slots: [["08:00", "12:00"]],
			},
			SUNDAY: {
				is_open: false,
				slots: [],
			},
		}),
		waste: wasteItems,
		services: serviceItems,
	},
	{
		id: "henrique-flores",
		identity: "08479942111",
		identityType: "CPF",
		companyType: "COLLECTOR",
		status: true,
		isHeadquarters: true,
		businessName: "Henrique Flores",
		corporateName: "Henrique Flores",
		acceptAppointments: true,
		email: "henrique.flores@oikos.com",
		phones: ["(66) 99666-4444"],
		address: {
			id: "address-henrique",
			street: "Rua das Acácias",
			number: "120",
			complement: "Casa",
			district: "Centro",
			city: "Rondonópolis",
			state: "Mato Grosso",
			stateAcronym: "MT",
			zipCode: "78710-010",
			latitude: -16.47,
			longitude: -54.64,
		},
		startedActivityIn: new Date("2021-03-10"),
		businessHours: buildBusinessHours("henrique-flores", {
			MONDAY: {
				is_open: true,
				slots: [["07:00", "17:00"]],
			},
			TUESDAY: {
				is_open: true,
				slots: [["07:00", "17:00"]],
			},
			WEDNESDAY: {
				is_open: true,
				slots: [
					["07:00", "11:00"],
					["13:00", "17:00"],
				],
			},
			THURSDAY: {
				is_open: true,
				slots: [["07:00", "17:00"]],
			},
			FRIDAY: {
				is_open: true,
				slots: [["07:00", "17:00"]],
			},
			SATURDAY: {
				is_open: true,
				slots: [["08:00", "11:00"]],
			},
			SUNDAY: {
				is_open: false,
				slots: [],
			},
		}),
		waste: wasteItems,
		services: serviceItems,
	},
];

export const getMarketCompanyById = (companyId: string) =>
	marketCompaniesMock.find(company => company.id === companyId);
