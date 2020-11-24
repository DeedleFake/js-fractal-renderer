import Color from 'color'

import Complex from './complex'

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
		return 'rgba(255, 255, 255, 255)'
	}

	return `hsl(${(iter / IterHueAdjust) * check}, 1, .5)`
}
