import { useState, useEffect, useRef } from 'preact/hooks';
import * as S from '../styles';
import { GaugePanel } from './GaugePanel';
import { ControlPanelTop } from './ControlPanelTop';
import { ChartVisualization } from './ChartVisualization';
import { AnimateModal } from './AnimateModal';
import { StatusSidebar } from './StatusSidebar';
import { JOINTS } from '../constants/joints';
import { WebRTCClient, SensorReading } from '../lib/webrtc';
import { WSClient } from '../lib/ws';

export const CHART_POINTS = 29;
export const ACTIVE_JOINTS = ['left-elbow', 'right-elbow', 'left-knee', 'right-knee'];


export interface HistorySession {
	timestamp: string;
	joints: string;
	duration: string;
	rate: string;
}

export function App() {
	const [framesPerPacket, setFramesPerPacket] = useState(1);
	const [packetFreqHz, setPacketFreqHz] = useState(60);
	const [mode, setMode] = useState<'live' | 'record'>('live');
	const [isRecording, setIsRecording] = useState(false);
	const [isHeld, setIsHeld] = useState(false);
	const [selectedJoint, setSelectedJoint] = useState('left-elbow');
	const [showAnimateModal, setShowAnimateModal] = useState(false);
	const [isConnected, setIsConnected] = useState(false);
	const [batteryPct, setBatteryPct] = useState(0);

	const [jointAngles, setJointAngles] = useState<Record<string, number>>(
		() => Object.fromEntries(JOINTS.map(j => [j.value, 0]))
	);
	const [zeroOffsets, setZeroOffsets] = useState<Record<string, number>>({});
	const [chartData, setChartData] = useState<Record<string, number[]>>(
		() => Object.fromEntries(ACTIVE_JOINTS.map(id => [id, Array(CHART_POINTS).fill(0)]))
	);
	const [history, setHistory] = useState<HistorySession[]>([]);

	const isHeldRef        = useRef(false);
	const isRecordingRef   = useRef(false);
	const zeroOffsetsRef   = useRef<Record<string, number>>({});
	const recordingStartRef = useRef<number | null>(null);
	const recordingDataRef  = useRef<{ t: number; angles: Record<string, number> }[]>([]);

	isHeldRef.current      = isHeld;
	isRecordingRef.current = isRecording;
	zeroOffsetsRef.current = zeroOffsets;

	// Shared packet handler — identical logic for both WebRTC and WebSocket.
	const handlePacket = (readings: SensorReading[]) => {
		if (isHeldRef.current) return;
		const soc = readings[0]?.soc_pct ?? 0;
		setBatteryPct(Math.round(soc));
		const newAngles: Record<string, number> = {};
		readings.forEach(r => {
			const jointId = ACTIVE_JOINTS[r.sensorIndex];
			if (!jointId) return;
			newAngles[jointId] = r.degrees - (zeroOffsetsRef.current[jointId] ?? 0);
		});
		setJointAngles(prev => ({ ...prev, ...newAngles }));
		setChartData(prev => {
			const next = { ...prev };
			Object.entries(newAngles).forEach(([id, deg]) => {
				next[id] = [...(prev[id] ?? []), deg].slice(-CHART_POINTS);
			});
			return next;
		});
		if (isRecordingRef.current) {
			recordingDataRef.current.push({ t: performance.now(), angles: { ...newAngles } });
		}
	};

	// ── Live mode: WebRTC (LFLL) ────────────────────────────────────────
	useEffect(() => {
		if (mode !== 'live') return;
		const client = new WebRTCClient({
			onPacket: handlePacket,
			onConnected:    () => setIsConnected(true),
			onDisconnected: () => setIsConnected(false),
		});
		client.connect().catch(err =>
			console.info('WebRTC unavailable, using mock data:', err.message)
		);
		return () => { client.close(); setIsConnected(false); };
	}, [mode]);

	// ── Record mode: WebSocket (HFHL) ───────────────────────────────────
	// Delay 600 ms before opening the WebSocket — gives the firmware time to
	// tear down the WebRTC/DTLS context and free its heap after /api/stop.
	useEffect(() => {
		if (mode !== 'record') return;
		let client: WSClient | null = null;
		const timer = setTimeout(() => {
			client = new WSClient({
				onPacket: handlePacket,
				onConnected:    () => setIsConnected(true),
				onDisconnected: () => {
					setIsConnected(false);
					// WebSocket dropped mid-recording — save the partial buffer.
					if (isRecordingRef.current) {
						isRecordingRef.current = false;
						setIsRecording(false);
						finalizeRecording();
					}
				},
			});
			client.connect('ws://192.168.4.1/ws').catch(err =>
				console.info('[WS/HFHL] unavailable:', err)
			);
		}, 600);
		return () => { clearTimeout(timer); client?.close(); setIsConnected(false); };
	}, [mode]);

	// ── Sync batch params to backend ──────────────────────────────────────
	useEffect(() => {
		const timer = setTimeout(() => {
			if (!isConnected) return;
			fetch('/api/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ frames_per_packet: framesPerPacket, packet_freq_hz: packetFreqHz })
			}).catch(err => console.warn('Failed to update batch params:', err));
		}, 300);
		return () => clearTimeout(timer);
	}, [framesPerPacket, packetFreqHz, isConnected]);

	// ── Handlers ──────────────────────────────────────────────────────────
	const handleHold = () => setIsHeld(h => !h);

	const handleSetZero = () => {
		setZeroOffsets(prev => {
			const displayed = jointAngles[selectedJoint] ?? 0;
			return { ...prev, [selectedJoint]: (prev[selectedJoint] ?? 0) + displayed };
		});
	};

	const finalizeRecording = () => {
		const elapsed = performance.now() - (recordingStartRef.current ?? 0);
		const totalSecs = Math.round(elapsed / 1000);
		const mins = Math.floor(totalSecs / 60);
		const secs = totalSecs % 60;
		const now = new Date();
		const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
		const joints = ACTIVE_JOINTS.map(id => {
			const j = JOINTS.find(j => j.value === id);
			return j?.label.replace('Left ', 'L.').replace('Right ', 'R.') ?? id;
		}).join(', ');
		setHistory(prev => [{
			timestamp: ts,
			joints,
			duration: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,
			rate: `${framesPerPacket * packetFreqHz}Hz`,
		}, ...prev]);
	};

	const handleRecordingToggle = () => {
		if (!isRecording) {
			// Switch to WebSocket (HFHL) mode — tell firmware to stop WebRTC so
			// it can free its DTLS heap before the WebSocket ring buffer allocates.
			fetch('/api/stop', { method: 'POST' }).catch(() => {});
			recordingStartRef.current = performance.now();
			recordingDataRef.current = [];
			isRecordingRef.current = true;
			setIsRecording(true);
			setIsConnected(false);
			setMode('record');
		} else {
			setIsRecording(false);
			finalizeRecording();
			setIsConnected(false);
			setMode('live');
		}
	};

	const handleExport = () => {
		const data = recordingDataRef.current;
		if (data.length === 0) {
			alert('No recording data. Start a recording session first.');
			return;
		}
		const headers = ['time_ms', ...ACTIVE_JOINTS];
		const rows = data.map(d => [
			d.t.toFixed(1),
			...ACTIVE_JOINTS.map(id => (d.angles[id] ?? 0).toFixed(2)),
		]);
		const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `goniometer_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<S.Container>
			<S.MainLayout>
				<S.LeftSection>
					<S.TopPanel>
						<GaugePanel
							angle={jointAngles[selectedJoint] ?? 0}
							selectedJoint={selectedJoint}
							onJointChange={setSelectedJoint}
						/>
						<ControlPanelTop
							framesPerPacket={framesPerPacket}
							packetFreqHz={packetFreqHz}
							isRecording={isRecording}
							isHeld={isHeld}
							onFramesPerPacketChange={setFramesPerPacket}
							onPacketFreqChange={setPacketFreqHz}
							onRecordingToggle={handleRecordingToggle}
							onHold={handleHold}
							onExport={handleExport}
							onSetZero={handleSetZero}
						/>
					</S.TopPanel>
					<ChartVisualization
						activeJoints={ACTIVE_JOINTS}
						chartData={chartData}
						samplingRate={framesPerPacket * packetFreqHz}
						onAnimateClick={() => setShowAnimateModal(true)}
					/>
				</S.LeftSection>

				<AnimateModal
					isOpen={showAnimateModal}
					onClose={() => setShowAnimateModal(false)}
					targetJoint='leftWrist'
				/>

				<StatusSidebar
					activeJoints={ACTIVE_JOINTS}
					jointAngles={jointAngles}
					chartData={chartData}
					history={history}
					batteryPct={batteryPct}
					isConnected={isConnected}
				/>
			</S.MainLayout>
		</S.Container>
	);
}
