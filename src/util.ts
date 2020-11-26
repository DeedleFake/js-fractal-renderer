// @format

export const getElements = (
	...ids: Array<string>
): Record<string, HTMLElement> =>
	ids.reduce((obj, id) => ({ ...obj, [id]: document.getElementById(id) }), {})
