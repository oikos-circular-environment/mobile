/**
 * Texto do termo de consentimento exibido em F2.5, espelhando
 * mestrado/plans/tcle-walkthrough-oikos.md. Atualizar os dois juntos.
 */

export const CONSENT_TERM_VERSION = "2026-08-13";

export interface ConsentPerson {
	role: string;
	name: string;
	email: string;
}

export const CONSENT_IDENTIFICATION = {
	researchTitle:
		"Aspectos sociotécnicos de sistemas de informação para a economia circular de resíduos sólidos no Brasil",
	institution:
		"UNIPAMPA — Programa de Pós-Graduação em Engenharia de Software (PPGES), Mestrado",
	people: [
		{
			role: "Pesquisador responsável",
			name: "Christian Cesar Rodrigues Santos",
			email: "christiansantos.aluno@unipampa.edu.br",
		},
		{
			role: "Orientador",
			name: "Fábio Basso",
			email: "fabiobasso@unipampa.edu.br",
		},
		{
			role: "Orientador",
			name: "Maicon Bernardino",
			email: "maiconbernardino@unipampa.edu.br",
		},
	] satisfies ConsentPerson[],
};

export interface ConsentReference {
	label: string;
	value: string;
}

export const CONSENT_ETHICS_NOTE = {
	heading: "Aspectos éticos e Comitê de Ética em Pesquisa (CEP)",
	paragraph:
		"Esta avaliação não foi submetida ao Comitê de Ética em Pesquisa (CEP) por atender às condições de isenção previstas na Resolução nº 674/2022 do Conselho Nacional de Saúde (CNS) (Capítulo IX, Artigo 26, Inciso VII) e na Circular nº 17/2022/CONEP/SECNS/MS (Artigo 1º, Inciso VII). Os documentos completos podem ser consultados nos endereços abaixo — toque para copiar e cole no navegador do seu dispositivo:",
	references: [
		{
			label: "Resolução CNS nº 674/2022",
			value:
				"https://www.gov.br/conselho-nacional-de-saude/pt-br/atos-normativos/resolucoes/2022/resolucao-no-674.pdf/view",
		},
		{
			label: "Ofício Circular nº 17/2022/CONEP/SECNS/MS",
			value:
				"https://www.gov.br/conselho-nacional-de-saude/pt-br/camaras-tecnicas-e-comissoes/conep/legislacao/oficios-circulares/oficio-circular-no-17-de-5-de-julho-de-2022.pdf/view",
		},
	] satisfies ConsentReference[],
};

export interface ConsentSection {
	heading: string;
	paragraphs: string[];
}

export const CONSENT_SECTIONS: ConsentSection[] = [
	{
		heading: "Prezado(a) participante",
		paragraphs: [
			"Você está sendo convidado(a) a participar, como voluntário(a), de uma pesquisa acadêmica vinculada ao Programa de Pós-Graduação em Engenharia de Software da Universidade Federal do Pampa.",
			"Esta etapa é conduzida de forma autoadministrada, diretamente dentro do aplicativo Oikos: você realiza a avaliação sozinho(a), no seu próprio dispositivo e no momento de sua escolha, sem agendamento nem sessão presencial com o pesquisador.",
		],
	},
	{
		heading: "1. Objetivo da pesquisa",
		paragraphs: [
			"O objetivo desta etapa é avaliar a usabilidade do aplicativo Oikos por meio de um passo a passo com cenários de uso realistas, coletando sua percepção sobre a experiência de uso e sugestões de melhoria.",
		],
	},
	{
		heading: "2. Procedimentos",
		paragraphs: [
			"Toda a atividade acontece dentro do próprio aplicativo, sem entrevista ao vivo e sem formulário preenchido por outra pessoa: você escolhe um perfil e responde a uma breve caracterização, executa etapas guiadas seguindo tarefas exibidas em um indicador flutuante, e responde a um questionário curto ao final de cada etapa.",
			'O aplicativo mede sozinho se cada tarefa foi concluída e quanto tempo levou — não existe pergunta do tipo "você conseguiu?". Não há respostas certas ou erradas: o que está sendo avaliado é o aplicativo, não você.',
			"Você pode pausar e retomar quando quiser, inclusive em sessões de uso diferentes, e o tempo fora do aplicativo nunca é contado.",
		],
	},
	{
		heading: "3. Registro dos dados",
		paragraphs: [
			"O registro é automático: sinais de conclusão de tarefa detectados pelo próprio aplicativo, tempo de execução, suas respostas ao questionário e à caracterização inicial.",
			"Não serão realizadas gravações de áudio, vídeo ou tela, e nenhum dado é observado ou anotado manualmente por outra pessoa em tempo real. Os registros ficam no seu aparelho e são enviados ao servidor da pesquisa quando houver conexão, sem travar a sua participação.",
			"Todos os registros são associados exclusivamente ao seu código de participante, gerado automaticamente pelo sistema — seu nome não é solicitado em nenhuma etapa.",
		],
	},
	{
		heading: "4. Riscos",
		paragraphs: [
			"Os riscos são mínimos, equivalentes aos de usar qualquer aplicativo móvel no cotidiano: eventual desconforto ao não concluir uma tarefa (o app está sendo avaliado, não você), e o tempo dedicado à participação — que você controla, podendo pausar a qualquer momento.",
			"Nenhum dado pessoal identificável (nome, e-mail, documento) é solicitado dentro do aplicativo.",
		],
	},
	{
		heading: "5. Benefícios",
		paragraphs: [
			"Você terá a oportunidade de conhecer e experimentar uma plataforma inovadora voltada à economia circular de resíduos, contribuindo diretamente para o aprimoramento da ferramenta e para o avanço da pesquisa em sistemas de informação aplicados à economia circular.",
		],
	},
	{
		heading: "6. Sigilo e anonimato",
		paragraphs: [
			"Seus dados serão tratados de forma confidencial e usados exclusivamente para fins desta pesquisa. Você será identificado(a) apenas pelo grupo de persona (ex.: Coletor, Cidadão, Empresa) e pelo código de participante gerado pelo sistema.",
			"Os dados brutos serão mantidos por 5 (cinco) anos após a conclusão da pesquisa, conforme exigência do CEP, e então descartados de forma segura.",
		],
	},
	{
		heading: "7. Voluntariedade e direito de desistência",
		paragraphs: [
			"Sua participação é totalmente voluntária. Você pode interromper a qualquer momento, sem necessidade de justificativa e sem qualquer prejuízo, e pode solicitar a exclusão dos seus dados depois usando o código de participante, entrando em contato pelo e-mail do pesquisador.",
		],
	},
	{
		heading: "8. Custos e ressarcimento",
		paragraphs: [
			"A participação não envolve custos — acontece no seu próprio dispositivo, no momento de sua escolha. Não há remuneração pela participação.",
		],
	},
	{
		heading: "9. Resultados da pesquisa",
		paragraphs: [
			"Os resultados serão divulgados por meio da dissertação de mestrado e de publicações acadêmicas. Você pode solicitar acesso aos resultados a qualquer momento, entrando em contato com o pesquisador.",
		],
	},
	{
		heading: "10. Consentimento",
		paragraphs: [
			'Ao tocar em "Li e aceito" abaixo, você declara que leu e compreendeu as informações acima, está ciente dos objetivos, procedimentos, riscos e benefícios da pesquisa, e consente voluntariamente em participar, autorizando o registro automático dos dados da sua participação pelo aplicativo.',
		],
	},
];
