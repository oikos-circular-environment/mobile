import type { Item } from "./item";
import type { ValueMapping } from "./value-mapping";

// ? Acredito que a melhor forma não seja criar o resíduo como um item, mas listar as categorias de resíduos e os materiais vinculados a esta categoria. Desta forma, a empresa pode escolher quais categorias de resíduos ela trabalha e os materiais vinculados a esta categoria. Além disso, o serviço de coleta de resíduos pode ser vinculado a uma categoria de resíduo, e não a um material específico, já que a empresa pode coletar vários materiais dentro da mesma categoria de resíduo. Por exemplo, uma empresa pode coletar plástico, papel e metal, mas não vidro. Desta forma, o serviço de coleta de resíduos seria vinculado à categoria de resíduo "Reciclável", e não ao material específico "Plástico".

export type wasteType = "RECYCLABLE" | "GARBAGE";

export const wasteTypes: ValueMapping<wasteType>[] = [
	{ value: "RECYCLABLE", label: "Reciclável" },
	{ value: "GARBAGE", label: "Não Reciclável" },
];

export type Waste = Item;
