export interface SensorReading {
	sensorIndex: number;
	degrees: number;
	soc_pct: number;
	flags: number;
	timestamp: number;
}

export interface WebRTCClientOpts {
	/** Called with all 4 sensor readings from one 32-byte packet. */
	onPacket: (readings: SensorReading[]) => void;
	onConnected?: () => void;
	onDisconnected?: () => void;
}

/* Parse a batched packet (N timesteps × 4 sensors × 8 bytes, big-endian).
 * Returns one SensorReading[] per timestep. Handles both legacy single-frame
 * packets (32 bytes) and multi-frame batches (N × 32 bytes).
 * Bit layout per 8-byte frame: [63:50]=angle [49:18]=µs_ts [17:10]=SoC [9:0]=flags */
export function parsePacket(buf: ArrayBuffer): SensorReading[][] {
	const timestepCount = Math.floor(buf.byteLength / 32);
	if (timestepCount === 0) return [];
	const view = new DataView(buf);
	const result: SensorReading[][] = [];
	for (let t = 0; t < timestepCount; t++) {
		const readings: SensorReading[] = [];
		for (let s = 0; s < 4; s++) {
			const off   = t * 32 + s * 8;
			const hi32  = view.getUint32(off, false);
			const lo32  = view.getUint32(off + 4, false);
			const angle_raw = (hi32 >>> 18) & 0x3fff;
			// 32-bit timestamp spans both words; multiply to avoid JS signed overflow
			const ts_hi     = (hi32 & 0x3ffff) >>> 0;   // bits 49–32 (18 bits)
			const ts_lo     = (lo32 >>> 18) >>> 0;       // bits 31–18 (14 bits)
			const timestamp = (ts_hi * 0x4000 + ts_lo) >>> 0;
			const soc       = (lo32 >>> 10) & 0xff;
			const flags     = lo32 & 0x3ff;
			readings.push({
				sensorIndex: s,
				degrees:   angle_raw * (360.0 / 16384.0),
				soc_pct:   soc * (100.0 / 255.0),
				flags,
				timestamp,
			});
		}
		result.push(readings);
	}
	return result;
}

/* Decode a v2 compressed batch produced by compress_batch() in hfhl_ws.c.
 * Header (18 B): [0]=2 [1-2]=count LE [3-6]=base_ts LE [7-14]=4×uint16 angles LE
 *                [15]=soc [16-17]=flags LE
 * Delta (6 B each, samples 1..n-1): [0-3]=4×int8 delta_angle [4-5]=uint16 delta_ts LE
 * Falls back to v1 parsePacket if first byte != 2. */
export function parsePacketV2(buf: ArrayBuffer): SensorReading[][] {
	const view = new DataView(buf);
	if (buf.byteLength < 18 || view.getUint8(0) !== 2) return parsePacket(buf);

	const n        = view.getUint16(1, true);
	const base_ts  = view.getUint32(3, true);
	const base_ang = [0, 1, 2, 3].map(s => view.getUint16(7 + s * 2, true) & 0x3FFF);
	const soc      = view.getUint8(15);
	const flags    = view.getUint16(16, true);
	const soc_pct  = soc * (100.0 / 255.0);

	const result: SensorReading[][] = [];
	const curr_ang = [...base_ang];
	let   curr_ts  = base_ts;

	/* First sample — base values */
	result.push(curr_ang.map((ang, s) => ({
		sensorIndex: s,
		degrees:   ang * (360.0 / 16384.0),
		soc_pct,
		flags,
		timestamp: curr_ts,
	})));

	/* Delta samples */
	for (let t = 1; t < n; t++) {
		const off = 18 + (t - 1) * 6;
		if (off + 6 > buf.byteLength) break;
		curr_ts = (curr_ts + view.getUint16(off + 4, true)) >>> 0;
		const readings: SensorReading[] = [];
		for (let s = 0; s < 4; s++) {
			let ang = curr_ang[s] + view.getInt8(off + s);
			if (ang < 0)      ang += 16384;
			if (ang >= 16384) ang -= 16384;
			curr_ang[s] = ang;
			readings.push({
				sensorIndex: s,
				degrees:   ang * (360.0 / 16384.0),
				soc_pct,
				flags,
				timestamp: curr_ts,
			});
		}
		result.push(readings);
	}
	return result;
}

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 4000): Promise<void> {
	return new Promise(resolve => {
		if (pc.iceGatheringState === 'complete') { resolve(); return; }
		const timer = setTimeout(resolve, timeoutMs);
		function handler() {
			if (pc.iceGatheringState === 'complete') {
				clearTimeout(timer);
				pc.removeEventListener('icegatheringstatechange', handler);
				resolve();
			}
		}
		pc.addEventListener('icegatheringstatechange', handler);
	});
}

