import { TriangleAlert } from "lucide-react-native";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";

export function TestingWarningAlert() {
	return (
		<Alert variant="warning" className="items-start">
			<AlertIcon as={TriangleAlert} />
			<AlertText>
				A versão está aberta para testes e os dados são totalmente ilustrativos
				e que atualmente não há nenhuma parceria com empresa pública, privada ou
				com coletores.
			</AlertText>
		</Alert>
	);
}
