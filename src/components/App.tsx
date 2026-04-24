import { useState, useEffect, useRef } from 'preact/hooks';
import * as S from '../styles';
import { GaugePanel } from './GaugePanel';
import { ControlPanelTop } from './ControlPanelTop';
import { ChartVisualization } from './ChartVisualization';
import { AnimateModal } from './AnimateModal';
import { StatusSidebar } from './StatusSidebar';
import { JOINTS } from '../constants/joints';
import { WebRTCClient, SensorReading } from '../lib/webrtc';

export const CHART_POINTS = 29;
export const ACTIVE_JOINTS = ['left-elbow', 'right-elbow', 'left-knee', 'right-knee'];


export interface HistorySession {
	timestamp: string;
	joints: string;
	duration: string;
	rate: string;
}

export function App() {
	const [samplingRate, setSamplingRate] = useState(50);
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

	// ── WebRTC connection ────────────────────────────────────────────────
	useEffect(() => {
		const client = new WebRTCClient({
			onPacket: (readings: SensorReading[]) => {
				if (isHeldRef.current) return;

				// Use first reading's SoC as battery level
				const soc = readings[0]?.soc_pct ?? batteryPct;
				setBatteryPct(Math.round(soc));

				// Build angle map for all 4 sensors
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
						const buf = [...(prev[id] ?? []), deg];
						next[id] = buf.slice(-CHART_POINTS);
					});
					return next;
				});

				if (isRecordingRef.current) {
					recordingDataRef.current.push({
						t: performance.now(),
						angles: { ...newAngles },
					});
				}
			},
			onConnected: () => {
				setIsConnected(true);
			},
			onDisconnected: () => {
				setIsConnected(false);
			},
		});

		client.connect().catch(err => {
			// Expected in dev; app falls back to mock data automatically
			console.info('WebRTC unavailable, using mock data:', err.message);
		});

		return () => client.close();
	}, []); // connect once on mount

	// ── Handlers ──────────────────────────────────────────────────────────
	const handleHold = () => setIsHeld(h => !h);

	const handleSetZero = () => {
		setZeroOffsets(prev => {
			const displayed = jointAngles[selectedJoint] ?? 0;
			return { ...prev, [selectedJoint]: (prev[selectedJoint] ?? 0) + displayed };
		});
	};

	const handleRecordingToggle = () => {
		if (!isRecording) {
			recordingStartRef.current = performance.now();
			recordingDataRef.current = [];
			setIsRecording(true);
		} else {
			setIsRecording(false);
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
				rate: `${samplingRate}Hz`,
			}, ...prev]);
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
							samplingRate={samplingRate}
							isRecording={isRecording}
							isHeld={isHeld}
							onSamplingRateChange={setSamplingRate}
							onRecordingToggle={handleRecordingToggle}
							onHold={handleHold}
							onExport={handleExport}
							onSetZero={handleSetZero}
						/>
					</S.TopPanel>
					<ChartVisualization
						activeJoints={ACTIVE_JOINTS}
						chartData={chartData}
						samplingRate={samplingRate}
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
