/**
 * @file Verifica a resolução dos dados de release em `store/`, em especial a
 *   precedência entre o texto comum às duas lojas e o override por loja.
 */

import {
	RELEASE_NOTES_MAX_LENGTH,
	readContact,
	readStoreJson,
	readWhatsNew,
	whatsNewPath,
} from "../../../scripts/lib/store-config.mjs";

const VERSION = "1.0.1";

describe("dados de release compartilhados", () => {
	it("expõe o mesmo contato para as duas lojas", () => {
		const contact = readContact();
		expect(contact.email).toMatch(/@/);
		expect(contact.supportUrl).toMatch(/^https:\/\//);
		expect(contact.website).toMatch(/^https:\/\//);
	});

	it("resolve as notas da versão a partir de shared quando não há override", () => {
		expect(whatsNewPath(VERSION, "ios")).toBe(
			`store/shared/whats-new/${VERSION}.md`,
		);
		expect(whatsNewPath(VERSION, "android")).toBe(
			`store/shared/whats-new/${VERSION}.md`,
		);
		expect(readWhatsNew(VERSION, "ios")).toBe(readWhatsNew(VERSION, "android"));
	});

	it("mantém as notas dentro do limite da Google, o mais restritivo dos dois", () => {
		expect(readWhatsNew(VERSION, "android").length).toBeLessThanOrEqual(
			RELEASE_NOTES_MAX_LENGTH,
		);
	});

	it("devolve vazio para uma versão sem arquivo de notas", () => {
		expect(readWhatsNew("0.0.0-inexistente", "ios")).toBe("");
	});

	it("não repete em cada loja o que já está em shared", () => {
		const reviewDetails = readStoreJson("ios/review-details.json");
		const metadata = readStoreJson("ios/metadata.pt-BR.json");
		expect(reviewDetails).not.toHaveProperty("contactEmail");
		expect(metadata).not.toHaveProperty("supportUrl");
	});

	it("configura a trilha do Android com status válido", () => {
		const release = readStoreJson("android/release.json");
		expect(["completed", "inProgress", "draft", "halted"]).toContain(
			release.status,
		);
		if (release.status === "inProgress") {
			expect(release.userFraction).toBeGreaterThan(0);
			expect(release.userFraction).toBeLessThanOrEqual(1);
		} else {
			expect(release.userFraction).toBeUndefined();
		}
	});
});
