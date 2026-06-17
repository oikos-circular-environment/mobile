declare global {
	// eslint-disable-next-line no-var
	var mockToastShow: (toast: {
		type: string;
		title: string;
		message: string;
	}) => void;
}

export {};
