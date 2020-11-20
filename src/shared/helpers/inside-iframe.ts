export function insideIframe(): boolean {
	try {
		return window.self !== window.top;
	} catch (e) {
		return true;
	}
}
