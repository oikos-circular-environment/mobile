/**
 * @file Verifica a resolução dos dados de release em `store/` e a fronteira
 *   entre o que é configurado no EAS e o que os scripts próprios injetam.
 */

import { getSubmitProfile } from "../../../store/scripts/lib/expo-config.mjs";
import {
	RELEASE_NOTES_MAX_LENGTH,
	readContact,
	readStoreJson,
	readWhatsNew,
	whatsNewPath,
} from "../../../store/scripts/lib/store-config.mjs";

const VERSION = "1.0.3";

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
});

describe("fronteira entre EAS e scripts próprios", () => {
	it("mantém trilha do Android só no eas.json", () => {
		const release = readStoreJson("android/release.json");
		expect(getSubmitProfile("android").track).toBeDefined();
		expect(release).not.toHaveProperty("track");
		expect(release).not.toHaveProperty("status");
		expect(release).not.toHaveProperty("userFraction");
	});

	it("aponta o EAS Metadata para o store config dinâmico", () => {
		expect(getSubmitProfile("ios").metadataPath).toBe("./store.config.js");
	});
});
