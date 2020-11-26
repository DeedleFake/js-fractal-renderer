// @format

import ShaderRenderer from './ShaderRenderer'
import fragmentTemplate from 'underscore-template-loader!./fragment.glsl'

import { getElements } from './util'

const zoomSpeed = 1.1
const shaderVersion = 300

const fragmentShader = fragmentTemplate({
	shaderVersion,
})

const canvas = document.getElementById('screen') as HTMLCanvasElement
const renderer = new ShaderRenderer(
	canvas.getContext('webgl2'),
	fragmentShader,
	{
		shaderVersion,
	},
)

const controls = getElements(
	'incthresh',
	'threshold',
	'decthresh',

	'reset',
)

;(() => {
	const defaultState = {
		samples: 4,
		maxIterations: 1500,
		iterHueAdjust: 800,
		threshold: 4,

		//offset: [-0.5557506, -0.5556],
		//height: 100000000,
		offset: new Float32Array([-1.5, -1]),
		height: 0.5,
	}
	let state = { ...defaultState }

	let dragFrom: [number, number] = null

	const setState = async (
		partialState: Partial<typeof defaultState> = {},
	): Promise<void> => {
		state = { ...state, ...partialState }
		for (let [k, v] of Object.entries(state)) {
			const c = controls[k]
			if (c == null) {
				continue
			}

			c.innerHTML = `${v}`
		}

		await renderer.render({
			...state,
			resolution: new Float32Array([canvas.width, canvas.height]),
			seed: new Date().getTime(),
		})
	}

	const swToFW = (w: number): number => (w / canvas.width) / state.height
	const shToFH = (h: number): number => (h / canvas.height) / state.height

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

		setState({
			offset: new Float32Array([
				state.offset[0] - swToFW(drag[0]),
				state.offset[1] - shToFH(drag[1]),
			]),
		})

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

		let height = state.height
		switch (true) {
			case ev.deltaY < 0:
				height *= zoomSpeed
				//state.offset = [
				//	state.offset[0] + swToFW(canvas.width / 2),
				//	state.offset[1] + shToFH(canvas.height / 2),
				//]
				break

			case ev.deltaY > 0:
				height /= zoomSpeed
				break

			default:
				return
		}

		setState({ height })
	}

	const resetImage = (): void => {
		setState(defaultState)
	}

	canvas.addEventListener('mousedown', startDrag)
	canvas.addEventListener('mousemove', mouseDrag)
	canvas.addEventListener('mouseup', stopDrag)
	canvas.addEventListener('wheel', zoom)

	controls.incthresh.addEventListener('click', () => {
		setState({ threshold: state.threshold + 1 })
	})
	controls.decthresh.addEventListener('click', () => {
		setState({ threshold: state.threshold - 1 })
	})

	controls.reset.addEventListener('click', resetImage)

	resetImage()
})()
