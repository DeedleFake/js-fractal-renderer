// @format

import Color from 'color'

import Complex from './complex'

import WorkerPool from './workerPool'
import RenderRowWorker from 'worker-loader!./workers/renderRow'

const renderers = new WorkerPool(RenderRowWorker, 16)

const renderRow = async (
	img: { width: number; height: number },
	position: Complex,
	height: number,
	y: number,
): Promise<Uint8Array> => renderers.run({ img, position, height, y }) as any

const render = async (img: ImageData, position: Complex, height: number) => {
	let progress = 0
	document.getElementById('progress').innerHTML = `0/${img.height}`

	let workers = new Array(img.height)
	for (let y = 0; y < img.height; y++) {
		workers[y] = (async (y: number) => {
			const row = await renderRow(
				{ width: img.width, height: img.height },
				position,
				height,
				y,
			)

			const start = y * img.width * 4
			for (let i = 0; i < row.length; i++) {
				img.data[start + i] = row[i]
			}

			progress++
			document.getElementById(
				'progress',
			).innerHTML = `${progress}/${img.height}`
		})(y)
	}
	await Promise.all(workers)

	console.log('Rendering finished.')
}

const redraw = async (x: number, y: number, zoom: number) => {
	const canvas = document.getElementById('screen') as HTMLCanvasElement
	const ctx = canvas.getContext('2d')

	const img = ctx.createImageData(canvas.width, canvas.height)
	await render(img, new Complex(x, y), zoom)
	ctx.putImageData(img, 0, 0)
}

redraw(-0.5557506, -0.5556, 0.000000001)

declare global {
	interface Window {
		MR: any
	}
}

window.MR = {
	redraw,
}
