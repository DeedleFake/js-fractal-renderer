// @format

export const copyObject = <T extends Record<string, any>>(obj: T): T =>
	Object.entries(obj).reduce(
		(nobj, [k, v]) => ({
			...nobj,
			[k]: v,
		}),
		{} as T,
	)
