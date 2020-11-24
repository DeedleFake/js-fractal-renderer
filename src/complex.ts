class Complex {
	real: number
	imag: number

	constructor(real: number, imag: number) {
		this.real = real
		this.imag = imag
	}

	toString() {
		let sign = '+'
		if (this.imag < 0) {
			sign = ''
		}

		return `(${this.real}${sign}${this.imag}i)`
	}

	static add(a: Complex, b: Complex): Complex {
		return new Complex(a.real + b.real, a.imag + b.imag)
	}

	static mult(a: Complex, b: Complex | number) {
		if (!(b instanceof Complex)) {
			return new Complex(b * a.real, b * a.imag)
		}

		return new Complex(
			a.real * b.real - a.imag * b.imag,
			a.real * b.imag + b.real * a.imag,
		)
	}
}

export default Complex
