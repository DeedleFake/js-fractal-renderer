// @format

import ShaderRenderer from './ShaderRenderer'
import fragmentTemplate from 'underscore-template-loader!./fragment.glsl'

import { getElements } from './util'

const zoomSpeed = 1.1
const shaderVersion = 300

const fragmentShader = fragmentTemplate({
	shaderVersion,
})

const screen = document.getElementById('screen') as HTMLCanvasElement
const renderer = new ShaderRenderer(
	screen.getContext('webgl2'),
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

		//offset: new Float32Array([-0.5557506, -0.5556]),
		//scale: 100000000,
		offset: new Float32Array([-1.5, -1]),
		scale: 0.5,
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
			resolution: new Float32Array([screen.width, screen.height]),
			seed: new Date().getTime(),
		})
	}

	const sx2fx = (x: number): number =>
		x / screen.width / state.scale + state.offset[0]
	const sy2fy = (y: number): number =>
		y / screen.height / state.scale + state.offset[1]
	const fx2sx = (x: number): number =>
		(x - state.offset[0]) * state.scale * screen.width
	const fy2sy = (y: number): number =>
		(y - state.offset[1]) * state.scale * screen.height

	const getMouseCoords = (ev: MouseEvent): [number, number] => {
		const bounds = screen.getBoundingClientRect()
		return [
			sx2fx(((ev.clientX - bounds.x) * screen.width) / bounds.width),
			sy2fy(
				((bounds.height - (ev.clientY - bounds.y)) * screen.height) /
					bounds.height,
			),
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
				state.offset[0] - drag[0],
				state.offset[1] - drag[1],
			]),
		})

		dragFrom = getMouseCoords(ev)
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

		const mouse = getMouseCoords(ev)

		let scale = state.scale
		switch (true) {
			case ev.deltaY < 0:
				scale *= zoomSpeed
				break

			case ev.deltaY > 0:
				scale /= zoomSpeed
				break

			default:
				return
		}

		console.dir({ mouse })
		setState({
			//offset: new Float32Array([
			//	mouse[0] / state.scale - state.offset[0],
			//	mouse[1] / state.scale - state.offset[1],
			//]),
			//scale,
		})
	}

	screen.addEventListener('mousedown', startDrag)
	screen.addEventListener('mousemove', mouseDrag)
	screen.addEventListener('mouseup', stopDrag)
	screen.addEventListener('wheel', zoom)

	controls.incthresh.addEventListener('click', () => {
		setState({ threshold: state.threshold + 1 })
	})
	controls.decthresh.addEventListener('click', () => {
		setState({ threshold: state.threshold - 1 })
	})

	controls.reset.addEventListener('click', () => setState(defaultState))

	setState(defaultState)
})()
