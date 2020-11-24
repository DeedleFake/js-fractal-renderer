// @format

import { Message } from './workers'

interface Constructor<T> {
	new (): T
}

class WorkerPool<T extends import('worker-loader!').default<D, R>, D, R> {
	workers: Array<T>
	prev = 0
	messageID = 0

	constructor(type: Constructor<T>, size: number) {
		this.workers = new Array(size).fill(null).map(() => new type())
	}

	getWorker() {
		this.prev = (this.prev + 1) % this.workers.length
		return this.workers[this.prev]
	}

	async run(data: D) {
		return new Promise<R>((resolve, reject) => {
			const w = this.getWorker()

			const messageID = this.messageID++
			w.onmessage = ({ data: { id, data } }: MessageEvent<Message<R>>) => {
				if (id !== messageID) {
					return
				}

				w.onmessage = null
				resolve(data)
			}

			w.postMessage({ id: messageID, data })
		})
	}
}

export default WorkerPool
