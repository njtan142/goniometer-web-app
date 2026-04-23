import { useState, useEffect, useRef } from 'preact/hooks';
import * as S from '../styles';
import { GaugePanel } from './GaugePanel';
import { ControlPanelTop } from './ControlPanelTop';
import { ChartVisualization } from './ChartVisualization';
import { AnimateModal } from './AnimateModal';
import { StatusSidebar } from './StatusSidebar';
import { JOINTS } from '../constants/joints';

export const CHART_POINTS = 29;
export const ACTIVE_JOINTS = ['left-elbow', 'right-elbow', 'left-knee', 'right-knee'];

const MOCK_PARAMS: Record<string, { center: number; amplitude: number; period: number; phase: number }> = {
	'left-elbow':     { center: 80,  amplitude: 40, period: 8000,  phase: 0 },
	'right-elbow':    { center: 75,  amplitude: 38, period: 7500,  phase: 1.2 },
	'left-knee':      { center: 90,  amplitude: 45, period: 10000, phase: 0.5 },
	'right-knee':     { center: 85,  amplitude: 42, period: 9500,  phase: 1.8 },
	'left-shoulder':  { center: 90,  amplitude: 55, period: 12000, phase: 0.3 },
	'right-shoulder': { center: 88,  amplitude: 52, period: 11500, phase: 2.1 },
	'left-hip':       { center: 70,  amplitude: 30, period: 9000,  phase: 0.8 },
	'right-hip':      { center: 68,  amplitude: 28, period: 8500,  phase: 2.5 },
	'left-wrist':     { center: 45,  amplitude: 20, period: 6000,  phase: 1.0 },
	'right-wrist':    { center: 43,  amplitude: 18, period: 5500,  phase: 0.4 },
	'left-ankle':     { center: 25,  amplitude: 12, period: 7000,  phase: 1.5 },
	'right-ankle':    { center: 23,  amplitude: 10, period: 6500,  phase: 2.8 },
};

function mockAngle(jointId: string, t: number): number {
	const p = MOCK_PARAMS[jointId] ?? { center: 60, amplitude: 30, period: 8000, phase: 0 };
	return p.center + p.amplitude * Math.sin((2 * Math.PI * t) / p.period + p.phase);
}

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

	const [jointAngles, setJointAngles] = useState<Record<string, number>>(() =>
		Object.fromEntries(JOINTS.map(j => [j.value, mockAngle(j.value, 0)]))
	);
	const [zeroOffsets, setZeroOffsets] = useState<Record<string, number>>({});
	const [chartData, setChartData] = useState<Record<string, number[]>>(() =>
		Object.fromEntries(ACTIVE_JOINTS.map(id => [id, Array(CHART_POINTS).fill(mockAngle(id, 0))]))
	);
	const [history, setHistory] = useState<HistorySession[]>([
		{ timestamp: '14:32', joints: 'L.Elbow, R.Elbow', duration: '2m 14s', rate: '50Hz' },
		{ timestamp: '14:15', joints: 'L.Knee, R.Knee',   duration: '1m 45s', rate: '50Hz' },
		{ timestamp: '13:58', joints: 'L.Elbow, R.Elbow, L.Knee', duration: '3m 22s', rate: '50Hz' },
	]);

	// Refs for use inside the interval (avoids stale closures)
	const isHeldRef = useRef(false);
	const isRecordingRef = useRef(false);
	const zeroOffsetsRef = useRef<Record<string, number>>({});
	const recordingStartRef = useRef<number | null>(null);
	const recordingDataRef = useRef<{ t: number; angles: Record<string, number> }[]>([]);

	isHeldRef.current = isHeld;
	isRecordingRef.current = isRecording;
	zeroOffsetsRef.current = zeroOffsets;

	useEffect(() => {
		const interval = setInterval(() => {
			if (isHeldRef.current) return;
			const t = performance.now();
			const newAngles: Record<string, number> = {};
			JOINTS.forEach(j => {
				const raw = mockAngle(j.value, t);
				newAngles[j.value] = raw - (zeroOffsetsRef.current[j.value] ?? 0);
			});
			setJointAngles(newAngles);
			setChartData(prev => {
				const next: Record<string, number[]> = {};
				ACTIVE_JOINTS.forEach(id => {
					const buf = [...(prev[id] ?? []), newAngles[id]];
					next[id] = buf.slice(-CHART_POINTS);
				});
				return next;
			});
			if (isRecordingRef.current) {
				recordingDataRef.current.push({ t, angles: { ...newAngles } });
			}
		}, 1000 / samplingRate);
		return () => clearInterval(interval);
	}, [samplingRate]);

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
				/>
			</S.MainLayout>
		</S.Container>
	);
}
