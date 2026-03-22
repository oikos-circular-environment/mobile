import { fakerPT_BR as faker } from "@faker-js/faker";
import { Company, CompanyType, IdentityType } from "../types/companies";


export const createCompanies = (count: number): Company[] => {
  return Array.from({ length: count }, () => ({
    id: faker.database.mongodbObjectId(),
    corporateName: faker.company.name(),
    businessName: faker.company.name(),
    acceptAppointments: faker.datatype.boolean(),
    email: faker.internet.email(),
    phones: [faker.phone.number({ style: "national" })],
    companyType: faker.helpers.arrayElement(["ONG", "COMPANY", "GOVERNMENT", "COLLECTOR"]) as CompanyType,
    identityType: faker.helpers.arrayElement(["CPF", "CNPJ"]) as IdentityType,
    identity: faker.number.int({ min: 10000000000, max: 99999999999 }).toString(), // Mock de CPF/CNPJ
    status: faker.datatype.boolean(),
    isHeadquarters: faker.datatype.boolean(),
    startedActivityIn: faker.date.past({ years: 20 }), // Data aleatória nos últimos 20 anos
    businessHours: [],
    address: {
      id: faker.database.mongodbObjectId(),
      street: faker.location.streetAddress(),
      number: faker.location.buildingNumber(),
      city: faker.location.city(),
      state: faker.location.state(),
      stateAcronym: faker.location.state({ abbreviated: true }),
      district: faker.location.county(),
      zipCode: faker.location.zipCode("#####-###"),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      complement: "",
    },
  }));
}
