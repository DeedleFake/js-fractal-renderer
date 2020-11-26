// @format

export const copyObject = <T extends Record<string, any>>(obj: T): T =>
	Object.entries(obj).reduce(
		(nobj, [k, v]) => ({
			...nobj,
			[k]: v,
		}),
		{} as T,
	)

export const getElements = (
	...ids: Array<string>
): Record<string, HTMLElement> =>
	ids.reduce((obj, id) => ({ ...obj, [id]: document.getElementById(id) }), {})
