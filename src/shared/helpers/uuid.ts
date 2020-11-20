export function isUuid(id: string) {
	return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/g.test(
		id
	);
}

export function generateRandomId() {
	return Math.random().toString().substring(2, 15);
}
