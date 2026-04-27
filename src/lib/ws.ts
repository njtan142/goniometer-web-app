import { parsePacketV2, SensorReading } from './webrtc';

export interface WSClientOpts {
	onPacket: (readings: SensorReading[]) => void;
	onConnected?: () => void;
	onDisconnected?: () => void;
}

export class WSClient {
	private ws: WebSocket | null = null;
	private closed = false;

	constructor(private opts: WSClientOpts) {}

	connect(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const ws = new WebSocket(url);
			ws.binaryType = 'arraybuffer';

			ws.onopen = () => {
				console.log('[WS/HFHL] connected');
				this.opts.onConnected?.();
				resolve();
			};

			ws.onerror = () => {
				reject(new Error('WebSocket connection failed'));
			};

			ws.onclose = () => {
				if (!this.closed) {
					console.log('[WS/HFHL] disconnected');
					this.opts.onDisconnected?.();
				}
			};

			ws.onmessage = (e: MessageEvent<ArrayBuffer>) => {
				const batches = parsePacketV2(e.data);
				for (const readings of batches) {
					this.opts.onPacket(readings);
				}
			};

			this.ws = ws;
		});
	}

	close(): void {
		this.closed = true;
		this.ws?.close();
	}
}
