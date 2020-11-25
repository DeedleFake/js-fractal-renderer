// @format

import Color from 'color'

import * as Config from '../config'
import Complex from '../complex'

import { Message } from './index'

const ctx = (self as unknown) as import('worker-loader!').default<
	Response,
	Args
>

const mandelbrotIter = (c: Complex): [number, number] => {
	let check = 0
	let iter = 0
	let prev = c
	for (; iter < Config.MaxIterations && check <= Config.Threshold; iter++) {
		check = prev.real * prev.real + prev.imag * prev.imag
		prev = Complex.add(Complex.mult(prev, prev), c)
	}
	return [check, iter]
}

const mandelbrotColor = (check: number, iter: number): Color => {
	if (check <= Config.Threshold) {
		return Color.rgb(255, 255, 255, 255)
	}

	return Color.hsl(
		((iter / Config.IterHueAdjust) * check * 180) / Math.PI,
		100,
		50,
	)
}

const setPix = (row: Uint8Array, x: number, col: Color) => {
	const [r, g, b] = col.rgb().array()

	const i = x * 4
	row[i] = r
	row[i + 1] = g
	row[i + 2] = b
	row[i + 3] = 255
}

const renderRow = (
	img: { width: number; height: number },
	position: Complex,
	height: number,
	y: number,
): Uint8Array => {
	const row = new Uint8Array(img.width * 4)

	for (let x = 0; x < img.width; x++) {
		const xy = new Complex(x, y)

		let r = 0,
			g = 0,
			b = 0
		for (let i = 0; i < Config.Samples; i++) {
			const shifted = Complex.add(xy, new Complex(Math.random(), Math.random()))
			const c = Complex.add(
				Complex.mult(
					new Complex(shifted.real / img.width, shifted.imag / img.height),
					height,
				),
				position,
			)

			const [check, iter] = mandelbrotIter(c)
			const [sr, sg, sb] = mandelbrotColor(check, iter).array()

			r += sr
			g += sg
			b += sb
		}

		setPix(
			row,
			x,
			Color.rgb(
				r / Config.Samples,
				g / Config.Samples,
				b / Config.Samples,
			),
		)
	}

	return row
}

export type Args = {
	img: { width: number; height: number }
	position: Complex
	height: number
	y: number
}

export type Response = Uint8Array

ctx.addEventListener(
	'message',
	({
		data: {
			id,
			data: { img, position, height, y },
		},
	}: MessageEvent<Message<Args>>) => {
		const row = renderRow(img, position, height, y)
		ctx.postMessage({ id, data: row })
	},
)
