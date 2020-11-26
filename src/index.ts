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

		const bounds = screen.parentElement.getBoundingClientRect()
		screen.width = bounds.width
		screen.height = bounds.height

		await renderer.render({
			...state,
			resolution: new Float32Array([screen.width, screen.height]),
			seed: new Date().getTime(),
		})
	}

	const sx2fx = (x: number, scale = state.scale): number =>
		x / screen.width / scale + state.offset[0]
	const sy2fy = (y: number, scale = state.scale): number =>
		y / screen.height / scale + state.offset[1]
	const s2f = (c: [number, number], scale = state.scale): [number, number] => [
		sx2fx(c[0], scale),
		sy2fy(c[1], scale),
	]

	const fx2sx = (x: number, scale = state.scale): number =>
		(x - state.offset[0]) * scale * screen.width
	const fy2sy = (y: number, scale = state.scale): number =>
		(y - state.offset[1]) * scale * screen.height
	const f2s = (c: [number, number], scale = state.scale): [number, number] => [
		fx2sx(c[0], scale),
		fy2sy(c[1], scale),
	]

	const getMouseCoords = (ev: MouseEvent): [number, number] => {
		const bounds = screen.getBoundingClientRect()
		return [
			((ev.clientX - bounds.x) * screen.width) / bounds.width,
			((bounds.height - (ev.clientY - bounds.y)) * screen.height) /
				bounds.height,
		]
	}

	const startDrag = (ev: MouseEvent): void => {
		ev.preventDefault()

		dragFrom = s2f(getMouseCoords(ev))
	}

	const mouseDrag = (ev: MouseEvent): void => {
		if (dragFrom == null) {
			return
		}

		ev.preventDefault()

		const dragTo = s2f(getMouseCoords(ev))
		const drag = [dragTo[0] - dragFrom[0], dragTo[1] - dragFrom[1]]

		setState({
			offset: new Float32Array([
				state.offset[0] - drag[0],
				state.offset[1] - drag[1],
			]),
		})

		dragFrom = s2f(getMouseCoords(ev))
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

		const mouse = getMouseCoords(ev)
		const oldMouse = s2f(mouse, scale)
		const newMouse = s2f(
			[(mouse[0] * scale) / state.scale, (mouse[1] * scale) / state.scale],
			scale,
		)

		setState({
			offset: new Float32Array([
				state.offset[0] + (newMouse[0] - oldMouse[0]),
				state.offset[1] + (newMouse[1] - oldMouse[1]),
			]),
			scale,
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
