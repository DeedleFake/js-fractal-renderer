#version <%= shaderVersion %> es
precision highp float;

uniform float samples;
uniform float maxIterations;
uniform float iterHueAdjust;
uniform float threshold;

uniform vec2 offset;
uniform float scale;

uniform vec2 resolution;
uniform float seed;

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
	for (int i = 0; i < int(maxIterations); i++) {
		iter = float(i);

		check = (cur.x * cur.x) + (cur.y * cur.y);
		if (check > threshold) {
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
	if (check > threshold) {
		return hslToRGB(vec3(iter / iterHueAdjust * check, 1, .5));
	}

	return hslToRGB(vec3(iter / iterHueAdjust * check, 1, .5));
}

void main() {
	randState = uint(float(seed) + gl_FragCoord.x / gl_FragCoord.y);

	vec3 col;
	for (int i = 0; i < int(samples); i++) {
		vec2 position = (gl_FragCoord.xy + vec2(randFloat(), randFloat())) / resolution;
		position.x *= resolution.x / resolution.y;
		position = position / scale + offset;

		float check, iter;
		checkMandelbrot(check, iter, position);

		vec3 s = mandelbrotColor(check, iter);
		col += s;
	}

	fragColor = vec4(col / samples, 1);
}
