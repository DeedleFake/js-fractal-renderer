// @format

import ShaderRenderer from './ShaderRenderer'
import fragmentTemplate from 'underscore-template-loader!./fragment.glsl'

import {copyObject} from './util'

const ZoomSpeed = 1.1
const ShaderVersion = 300

const fragmentShader = fragmentTemplate({
	shaderVersion: ShaderVersion,
})

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
	const defaultRenderOptions = {
		samples: 4,
		maxIterations: 1500,
		iterHueAdjust: 800,
		threshold: 4,

		//offset: [-0.5557506, -0.5556],
		//height: .000000001,
		offset: new Float32Array([-1.5, -1]),
		height: 2,
	}

	let renderOptions = copyObject(defaultRenderOptions)
	let dragFrom: [number, number] = null

	const render = async (): Promise<void> =>
		await renderer.render({
			...renderOptions,
			resolution: new Float32Array([canvas.width, canvas.height]),
			seed: new Date().getTime(),
		})

	const swToFW = (w: number): number =>
		(w / canvas.width) * renderOptions.height
	const shToFH = (h: number): number =>
		(h / canvas.height) * renderOptions.height

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

		renderOptions.offset = new Float32Array([
			renderOptions.offset[0] - swToFW(drag[0]),
			renderOptions.offset[1] - shToFH(drag[1]),
		])
		render()

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
				renderOptions.height /= ZoomSpeed
				//renderOptions.offset = [
				//	renderOptions.offset[0] + swToFW(canvas.width / 2),
				//	renderOptions.offset[1] + shToFH(canvas.height / 2),
				//]
				break

			case ev.deltaY > 0:
				renderOptions.height *= ZoomSpeed
				break

			default:
				return
		}

		render()
	}

	const resetImage = (): void => {
		renderOptions = copyObject(defaultRenderOptions)
		render()
	}

	canvas.addEventListener('mousedown', startDrag)
	canvas.addEventListener('mousemove', mouseDrag)
	canvas.addEventListener('mouseup', stopDrag)
	canvas.addEventListener('wheel', zoom)

	reset.addEventListener('click', resetImage)

	resetImage()
})()
