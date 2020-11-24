// @format

declare module 'worker-loader!*' {
	class WebpackWorker<D, R> extends Worker {
		constructor()
		postMessage(args: import('./workers').Message<D>): void
	}

	export default WebpackWorker
}
