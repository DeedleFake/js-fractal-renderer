// @format

declare module 'worker-loader!*' {
	class WebpackWorker<D, R> extends Worker {
		onmessage: (ev: MessageEvent<import('./workers').Message<R>>) => void

		constructor()
		postMessage(args: import('./workers').Message<D>): void
	}

	export default WebpackWorker
}
