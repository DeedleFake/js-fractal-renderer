// @format

export type Uniform = number | Float32Array

export type ShaderRendererOptions = {
	shaderVersion: number
}

const defaultOptions: ShaderRendererOptions = {
	shaderVersion: 100,
}

const vertex = (version: number) => `#version ${version} es
	precision highp float;

	uniform mat4 projectionMatrix;
	in vec4 vertexPosition;

	void main() {
		gl_Position = projectionMatrix * vertexPosition;
	}
`

const orthographicProjection = (
	left: number,
	right: number,
	bottom: number,
	top: number,
	near: number,
	far: number,
): Array<number> => [
	2 / (right - left),
	0,
	0,
	0,

	0,
	2 / (top - bottom),
	0,
	0,

	0,
	0,
	2 / (near - far),
	0,

	(left + right) / (left - right),
	(bottom + top) / (bottom - top),
	(near + far) / (near - far),
	1,
]

class ShaderRenderer {
	gl: WebGL2RenderingContext

	program: WebGLProgram
	attrib = {
		vertexPosition: -1,
	}
	uniform = {
		projectionMatrix: -1,
	}

	constructor(
		gl: WebGL2RenderingContext,
		fragment: string,
		options: ShaderRendererOptions = defaultOptions,
	) {
		this.gl = gl
		this.init(vertex(options.shaderVersion), fragment)
	}

	init(vertex: string, fragment: string): void {
		const vs = this.loadShader(this.gl.VERTEX_SHADER, vertex)
		const fs = this.loadShader(this.gl.FRAGMENT_SHADER, fragment)

		const program = this.gl.createProgram()
		this.gl.attachShader(program, vs)
		this.gl.attachShader(program, fs)
		this.gl.linkProgram(program)
		if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
			throw new Error(`link program: ${this.gl.getProgramInfoLog(program)}`)
		}
		this.program = program
		this.gl.useProgram(program)

		this.attrib = Object.keys(this.attrib).reduce(
			(obj, key) => ({
				...obj,
				[key]: this.gl.getAttribLocation(program, key),
			}),
			this.attrib,
		)
		this.uniform = Object.keys(this.uniform).reduce(
			(obj, key) => ({
				...obj,
				[key]: this.gl.getUniformLocation(program, key),
			}),
			this.uniform,
		)

		const buf = this.gl.createBuffer()
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf)
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array([0, 0, 2, 0, 0, 2, 0, 0]),
			this.gl.STATIC_DRAW,
		)
		this.gl.vertexAttribPointer(
			this.attrib.vertexPosition,
			2,
			this.gl.FLOAT,
			false,
			0,
			0,
		)
		this.gl.enableVertexAttribArray(this.attrib.vertexPosition)

		this.gl.uniformMatrix4fv(
			this.uniform.projectionMatrix,
			false,
			orthographicProjection(0, 1, 1, 0, -1, 1),
		)

		this.gl.clearColor(0, 0, 0, 1)
	}

	loadShader(type: number, src: string): WebGLShader {
		const shader = this.gl.createShader(type)
		this.gl.shaderSource(shader, src)
		this.gl.compileShader(shader)

		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			const infoLog = this.gl.getShaderInfoLog(shader)
			this.gl.deleteShader(shader)
			throw new Error(`compile shader: ${infoLog}`)
		}

		return shader
	}

	setUniform(h: WebGLUniformLocation, v: Uniform): void {
		if (typeof v === 'number') {
			this.gl.uniform1f(h, v)
			return
		}

		switch (v.length) {
			case 1:
				this.gl.uniform1fv(h, v)
				break

			case 2:
				this.gl.uniform2fv(h, v)
				break

			case 3:
				this.gl.uniform3fv(h, v)
				break

			case 4:
				this.gl.uniform4fv(h, v)
				break

			default:
				throw new Error(`unsupported array length: ${v.length}`)
		}
	}

	async render(uniform: Record<string, Uniform> = {}): Promise<void> {
		return new Promise((resolve, reject) => {
			window.requestAnimationFrame(() => {
				this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
				for (let [k, v] of Object.entries(uniform)) {
					const h = this.gl.getUniformLocation(this.program, k)
					if (h < 0) {
						throw new Error(`unknown uniform: ${k}`)
					}

					this.setUniform(h, v)
				}

				this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
				this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

				resolve()
			})
		})
	}
}

export default ShaderRenderer