export class WebRTCClient {
	private pc: RTCPeerConnection;
	private dc: RTCDataChannel | null = null;
	private closed = false;

	constructor(private opts: WebRTCClientOpts) {
		// No STUN needed — ESP32 is the AP at 192.168.4.1, host candidates suffice
		this.pc = new RTCPeerConnection({ iceServers: [] });
		this.pc.onicegatheringstatechange = () => {
			console.log('[WebRTC] iceGatheringState:', this.pc.iceGatheringState);
		};
		this.pc.oniceconnectionstatechange = () => {
			console.log('[WebRTC] iceConnectionState:', this.pc.iceConnectionState);
		};
		this.pc.onsignalingstatechange = () => {
			console.log('[WebRTC] signalingState:', this.pc.signalingState);
		};
		this.pc.onicecandidate = (e) => {
			if (e.candidate) {
				console.log('[WebRTC] local ICE candidate:', e.candidate.candidate);
			} else {
				console.log('[WebRTC] local ICE candidate gathering complete');
			}
		};
		this.pc.onconnectionstatechange = () => {
			if (this.closed) return;
			const s = this.pc.connectionState;
			console.log('[WebRTC] connectionState:', s);
			if (s === 'disconnected' || s === 'failed' || s === 'closed') {
				this.opts.onDisconnected?.();
			}
		};
	}

	async connect(): Promise<void> {
		// Unreliable, unordered — UDP-like SCTP mode
		this.dc = this.pc.createDataChannel('sensor-data', {
			ordered: false,
			maxRetransmits: 0,
		});
		this.dc.binaryType = 'arraybuffer';
		this.dc.onopen = () => {
			if (!this.closed) {
				console.log('[WebRTC] data channel open');
				this.opts.onConnected?.();
			}
		};
		this.dc.onclose = () => {
			if (!this.closed) {
				console.log('[WebRTC] data channel closed');
				this.opts.onDisconnected?.();
			}
		};

		let pktCount = 0;
		let lastLogTime = 0;
		this.dc.onmessage = (e: MessageEvent<ArrayBuffer>) => {
			const batches = parsePacket(e.data);
			if (batches.length === 0) return;
			pktCount++;
			const now = performance.now();
			if (now - lastLogTime >= 2000) {
				const r = batches[batches.length - 1][0];
				console.log(
					`[WebRTC] rx ${pktCount} pkts (${batches.length} frames/pkt) — ` +
					`L.Elbow=${batches[0][0].degrees.toFixed(1)}° ` +
					`R.Elbow=${batches[0][1].degrees.toFixed(1)}° ` +
					`L.Knee=${batches[0][2].degrees.toFixed(1)}° ` +
					`R.Knee=${batches[0][3].degrees.toFixed(1)}° ` +
					`SoC=${r.soc_pct.toFixed(1)}%`
				);
				lastLogTime = now;
			}
			for (const readings of batches) {
				this.opts.onPacket(readings);
			}
		};

		console.log('[WebRTC] creating offer…');
		const offer = await this.pc.createOffer();
		await this.pc.setLocalDescription(offer);

		console.log('[WebRTC] waiting for ICE gathering…');
		await waitForIceGathering(this.pc);

		console.log('[WebRTC] posting offer to /api/offer');
		const localDesc = this.pc.localDescription!;
		const resp = await fetch('/api/offer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sdp: localDesc.sdp, type: localDesc.type }),
		});
		if (!resp.ok) throw new Error(`Signaling failed: ${resp.status}`);

		const answer = await resp.json() as RTCSessionDescriptionInit;
		console.log('[WebRTC] answer type:', answer.type, 'sdp len:', answer.sdp?.length ?? 0);
		console.log('[WebRTC] got answer, setting remote description');
		await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
		console.log('[WebRTC] remote description set');
	}

	close(): void {
		this.closed = true;
		this.dc?.close();
		this.pc.close();
		this.opts.onDisconnected?.();
	}
}
