import { render, screen, userEvent } from "@testing-library/react-native";
import { TaskCard } from "@/components/survey/task-card";

const checklist = [
	{ id: "1", label: "Criar uma conta", status: "done" as const },
	{ id: "2", label: "Fazer login", status: "current" as const },
];

const resolvedChecklist = [
	{ id: "1", label: "Criar uma conta", status: "done" as const },
	{ id: "2", label: "Fazer login", status: "abandoned" as const },
];

describe("TaskCard — componente", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("exibe a instrução e a lista de tarefas da etapa", async () => {
		await render(
			<TaskCard
				currentTask={3}
				totalTasks={7}
				elapsedLabel="02:41"
				instruction="Acesse a área de perfil e preencha seus dados."
				checklist={checklist}
				onPause={jest.fn()}
				onAbandonSuite={jest.fn()}
				onSkipTask={jest.fn()}
				onAbandonTask={jest.fn()}
			/>,
		);

		expect(
			screen.getByText("Acesse a área de perfil e preencha seus dados."),
		).toBeOnTheScreen();
		expect(screen.getByText("Criar uma conta")).toBeOnTheScreen();
		expect(screen.getByText("Fazer login")).toBeOnTheScreen();
	});

	it("chama onPause ao pressionar Pausar", async () => {
		const user = userEvent.setup();
		const onPause = jest.fn();
		await render(
			<TaskCard
				currentTask={3}
				totalTasks={7}
				elapsedLabel="02:41"
				instruction="Instrução"
				checklist={checklist}
				onPause={onPause}
				onAbandonSuite={jest.fn()}
				onSkipTask={jest.fn()}
				onAbandonTask={jest.fn()}
			/>,
		);

		await user.press(screen.getByText("Pausar"));

		expect(onPause).toHaveBeenCalledTimes(1);
	});

	it("chama onAbandonSuite ao pressionar o botão de rodapé Abandonar (troca de lugar com Próximo)", async () => {
		const user = userEvent.setup();
		const onAbandonSuite = jest.fn();
		await render(
			<TaskCard
				currentTask={3}
				totalTasks={7}
				elapsedLabel="02:41"
				instruction="Instrução"
				checklist={checklist}
				onPause={jest.fn()}
				onAbandonSuite={onAbandonSuite}
				onSkipTask={jest.fn()}
				onAbandonTask={jest.fn()}
			/>,
		);

		// Um único botão "Abandonar" no rodapé (o mesmo que vira "Próximo" quando
		// tudo é resolvido) — não confundir com o "Abandonar" inline da tarefa atual.
		const abandonButtons = screen.getAllByText("Abandonar");
		expect(abandonButtons).toHaveLength(2);
		await user.press(abandonButtons[abandonButtons.length - 1] as never);

		expect(onAbandonSuite).toHaveBeenCalledTimes(1);
	});

	it("chama onSkipTask ao pressionar Pular, inline logo abaixo da tarefa atual", async () => {
		const user = userEvent.setup();
		const onSkipTask = jest.fn();
		await render(
			<TaskCard
				currentTask={3}
				totalTasks={7}
				elapsedLabel="02:41"
				instruction="Instrução"
				checklist={checklist}
				onPause={jest.fn()}
				onAbandonSuite={jest.fn()}
				onSkipTask={onSkipTask}
				onAbandonTask={jest.fn()}
			/>,
		);

		await user.press(screen.getByText("Pular"));

		expect(onSkipTask).toHaveBeenCalledTimes(1);
	});

	it("chama onAbandonTask ao pressionar o Abandonar inline da tarefa atual", async () => {
		const user = userEvent.setup();
		const onAbandonTask = jest.fn();
		await render(
			<TaskCard
				currentTask={3}
				totalTasks={7}
				elapsedLabel="02:41"
				instruction="Instrução"
				checklist={checklist}
				onPause={jest.fn()}
				onAbandonSuite={jest.fn()}
				onSkipTask={jest.fn()}
				onAbandonTask={onAbandonTask}
			/>,
		);

		const abandonButtons = screen.getAllByText("Abandonar");
		expect(abandonButtons).toHaveLength(2);
		await user.press(abandonButtons[0] as never);

		expect(onAbandonTask).toHaveBeenCalledTimes(1);
	});

	it("não exibe nenhum botão de autodeclaração de sucesso — só desistência (pular/abandonar)", async () => {
		await render(
			<TaskCard
				currentTask={3}
				totalTasks={7}
				elapsedLabel="02:41"
				instruction="Instrução"
				checklist={checklist}
				onPause={jest.fn()}
				onAbandonSuite={jest.fn()}
				onSkipTask={jest.fn()}
				onAbandonTask={jest.fn()}
			/>,
		);

		expect(screen.queryByText(/^consegui$/i)).not.toBeOnTheScreen();
		expect(screen.queryByText(/^não consegui$/i)).not.toBeOnTheScreen();
		// Pular + Abandonar (tarefa) + Pausar + Abandonar (etapa)
		expect(screen.getAllByRole("button")).toHaveLength(4);
	});

	it("esconde os botões inline de Pular/Abandonar quando não há tarefa atual (tudo resolvido)", async () => {
		await render(
			<TaskCard
				currentTask={7}
				totalTasks={7}
				elapsedLabel="06:47"
				instruction="Instrução"
				checklist={resolvedChecklist}
				allTasksResolved
				onPause={jest.fn()}
				onNext={jest.fn()}
				onAbandonSuite={jest.fn()}
				onSkipTask={jest.fn()}
				onAbandonTask={jest.fn()}
			/>,
		);

		expect(screen.queryByText("Pular")).not.toBeOnTheScreen();
		expect(screen.queryByText("Abandonar")).not.toBeOnTheScreen();
		expect(screen.getByText("Próximo")).toBeOnTheScreen();
	});

	it("troca Abandonar por Próximo quando todas as tarefas foram resolvidas", async () => {
		const user = userEvent.setup();
		const onNext = jest.fn();
		await render(
			<TaskCard
				currentTask={7}
				totalTasks={7}
				elapsedLabel="06:47"
				instruction="Instrução"
				checklist={resolvedChecklist}
				allTasksResolved
				onPause={jest.fn()}
				onNext={onNext}
				onAbandonSuite={jest.fn()}
			/>,
		);

		expect(screen.queryByText("Abandonar")).not.toBeOnTheScreen();
		await user.press(screen.getByText("Próximo"));
		expect(onNext).toHaveBeenCalledTimes(1);
	});
});
