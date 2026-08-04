import { render, screen, userEvent } from "@testing-library/react-native";
import { TaskCard } from "@/components/survey/task-card";

const checklist = [
	{ id: "1", label: "Criar uma conta", status: "done" as const },
	{ id: "2", label: "Fazer login", status: "current" as const },
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
				onQuit={jest.fn()}
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
				onQuit={jest.fn()}
			/>,
		);

		await user.press(screen.getByText("Pausar"));

		expect(onPause).toHaveBeenCalledTimes(1);
	});

	it("chama onQuit ao pressionar Desistir", async () => {
		const user = userEvent.setup();
		const onQuit = jest.fn();
		await render(
			<TaskCard
				currentTask={3}
				totalTasks={7}
				elapsedLabel="02:41"
				instruction="Instrução"
				checklist={checklist}
				onPause={jest.fn()}
				onQuit={onQuit}
			/>,
		);

		await user.press(screen.getByText("Desistir"));

		expect(onQuit).toHaveBeenCalledTimes(1);
	});

	it("não exibe nenhum botão de autodeclaração de sucesso ou falha", async () => {
		await render(
			<TaskCard
				currentTask={3}
				totalTasks={7}
				elapsedLabel="02:41"
				instruction="Instrução"
				checklist={checklist}
				onPause={jest.fn()}
				onQuit={jest.fn()}
			/>,
		);

		expect(screen.queryByText(/consegui/i)).not.toBeOnTheScreen();
		expect(screen.queryByText(/não consegui/i)).not.toBeOnTheScreen();
		expect(screen.getAllByRole("button")).toHaveLength(2);
	});

	it("troca Desistir por Próximo quando todas as tarefas foram concluídas", async () => {
		const user = userEvent.setup();
		const onNext = jest.fn();
		await render(
			<TaskCard
				currentTask={7}
				totalTasks={7}
				elapsedLabel="06:47"
				instruction="Instrução"
				checklist={checklist}
				allTasksCompleted
				onPause={jest.fn()}
				onQuit={jest.fn()}
				onNext={onNext}
			/>,
		);

		expect(screen.queryByText("Desistir")).not.toBeOnTheScreen();
		await user.press(screen.getByText("Próximo"));
		expect(onNext).toHaveBeenCalledTimes(1);
	});
});
