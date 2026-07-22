export const roundCoord = (value: number, decimals = 4): number =>
	Math.round(value * 10 ** decimals) / 10 ** decimals;
