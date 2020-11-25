// @format

import ShaderRenderer from './ShaderRenderer'
import fragmentTemplate from 'underscore-template-loader!./fragment.glsl'

const ZoomSpeed = 1.1
const ShaderVersion = 300

const fragmentShader = fragmentTemplate({
	shaderVersion: ShaderVersion,
	samples: 4,
	maxIterations: 1500,
	iterHueAdjust: 800,
	threshold: 4,
})
console.dir(fragmentShader)

const canvas = document.getElementById('screen') as HTMLCanvasElement
const renderer = new ShaderRenderer(
	canvas.getContext('webgl2'),
	fragmentShader,
	{
		shaderVersion: ShaderVersion,
	},
)

const reset = document.getElementById('reset')

;(() => {
	let offset: [number, number], height: number
	let dragFrom: [number, number] = null

	const render = async (
		offset: [number, number],
		height: number,
	): Promise<void> =>
		await renderer.render({
			resolution: new Float32Array([canvas.width, canvas.height]),
			seed: new Date().getTime(),

			offset: new Float32Array(offset),
			height,
		})

	const swToFW = (w: number): number => (w / canvas.width) * height
	const shToFH = (h: number): number => (h / canvas.height) * height

	const getMouseCoords = (ev: MouseEvent): [number, number] => {
		const bounds = canvas.getBoundingClientRect()
		return [
			((ev.clientX - bounds.x) * canvas.width) / bounds.width,
			((bounds.height - (ev.clientY - bounds.y)) * canvas.height) /
				bounds.height,
		]
	}

	const startDrag = (ev: MouseEvent): void => {
		ev.preventDefault()

		dragFrom = getMouseCoords(ev)
	}

	const mouseDrag = (ev: MouseEvent): void => {
		if (dragFrom == null) {
			return
		}

		ev.preventDefault()

		const dragTo = getMouseCoords(ev)
		const drag = [dragTo[0] - dragFrom[0], dragTo[1] - dragFrom[1]]

		offset = [offset[0] - swToFW(drag[0]), offset[1] - shToFH(drag[1])]
		render(offset, height)

		dragFrom = dragTo
	}

	const stopDrag = (ev: MouseEvent): void => {
		ev.preventDefault()

		dragFrom = null
	}

	const zoom = (ev: WheelEvent): void => {
		ev.preventDefault()

		if (dragFrom != null) {
			return
		}

		switch (true) {
			case ev.deltaY < 0:
				height /= ZoomSpeed
				offset = [
					offset[0] + swToFW(canvas.width / 2),
					offset[1] + shToFH(canvas.height / 2),
				]
				break

			case ev.deltaY > 0:
				height *= ZoomSpeed
				break

			default:
				return
		}

		render(offset, height)
	}

	const resetImage = (): void => {
		//offset = [-0.5557506, -0.5556]
		//height = .000000001
		offset = [-1.5, -1]
		height = 2

		render([-1.5, -1], 2)
	}

	canvas.addEventListener('mousedown', startDrag)
	canvas.addEventListener('mousemove', mouseDrag)
	canvas.addEventListener('mouseup', stopDrag)
	//canvas.addEventListener('wheel', zoom)

	reset.addEventListener('click', resetImage)

	resetImage()
})()
