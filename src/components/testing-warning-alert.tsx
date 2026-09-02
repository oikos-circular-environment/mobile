import { TriangleAlert } from "lucide-react-native";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";

export function TestingWarningAlert() {
	return (
		<Alert className="border-amber-200 bg-amber-50 items-start">
			<AlertIcon as={TriangleAlert} className="text-amber-600" />
			<AlertText className="text-amber-800 font-medium">
				A versão está aberta para testes e os dados são totalmente ilustrativos
				e que atualmente não há nenhuma parceria com empresa pública, privada ou
				com coletores.
			</AlertText>
		</Alert>
	);
}
