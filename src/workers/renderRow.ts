// @format

import Color from 'color'

import * as Config from '../config'
import Complex from '../complex'

import { Message } from './index'

const mandelbrotIter = (c: Complex) => {
	let check = 0
	let iter = 0
	let prev = c
	for (; iter < Config.MaxIterations && check <= 4; iter++) {
		check = prev.real * prev.real + prev.imag * prev.imag
		prev = Complex.add(Complex.mult(prev, prev), c)
	}
	return [check, iter]
}

const mandelbrotColor = (check: number, iter: number) => {
	if (check <= 4) {
		return Color.rgb(255, 255, 255, 255)
	}

	return Color.hsl((iter / Config.IterHueAdjust) * check, 1, 0.5)
}

const setPix = (img: ImageData, x: number, y: number, col: Color) => {
	const [r, g, b] = col.array()

	const i = pixOffset(img, x, y)
	img.data[i] = r
	img.data[i + 1] = g
	img.data[i + 2] = b
	img.data[i + 3] = 255
}

const pixOffset = (img: ImageData, x: number, y: number) =>
	y * (img.width * 4) + x * 4

const renderRow = (
	img: ImageData,
	position: Complex,
	height: number,
	y: number,
) => {
	console.log(`Rendering row ${y}...`)

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
			const [cr, cg, cb] = mandelbrotColor(check, iter).array()

			//r += rgbToLinear(cr)
			//g += rgbToLinear(cg)
			//b += rgbToLinear(cb)
			r += cr
			g += cg
			b += cb
		}

		setPix(
			img,
			x,
			y,
			Color.rgb(
				//linearToRGB(r / Config.Samples),
				//linearToRGB(g / Config.Samples),
				//linearToRGB(b / Config.Samples),
				r / Config.Samples,
				g / Config.Samples,
				b / Config.Samples,
			),
		)
	}
}

export type Args = {
	img: ImageData
	position: Complex
	height: number
	y: number
}

addEventListener(
	'message',
	({
		data: {
			id,
			data: { img, position, height, y },
		},
	}: MessageEvent<Message<Args>>) => {
		renderRow(img, position, height, y)
		postMessage({ id })
	},
)
