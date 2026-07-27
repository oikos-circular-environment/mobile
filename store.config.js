/**
 * @file Store config do EAS Metadata para a App Store. É a fonte de verdade da
 *   ficha, das informações de revisão e dos screenshots do iOS — publicados por
 *   `eas metadata:push`.
 *
 * É um config dinâmico (e não `store.config.json`) por dois motivos: as notas da
 * versão e o contato vêm de `store/shared/`, compartilhados com a Google Play; e
 * as credenciais da conta de demonstração vêm do ambiente, para não ficarem
 * versionadas.
 *
 * @see docs/publishing-path.md — "Publicação na App Store"
 */

const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const SHARED_DIR = join(__dirname, "store", "shared");
const SCREENSHOTS_DIR = join("store", "ios", "screenshots");

/**
 * @param {string} relativePath Caminho relativo a `store/shared/`.
 * @returns {string}
 */
function readShared(relativePath) {
	return readFileSync(join(SHARED_DIR, relativePath), "utf-8").trim();
}

/**
 * @returns {string} A `version` de `app.config.ts`.
 */
function getExpoVersion() {
	const output = execFileSync(
		"npx",
		["expo", "config", "--json", "--type", "public"],
		{ encoding: "utf-8" },
	);
	return JSON.parse(output).version;
}

/**
 * @param {string} displayType
 * @param {string[]} fileNames Na ordem em que aparecem na ficha.
 * @returns {string[]}
 */
function screenshots(displayType, fileNames) {
	return fileNames.map(fileName =>
		join(SCREENSHOTS_DIR, displayType, fileName),
	);
}

module.exports = () => {
	const version = getExpoVersion();
	const contact = JSON.parse(readShared("contact.json"));

	return {
		configVersion: 0,
		apple: {
			version,
			copyright: "2026 Christian Cesar Rodrigues Santos",
			release: {
				automaticRelease: true,
			},
			categories: ["UTILITIES", "EDUCATION"],
			info: {
				"pt-BR": {
					title: "Oikos Economia Circular",
					subtitle: "Economia circular de resíduos",
					promoText:
						"Denuncie ocorrências ambientais com foto e localização, vote com a comunidade e encontre empresas de reciclagem perto de você.",
					description:
						"Oikos é uma plataforma de economia circular que conecta pessoas, comunidades e empresas na proteção do meio ambiente.\n\nDENUNCIE OCORRÊNCIAS AMBIENTAIS\nEncontrou descarte irregular de resíduos, poluição ou outro problema ambiental na sua região? Registre a ocorrência em segundos: tire fotos ou grave vídeos, marque a localização exata no mapa e descreva o problema. Sua denúncia fica visível para toda a comunidade.\n\nACOMPANHE E VOTE COM A COMUNIDADE\nVeja no mapa as denúncias já registradas perto de você, acompanhe o status de cada uma (em aberto, em resolução, resolvida) e vote se um problema já foi solucionado. O sistema de votação da comunidade garante que o encerramento de uma denúncia reflita o consenso de quem vive na região.\n\nENCONTRE EMPRESAS DE RECICLAGEM E COLETA\nBusque empresas parceiras por proximidade e descubra quais materiais e serviços cada uma aceita ou oferece — de recicláveis comuns a resíduos que exigem cuidados especiais, classificados conforme o grau de periculosidade (ABNT NBR 10004). Consulte endereço, horário de funcionamento e formas de contato direto (telefone e WhatsApp).\n\nSIMULE VALORES ANTES DE NEGOCIAR\nMonte uma simulação com os itens e quantidades que você quer descartar ou vender e veja o valor estimado antes de fechar negócio com uma empresa parceira.\n\nJunte-se à Oikos e ajude a construir uma economia mais circular e um ambiente mais limpo para todos.",
					keywords: [
						"reciclagem",
						"economia circular",
						"meio ambiente",
						"denuncia",
						"sustentabilidade",
						"coleta",
						"residuos",
						"ecologia",
					],
					releaseNotes: readShared(join("whats-new", `${version}.md`)),
					supportUrl: contact.supportUrl,
					privacyPolicyUrl: "https://oikos.company/politica-de-privacidade",
					screenshots: {
						APP_IPHONE_65: screenshots("APP_IPHONE_65", [
							"01-home.jpg",
							"02-complaints-map.jpg",
							"03-companies-waste-points.jpg",
							"04-company-waste-point-detail.jpg",
							"05-user-companies-list.jpg",
							"06-user-logged.jpg",
							"07-signin.jpg",
							"08-signup.jpg",
						]),
						APP_IPAD_PRO_3GEN_129: screenshots("APP_IPAD_PRO_3GEN_129", [
							"01-home.jpg",
							"02-home2.jpg",
							"03-complaints-points.jpg",
							"04-companies.jpg",
							"05-company-waste.jpg",
							"06-company-waste-detail.jpg",
							"07-signin.jpg",
							"08-signup.jpg",
						]),
					},
				},
			},
			advisory: {
				ageRatingOverride: "NONE",
				ageRatingOverrideV2: "NONE",
				koreaAgeRatingOverride: "NONE",
				alcoholTobaccoOrDrugUseOrReferences: "NONE",
				contests: "NONE",
				gambling: false,
				gamblingSimulated: "NONE",
				horrorOrFearThemes: "NONE",
				kidsAgeBand: null,
				lootBox: false,
				matureOrSuggestiveThemes: "NONE",
				medicalOrTreatmentInformation: "NONE",
				profanityOrCrudeHumor: "NONE",
				sexualContentGraphicAndNudity: "NONE",
				sexualContentOrNudity: "NONE",
				unrestrictedWebAccess: false,
				violenceCartoonOrFantasy: "NONE",
				violenceRealistic: "NONE",
				violenceRealisticProlongedGraphicOrSadistic: "NONE",
				advertising: false,
				ageAssurance: false,
				developerAgeRatingInfoUrl: null,
				gunsOrOtherWeapons: "NONE",
				healthOrWellnessTopics: false,
				messagingAndChat: false,
				parentalControls: false,
				userGeneratedContent: true,
			},
			review: {
				firstName: "Christian Cesar",
				lastName: "Rodrigues Santos",
				email: contact.email,
				phone: "+5565999151997",
				demoRequired: true,
				demoUsername: process.env.ASC_DEMO_ACCOUNT_NAME,
				demoPassword: process.env.ASC_DEMO_ACCOUNT_PASSWORD,
				notes:
					"O app não exige login para navegar no mapa de denúncias e no marketplace de empresas de reciclagem (Market). O login é obrigatório apenas para: registrar uma nova denúncia, votar na resolução de uma denúncia e publicar uma resolução.\n\nPara testar o fluxo completo, é necessário conceder permissão de localização (usada para marcar a ocorrência no mapa) e de câmera/microfone (usada para anexar fotos e vídeos à denúncia).",
			},
		},
	};
};
