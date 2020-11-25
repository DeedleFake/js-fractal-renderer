// @format

import ShaderRenderer from './ShaderRenderer'

const Samples = 4
const MaxIterations = 1500
const IterHueAdjust = 800
const Threshold = 4
const ZoomSpeed = 1.1

const shaderVersion = 300

const shader = `#version ${shaderVersion} es
	precision highp float;

	uniform vec2 resolution;
	uniform float seed;
	uniform vec2 offset;
	uniform float height;

	out vec4 fragColor;

	uint randState;

	uint randUint() {
		randState ^= randState << 13;
		randState ^= randState >> 17;
		randState ^= randState << 5;
		return randState;
	}

	float randFloat() {
		return 1.0 / float(randUint());
	}

	void checkMandelbrot(inout float check, inout float iter, in vec2 position) {
		vec2 cur = position;
		for (int i = 0; i < ${MaxIterations}; i++) {
			iter = float(i);

			check = (cur.x * cur.x) + (cur.y * cur.y);
			if (check > float(${Threshold})) {
				break;
			}

			cur = vec2(
				(cur.x * cur.x) - (cur.y * cur.y),
				float(2) * cur.x * cur.y
			) + position;
		}
	}

	float hueToRGB(in float p, in float q, in float t) {
		if (t < 0.0) {
			t++;
		}
		else if (t > 1.0) {
			t--;
		}

		if (t < 1.0 / 6.0) {
			return p + (q - p) * 6.0 * t;
		}

		if (t < 1.0 / 2.0) {
			return q;
		}

		if (t < 2.0 / 3.0) {
			return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
		}

		return p;
	}

	vec3 hslToRGB(in vec3 hsl) {
		if (hsl[1] == 0.0) {
			return vec3(hsl[2], hsl[2], hsl[2]);
		}

		float q = hsl[2] + hsl[1] - (hsl[2] * hsl[1]);
		if (hsl[2] < .5) {
			q = hsl[2] * (1.0 + hsl[1]);
		}
		float p = 2.0 * hsl[2] - q;

		return vec3(
			hueToRGB(p, q, hsl[0] + (1.0 / 3.0)),
			hueToRGB(p, q, hsl[0]),
			hueToRGB(p, q, hsl[0] - (1.0 / 3.0))
		);
	}

	vec3 mandelbrotColor(in float check, in float iter) {
		if (check > float(${Threshold})) {
			return hslToRGB(vec3(iter / float(${IterHueAdjust}) * check, 1, .5));
		}

		return hslToRGB(vec3(iter / float(${IterHueAdjust}) * check, 1, .5));
	}

	void main() {
		randState = uint(float(seed) + gl_FragCoord.x / gl_FragCoord.y);

		vec3 col;
		for (int i = 0; i < ${Samples}; i++) {
			vec2 position = (gl_FragCoord.xy + vec2(randFloat(), randFloat())) / resolution;
			position = height * position + offset;

			float check, iter;
			checkMandelbrot(check, iter, position);

			vec3 s = mandelbrotColor(check, iter);
			col += s;
		}

		fragColor = vec4(col / float(${Samples}), 1);
	}
`

const canvas = document.getElementById('screen') as HTMLCanvasElement
const renderer = new ShaderRenderer(canvas.getContext('webgl2'), shader, {
	shaderVersion,
})

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
	canvas.addEventListener('wheel', zoom)

	reset.addEventListener('click', resetImage)

	resetImage()
})()
