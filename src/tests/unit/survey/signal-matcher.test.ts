import { networkTelemetryBus } from "@/libs/network-telemetry-bus";
import { createTaskSignalWatcher } from "@/libs/survey/signal-matcher";
import { uiEventBus } from "@/libs/ui-event-bus";

describe("createTaskSignalWatcher", () => {
	it("modo any conclui no primeiro sinal casado", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "any",
				signals: [
					{
						kind: "api",
						method: "POST",
						path_pattern: "/v1/users/register",
						status: 204,
					},
				],
			},
			onComplete,
		);

		networkTelemetryBus.emit({
			method: "POST",
			path: "/v1/users/register",
			status: 204,
		});

		expect(onComplete).toHaveBeenCalledTimes(1);
		watcher.dispose();
	});

	it("um sinal que não casa nunca conclui a tarefa por conta própria", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "any",
				signals: [
					{
						kind: "api",
						method: "POST",
						path_pattern: "/v1/users/register",
						status: 204,
					},
				],
			},
			onComplete,
		);

		networkTelemetryBus.emit({
			method: "POST",
			path: "/v1/users/register",
			status: 500,
		});
		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/companies",
			status: 200,
		});

		expect(onComplete).not.toHaveBeenCalled();
		watcher.dispose();
	});

	it("casa padrões de rota com parâmetro (:id)", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "any",
				signals: [
					{
						kind: "api",
						method: "PUT",
						path_pattern: "/v1/companies/:id/addresses",
						status: 200,
					},
				],
			},
			onComplete,
		);

		networkTelemetryBus.emit({
			method: "PUT",
			path: "/v1/companies/abc123/addresses",
			status: 200,
		});

		expect(onComplete).toHaveBeenCalledTimes(1);
		watcher.dispose();
	});

	it("modo all só conclui quando todos os sinais ocorreram", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "all",
				signals: [
					{
						kind: "api",
						method: "PUT",
						path_pattern: "/v1/profiles",
						status: 200,
					},
					{
						kind: "api",
						method: "PUT",
						path_pattern: "/v1/profiles/avatar",
						status: 200,
					},
				],
			},
			onComplete,
		);

		networkTelemetryBus.emit({
			method: "PUT",
			path: "/v1/profiles",
			status: 200,
		});
		expect(onComplete).not.toHaveBeenCalled();

		networkTelemetryBus.emit({
			method: "PUT",
			path: "/v1/profiles/avatar",
			status: 200,
		});
		expect(onComplete).toHaveBeenCalledTimes(1);
		watcher.dispose();
	});

	it("respeita o casamento por parâmetro de busca (query true = presente, string = igual)", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "any",
				signals: [
					{
						kind: "api",
						method: "GET",
						path_pattern: "/v1/complaints/map",
						status: 200,
						query: { waste_category_id: true },
					},
				],
			},
			onComplete,
		);

		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/complaints/map",
			status: 200,
			query: {},
		});
		expect(onComplete).not.toHaveBeenCalled();

		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/complaints/map",
			status: 200,
			query: { waste_category_id: "5" },
		});
		expect(onComplete).toHaveBeenCalledTimes(1);
		watcher.dispose();
	});

	it("casa query com { not }: exige presente e diferente do valor padrão", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "any",
				signals: [
					{
						kind: "api",
						method: "GET",
						path_pattern: "/v1/market",
						status: 200,
						query: { radius: { not: "2000" } },
					},
				],
			},
			onComplete,
		);

		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/market",
			status: 200,
			query: { radius: "2000" },
		});
		expect(onComplete).not.toHaveBeenCalled();

		networkTelemetryBus.emit({
			method: "GET",
			path: "/v1/market",
			status: 200,
			query: { radius: "5000" },
		});
		expect(onComplete).toHaveBeenCalledTimes(1);
		watcher.dispose();
	});

	it("casa sinal de chegada de tela (screen)", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{ mode: "any", signals: [{ kind: "screen", route: "/market" }] },
			onComplete,
		);

		watcher.notifyScreen("/complaints");
		expect(onComplete).not.toHaveBeenCalled();

		watcher.notifyScreen("/market");
		expect(onComplete).toHaveBeenCalledTimes(1);
		watcher.dispose();
	});

	it("casa sinal de tela com segmento dinâmico ([param])", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "any",
				signals: [{ kind: "screen", route: "/market/[companyId]" }],
			},
			onComplete,
		);

		watcher.notifyScreen("/market");
		expect(onComplete).not.toHaveBeenCalled();

		watcher.notifyScreen("/market/3fa85f64-5717-4562-b3fc-2c963f66afa6");
		expect(onComplete).toHaveBeenCalledTimes(1);
		watcher.dispose();
	});

	it("casa sinal de evento de UI (kind: event) por nome e payload", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "any",
				signals: [
					{
						kind: "event",
						name: "complaint.opened",
						payload: { source: "list" },
					},
				],
			},
			onComplete,
		);

		uiEventBus.emit({ name: "complaint.opened", payload: { source: "map" } });
		expect(onComplete).not.toHaveBeenCalled();

		uiEventBus.emit({ name: "complaint.opened", payload: { source: "list" } });
		expect(onComplete).toHaveBeenCalledTimes(1);
		watcher.dispose();
	});

	it("dispose para de escutar novos sinais", () => {
		const onComplete = jest.fn();
		const watcher = createTaskSignalWatcher(
			{
				mode: "any",
				signals: [
					{
						kind: "api",
						method: "POST",
						path_pattern: "/v1/users/register",
						status: 204,
					},
				],
			},
			onComplete,
		);

		watcher.dispose();
		networkTelemetryBus.emit({
			method: "POST",
			path: "/v1/users/register",
			status: 204,
		});

		expect(onComplete).not.toHaveBeenCalled();
	});
});
