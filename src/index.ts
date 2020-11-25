// @format

import ShaderRenderer from './ShaderRenderer'

const Samples = 50
const MaxIterations = 1500
const IterHueAdjust = 800
const Threshold = 4

const shaderVersion = 300

const shader = `#version ${shaderVersion} es
	precision highp float;

	uniform vec2 resolution;
	uniform float seed;
	uniform vec2 offset;
	uniform float height;

	uniform float dragging;
	uniform vec2 dragFrom;
	uniform vec2 dragTo;

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

	vec3 mandelbrotColor(in float check, in float iter, in bool selected) {
		float lum = .5;
		if (selected) {
			lum = .75;
		}

		if (check > float(${Threshold})) {
			return hslToRGB(vec3(iter / float(${IterHueAdjust}) * check, 1, lum));
		}

		return hslToRGB(vec3(iter / float(${IterHueAdjust}) * check, 1, lum));
	}

	bool inDrag(in vec2 position) {
		if (dragging == 0.0) {
			return false;
		}

		if ((position.x < dragFrom.x) || (position.y < dragFrom.y) || (position.x > dragTo.x) || (position.y > dragTo.y)) {
			return false;
		}
		return true;
	}

	void main() {
		randState = uint(float(seed) + gl_FragCoord.x / gl_FragCoord.y);

		vec3 col;
		for (int i = 0; i < ${Samples}; i++) {
			vec2 position = (gl_FragCoord.xy + vec2(randFloat(), randFloat())) / resolution;
			position = height * position + offset;

			float check, iter;
			checkMandelbrot(check, iter, position);

			vec3 s = mandelbrotColor(check, iter, inDrag(gl_FragCoord.xy));
			col += s;
		}

		fragColor = vec4(col / float(${Samples}), 1);
	}
`

const canvas = document.getElementById('screen') as HTMLCanvasElement
const renderer = new ShaderRenderer(canvas.getContext('webgl2'), shader, {
	shaderVersion,
})

declare global {
	interface Window {
		Fractal: {
			render(offset: Float32Array, height: number, drag: [[number, number], [number, number]]): void
		}
	}
}

window.Fractal = {
	render(offset, height, drag = null): void {
		renderer.render({
			resolution: new Float32Array([canvas.width, canvas.height]),
			seed: new Date().getTime(),

			offset,
			height,

			dragging: drag != null ? 1 : 0,
			...(drag != null && {
				dragFrom: new Float32Array(drag[0]),
				dragTo: new Float32Array(drag[1]),
			}),
		})
	},
}
