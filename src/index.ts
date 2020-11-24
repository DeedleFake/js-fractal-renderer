import Color from 'color'

import Complex from './complex'
import {linearToRGB, rgbToLinear} from './linear'

const Samples = 10
const MaxIterations = 1500
const IterHueAdjust = 800

const mandelbrotIter = (c: Complex) => {
	let check = 0
	let iter = 0
	let prev = c
	for (; iter < MaxIterations && check <= 4; iter++) {
		check = prev.real * prev.real + prev.imag * prev.imag
		prev = Complex.add(Complex.mult(prev, prev), c)
	}
	return [check, iter]
}

const mandelbrotColor = (check: number, iter: number) => {
	if (check <= 4) {
		return Color.rgb(255, 255, 255, 255)
	}

	return Color.hsl((iter / IterHueAdjust) * check, 1, 0.5)
}

const setPix = (img: ImageData, x: number, y: number, col: Color) => {
	const [r, g, b] = col.array()

	const i = pixOffset(img, x, y)
	img.data[i] = r
	img.data[i + 1] = g
	img.data[i + 2] = b
	img.data[i + 3] = 255
}

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
		for (let i = 0; i < Samples; i++) {
			const shifted = Complex.add(xy, new Complex(Math.random(), Math.random()))
			const c = Complex.add(
				Complex.mult(new Complex(shifted.real / img.width, shifted.imag / img.height), height),
				position,
			)

			const [check, iter] = mandelbrotIter(c)
			const [cr, cg, cb] = mandelbrotColor(check, iter).array()

			r += rgbToLinear(cr)
			g += rgbToLinear(cg)
			b += rgbToLinear(cb)
		}

		setPix(
			img,
			x,
			y,
			Color.rgb(
				linearToRGB(r / Samples),
				linearToRGB(g / Samples),
				linearToRGB(b / Samples),
			),
		)
	}
}

const render = (img: ImageData, position: Complex, height: number) => {
	for (let y = 0; y < img.height; y++) {
		renderRow(img, position, height, y)
	}

	console.log('Rendering finished.')
}

const pixOffset = (img: ImageData, x: number, y: number) =>
	y * (img.width * 4) + x * 4

const redraw = (x: number, y: number, zoom: number) => {
	const canvas = document.getElementById('screen') as HTMLCanvasElement
	const ctx = canvas.getContext('2d')

	const img = ctx.createImageData(canvas.width, canvas.height)
	render(img, new Complex(x, y), zoom)
	ctx.putImageData(img, 0, 0)
}

redraw(-0.5557506, -0.5556, 0.000000001)

declare global {
	interface Window {
		MR: any
	}
}

window.MR = {
	redraw,
}
