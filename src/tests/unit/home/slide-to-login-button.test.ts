import { shouldCompleteSlide } from "@/components/home/slide-to-login-button";

describe("shouldCompleteSlide", () => {
	it("não completa quando a trilha ainda não foi medida (maxTranslate = 0)", () => {
		expect(shouldCompleteSlide(0, 0)).toBe(false);
	});

	it("não completa quando o arrasto fica abaixo do limiar padrão", () => {
		expect(shouldCompleteSlide(50, 100)).toBe(false);
	});

	it("completa quando o arrasto atinge o limiar padrão", () => {
		expect(shouldCompleteSlide(72, 100)).toBe(true);
		expect(shouldCompleteSlide(100, 100)).toBe(true);
	});

	it("respeita um limiar customizado", () => {
		expect(shouldCompleteSlide(60, 100, 0.5)).toBe(true);
		expect(shouldCompleteSlide(40, 100, 0.5)).toBe(false);
	});
});
