// @format

import ShaderRenderer from './ShaderRenderer'

const Samples = 50
const MaxIterations = 1500
const IterHueAdjust = 800
const Threshold = 4

const shader = `
	precision highp float;

	uniform vec2 resolution;
	uniform vec2 offset;
	uniform float height;

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
			return vec3(0, 0, 0);
		}

		return hslToRGB(vec3(iter / float(${IterHueAdjust}) * check, 1, .5));
	}

	void main() {
		vec2 position = height * (gl_FragCoord.xy / resolution) + offset;

		float check, iter;
		checkMandelbrot(check, iter, position);

		gl_FragColor = vec4(mandelbrotColor(check, iter), 1);
	}
`

const canvas = document.getElementById('screen') as HTMLCanvasElement
const renderer = new ShaderRenderer(canvas.getContext('webgl2'), shader)

renderer.render({
	resolution: new Float32Array([800, 800]),
	//offset: new Float32Array([-0.5557506, -0.5556]),
	//height: 0.000000001,
	offset: new Float32Array([-1.5, -1]),
	height: 2,
})
