// @format

import { Message } from './workers'
import type WebpackWorker from 'worker-loader!'

interface Constructor<T> {
	new (): T
}

class WorkerPool<T extends WebpackWorker<D, R>, D, R> {
	workers: Array<T>
	prev = 0
	messageID = 0

	constructor(type: Constructor<T>, size: number) {
		this.workers = new Array(size).fill(null).map(() => new type())
	}

	getWorker(): T {
		this.prev = (this.prev + 1) % this.workers.length
		return this.workers[this.prev]
	}

	async run(data: D): Promise<R> {
		return new Promise<R>((resolve, reject) => {
			const w = this.getWorker()

			const messageID = this.messageID++
			const listener = ({ data: { id, data } }: MessageEvent<Message<R>>) => {
				if (id !== messageID) {
					return
				}

				w.removeEventListener('message', listener)
				resolve(data)
			}
			w.addEventListener('message', listener)

			w.postMessage({ id: messageID, data })
		})
	}
}

export default WorkerPool
