// Garante que os screenshots versionados em store/ios/ continuam dentro da
// spec da Apple. Um arquivo fora de tamanho só falharia hoje no meio do
// workflow de produção, depois do build — e a versão ficaria pela metade na
// App Store Connect.

import { join } from "node:path";
import {
	collectScreenshots,
	DISPLAY_TYPES,
	readImageSize,
	validateScreenshots,
} from "../../../scripts/lib/asc-screenshots.mjs";

const SCREENSHOTS_DIR = join(
	__dirname,
	"..",
	"..",
	"..",
	"store",
	"ios",
	"screenshots",
);

describe("screenshots da App Store", () => {
	const sets = collectScreenshots(SCREENSHOTS_DIR);

	it("encontra pelo menos um display type com imagens", () => {
		expect(sets.length).toBeGreaterThan(0);
	});

	it("usa apenas display types conhecidos e dimensões aceitas pela Apple", () => {
		expect(validateScreenshots(sets)).toEqual([]);
	});

	it("respeita o limite de 10 imagens por display type", () => {
		for (const set of sets) {
			expect(set.files.length).toBeLessThanOrEqual(10);
		}
	});

	it("ordena os arquivos pelo prefixo numérico, que vira a ordem na ficha", () => {
		for (const set of sets) {
			const names = set.files.map(
				(file: string) => file.split("/").pop() as string,
			);
			expect(names).toEqual([...names].sort());
			for (const name of names) {
				expect(name).toMatch(/^\d{2}-/);
			}
		}
	});

	it("lê as dimensões reais dos arquivos", () => {
		const iphone = sets.find(
			(set: { displayType: string }) => set.displayType === "APP_IPHONE_65",
		);
		expect(iphone).toBeDefined();
		expect(readImageSize(iphone.files[0])).toEqual({
			width: 1242,
			height: 2688,
		});
	});

	it("rejeita um arquivo fora de spec", () => {
		const problems = validateScreenshots([
			{
				displayType: "APP_IPHONE_65",
				files: [
					join(
						SCREENSHOTS_DIR,
						"..",
						"pendentes",
						"complaints-map-590x1280-fora-de-spec.jpg",
					),
				],
			},
		]);
		expect(problems).toHaveLength(1);
		expect(problems[0]).toContain("590x1280");
	});

	it("rejeita display type desconhecido", () => {
		const problems = validateScreenshots([
			{ displayType: "APP_WATCH_ULTRA", files: [] },
		]);
		expect(problems[0]).toContain("Display type desconhecido");
		expect(Object.keys(DISPLAY_TYPES)).toContain("APP_IPAD_PRO_3GEN_129");
	});
});
