import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { jsPDF } from 'jspdf';
import * as S from '../styles';
import { GaugePanel } from './GaugePanel';
import { ControlPanelTop } from './ControlPanelTop';
import { PlaybackPanel } from './PlaybackPanel';
import { ChartVisualization } from './ChartVisualization';
import { AnimateModal } from './AnimateModal';
import { StatusSidebar } from './StatusSidebar';
import { JOINTS, JOINT_COLORS, NORMATIVE_RANGES } from '../constants/joints';
import { WebRTCClient, SensorReading } from '../lib/webrtc';
import { WSClient } from '../lib/ws';

export const CHART_POINTS = 29;
export const ACTIVE_JOINTS = ['left-elbow', 'right-elbow', 'left-knee', 'right-knee'];

export interface HistorySession {
	timestamp: string;
	joints: string;
	duration: string;
	rate: string;
	/** Raw recording frames — present when the session was recorded in this browser tab or imported from JSON */
	rawData?: { t: number; angles: Record<string, number> }[];
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
	const [chartTimestamps, setChartTimestamps] = useState<number[]>(
		() => Array(CHART_POINTS).fill(0)
	);
	const [history, setHistory] = useState<HistorySession[]>([]);
	const [playbackSession, setPlaybackSession] = useState<HistorySession | null>(null);
	const [playbackFrameIdx, setPlaybackFrameIdx] = useState(0);

	const isHeldRef          = useRef(false);
	const isRecordingRef     = useRef(false);
	const zeroOffsetsRef     = useRef<Record<string, number>>({});
	const recordingStartRef  = useRef<number | null>(null);
	const recordingDataRef   = useRef<{ t: number; angles: Record<string, number> }[]>([]);
	const playbackSessionRef = useRef<HistorySession | null>(null);
	// Accumulates every live frame (firmware µs timestamp) — never capped, enables full zoom-out
	const liveHistoryRef     = useRef<{ t: number; angles: Record<string, number> }[]>([]);

	isHeldRef.current          = isHeld;
	isRecordingRef.current     = isRecording;
	zeroOffsetsRef.current     = zeroOffsets;
	playbackSessionRef.current = playbackSession;

	// ── Playback-derived display data ────────────────────────────────────
	const displayChartData = useMemo(() => {
		if (playbackSession?.rawData?.length) {
			// Full history from start to current frame (enables zoom-out in playback)
			const slice = playbackSession.rawData.slice(0, playbackFrameIdx + 1);
			return Object.fromEntries(ACTIVE_JOINTS.map(id => [id, slice.map(d => d.angles[id] ?? 0)]));
		}
		const hist = liveHistoryRef.current;
		if (hist.length === 0) return chartData;
		return Object.fromEntries(ACTIVE_JOINTS.map(id => [id, hist.map(d => d.angles[id] ?? 0)]));
	}, [playbackSession, playbackFrameIdx, chartData]);

	const displayTimestamps = useMemo(() => {
		if (playbackSession?.rawData?.length) {
			// rawData.t is performance.now() ms → ×1000 to match firmware µs units
			return playbackSession.rawData.slice(0, playbackFrameIdx + 1).map(d => d.t * 1000);
		}
		const hist = liveHistoryRef.current;
		if (hist.length === 0) return chartTimestamps;
		return hist.map(d => d.t); // firmware µs
	}, [playbackSession, playbackFrameIdx, chartTimestamps]);

	const displayJointAngles = useMemo(() => {
		if (!playbackSession?.rawData?.length) return jointAngles;
		const frame = playbackSession.rawData[playbackFrameIdx];
		if (!frame) return jointAngles;
		return { ...jointAngles, ...frame.angles };
	}, [playbackSession, playbackFrameIdx, jointAngles]);

	// ── Shared packet handler ─────────────────────────────────────────────
	const handlePacket = (readings: SensorReading[]) => {
		// Drop live data while in playback mode or held
		if (isHeldRef.current || playbackSessionRef.current) return;
		const soc = readings[0]?.soc_pct ?? 0;
		setBatteryPct(Math.round(soc));
		const firmwareTs = readings[0]?.timestamp ?? 0; // µs
		const newAngles: Record<string, number> = {};
		readings.forEach(r => {
			const jointId = ACTIVE_JOINTS[r.sensorIndex];
			if (!jointId) return;
			newAngles[jointId] = r.degrees - (zeroOffsetsRef.current[jointId] ?? 0);
		});
		liveHistoryRef.current.push({ t: firmwareTs, angles: { ...newAngles } });
		setJointAngles(prev => ({ ...prev, ...newAngles }));
		setChartData(prev => {
			const next = { ...prev };
			Object.entries(newAngles).forEach(([id, deg]) => {
				next[id] = [...(prev[id] ?? []), deg].slice(-CHART_POINTS);
			});
			return next;
		});
		setChartTimestamps(prev => [...prev, firmwareTs].slice(-CHART_POINTS));
		if (isRecordingRef.current) {
			recordingDataRef.current.push({ t: performance.now(), angles: { ...newAngles } });
		}
	};

	// ── Live mode: WebRTC (LFLL) ────────────────────────────────────────
	// Also gated on playbackSession: entering playback disconnects WebRTC so it
	// frees up resources, and the cleanup + re-run reconnects when playback exits.
	useEffect(() => {
		if (mode !== 'live') return;
		if (playbackSession !== null) return;
		const client = new WebRTCClient({
			onPacket: handlePacket,
			onConnected:    () => setIsConnected(true),
			onDisconnected: () => setIsConnected(false),
		});
		client.connect().catch(err =>
			console.info('WebRTC unavailable, using mock data:', err.message)
		);
		return () => { client.close(); setIsConnected(false); };
	}, [mode, playbackSession]);

	// ── Record mode: WebSocket (HFHL) ───────────────────────────────────
	useEffect(() => {
		if (mode !== 'record') return;
		let client: WSClient | null = null;
		const timer = setTimeout(() => {
			client = new WSClient({
				onPacket: handlePacket,
				onConnected:    () => setIsConnected(true),
				onDisconnected: () => {
					setIsConnected(false);
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
			rawData: [...recordingDataRef.current],
		}, ...prev]);
	};

	const handleRecordingToggle = () => {
		if (!isRecording) {
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

	// ── Export CSV (live recording) ───────────────────────────────────────
	const handleExport = () => {
		const data = recordingDataRef.current;
		if (data.length === 0) {
			alert('No recording data. Start a recording session first.');
			return;
		}
		downloadCSV(data, `goniometer_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.csv`);
	};

	// ── Export CSV helper ─────────────────────────────────────────────────
	const downloadCSV = (data: { t: number; angles: Record<string, number> }[], filename: string) => {
		const headers = ['time_ms', ...ACTIVE_JOINTS];
		const rows = data.map(d => [
			d.t.toFixed(1),
			...ACTIVE_JOINTS.map(id => (d.angles[id] ?? 0).toFixed(2)),
		]);
		const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		triggerDownload(blob, filename);
	};

	// ── Export JSON ───────────────────────────────────────────────────────
	const handleExportJSON = () => {
		const data = recordingDataRef.current;
		if (data.length === 0) {
			alert('No recording data. Start a recording session first.');
			return;
		}
		const baselineT = data[0].t;
		const exported = {
			metadata: {
				exportedAt:  new Date().toISOString(),
				joints:      ACTIVE_JOINTS,
				samplingRate: framesPerPacket * packetFreqHz,
				durationMs:  +(data[data.length - 1].t - baselineT).toFixed(1),
			},
			frames: data.map(d => ({
				relativeMs: +(d.t - baselineT).toFixed(1),
				angles:     Object.fromEntries(ACTIVE_JOINTS.map(id => [id, +(d.angles[id] ?? 0).toFixed(2)])),
			})),
		};
		const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
		triggerDownload(blob, `goniometer_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`);
	};

	// ── Import JSON ───────────────────────────────────────────────────────
	const handleImportJSON = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			try {
				const text = await file.text();
				const parsed = JSON.parse(text);
				if (!parsed.metadata?.joints || !Array.isArray(parsed.frames)) {
					throw new Error('Invalid format — missing metadata.joints or frames array');
				}
				const rawData = (parsed.frames as { relativeMs: number; angles: Record<string, number> }[]).map(f => ({
					t:      f.relativeMs,
					angles: f.angles,
				}));
				const durationMs = parsed.metadata.durationMs ?? 0;
				const totalSecs  = Math.round(durationMs / 1000);
				const mins = Math.floor(totalSecs / 60);
				const secs = totalSecs % 60;
				const joints = (parsed.metadata.joints as string[]).map((id: string) => {
					const j = JOINTS.find(j => j.value === id);
					return j?.label.replace('Left ', 'L.').replace('Right ', 'R.') ?? id;
				}).join(', ');
				const session: HistorySession = {
					timestamp: file.name.replace(/\.[^.]+$/, '').slice(0, 20),
					joints,
					duration: mins > 0 ? `${mins}m ${secs}s` : `${secs}s`,
					rate:     `${parsed.metadata.samplingRate}Hz`,
					rawData,
				};
				setHistory(prev => [session, ...prev]);
			} catch (err: unknown) {
				alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
			}
		};
		input.click();
	};

	// ── PDF report (playback mode only) ──────────────────────────────────
	const handleGeneratePDF = () => {
		if (!playbackSession?.rawData?.length) {
			alert('Open a recorded session from history first.');
			return;
		}

		const rawData  = playbackSession.rawData;
		const baseT    = rawData[0].t;
		const totalMs  = rawData[rawData.length - 1].t - baseT;

		// Downsample to at most 400 chart points to keep the PDF fast and lean
		const MAX_PTS  = 400;
		const step     = Math.max(1, Math.ceil(rawData.length / MAX_PTS));
		const chartPts = rawData.filter((_, i) => i % step === 0 || i === rawData.length - 1);

		// Per-joint stats over the full (non-downsampled) recording
		const stats: Record<string, { min: number; max: number; rom: number }> = {};
		ACTIVE_JOINTS.forEach(id => {
			const vals = rawData.map(d => d.angles[id] ?? 0);
			const min  = vals.reduce((a, v) => Math.min(a, v), Infinity);
			const max  = vals.reduce((a, v) => Math.max(a, v), -Infinity);
			stats[id]  = { min, max, rom: max - min };
		});

		// Joint types present in the recording (for normative bands)
		const jointTypes = Array.from(new Set(
			ACTIVE_JOINTS.map(id => JOINTS.find(j => j.value === id)?.type).filter(Boolean)
		)) as string[];

		// Pre-computed "rgba on white" blended fill colors for each joint type
		const BAND_COLORS: Record<string, [number, number, number]> = {
			elbow:    [218, 232, 255],
			knee:     [225, 252, 239],
			shoulder: [247, 212, 253],
			hip:      [255, 249, 210],
			wrist:    [210, 254, 255],
			ankle:    [255, 220, 220],
		};

		const hexToRgb = (hex: string): [number, number, number] => [
			parseInt(hex.slice(1, 3), 16),
			parseInt(hex.slice(3, 5), 16),
			parseInt(hex.slice(5, 7), 16),
		];

		// Chart area bounds (mm on A4 portrait)
		const CL = 25, CR = 190, CT = 118, CB = 196;
		const CW = CR - CL, CH = CB - CT;
		// angle=0° → bottom of chart; angle=180° → top
		const px = (relT: number)   => CL + (relT / (totalMs || 1)) * CW;
		const py = (angle: number)  => CB - Math.max(0, Math.min(1, angle / 180)) * CH;

		const doc = new jsPDF('p', 'mm', 'a4');

		// ── Header ────────────────────────────────────────────────────────
		let y = 22;
		doc.setFontSize(20);
		doc.setFont('helvetica', 'bold');
		doc.text('Goniometer Clinical Report', 105, y, { align: 'center' });
		y += 10;

		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text(`Generated: ${new Date().toLocaleString()}`, 105, y, { align: 'center' });
		y += 7;

		doc.text(
			`Session: ${playbackSession.timestamp}  ·  ${playbackSession.duration}  ·  ${playbackSession.rate}  ·  ${rawData.length} frames`,
			20, y
		);
		y += 12;

		// ── ROM table (no Mean) ───────────────────────────────────────────
		doc.setFontSize(13);
		doc.setFont('helvetica', 'bold');
		doc.text('Range of Motion Summary', 20, y);
		y += 8;

		doc.setFontSize(10);
		doc.text('Joint', 20, y);
		doc.text('Min (°)', 90, y);
		doc.text('Max (°)', 125, y);
		doc.text('ROM (°)', 158, y);
		y += 3;
		doc.setLineWidth(0.3);
		doc.setDrawColor(100, 100, 100);
		doc.line(20, y, 190, y);
		y += 6;

		doc.setFont('helvetica', 'normal');
		ACTIVE_JOINTS.forEach(id => {
			const joint = JOINTS.find(j => j.value === id);
			const s = stats[id];
			if (!s) return;
			doc.text(joint?.label ?? id, 20, y);
			doc.text(s.min.toFixed(1), 90, y);
			doc.text(s.max.toFixed(1), 125, y);
			doc.text(s.rom.toFixed(1), 158, y);
			y += 7;
		});

		y += 4;
		doc.setDrawColor(100, 100, 100);
		doc.line(20, y, 190, y);
		y += 8;

		// ── Chart heading ─────────────────────────────────────────────────
		doc.setFontSize(13);
		doc.setFont('helvetica', 'bold');
		doc.text('Angle Over Time', 20, y);
		y += 6;
		doc.setFontSize(8);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(120, 120, 120);
		doc.text('Red markers: reading outside normative ROM.', 20, y);
		doc.setTextColor(0, 0, 0);

		// ── Chart background ──────────────────────────────────────────────
		doc.setFillColor(255, 255, 255);
		doc.rect(CL, CT, CW, CH, 'F');

		// Normative range bands — widest first so narrower type renders on top
		const sortedTypes = [...jointTypes].sort((a, b) => {
			const ra = NORMATIVE_RANGES[a as keyof typeof NORMATIVE_RANGES];
			const rb = NORMATIVE_RANGES[b as keyof typeof NORMATIVE_RANGES];
			return (rb?.max ?? 0) - (ra?.max ?? 0);
		});
		sortedTypes.forEach(type => {
			const range = NORMATIVE_RANGES[type as keyof typeof NORMATIVE_RANGES];
			if (!range) return;
			const rgb     = BAND_COLORS[type] ?? [230, 230, 230];
			const bandTop = py(range.max);
			const bandBot = py(range.min);
			doc.setFillColor(rgb[0], rgb[1], rgb[2]);
			doc.rect(CL, bandTop, CW, bandBot - bandTop, 'F');
		});

		// Horizontal gridlines at every 45°
		doc.setLineWidth(0.2);
		[0, 45, 90, 135, 180].forEach(deg => {
			doc.setDrawColor(210, 210, 210);
			doc.line(CL, py(deg), CR, py(deg));
		});

		// Y-axis labels
		doc.setFontSize(7);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 100, 100);
		[0, 45, 90, 135, 180].forEach(deg => {
			doc.text(`${deg}°`, CL - 1.5, py(deg) + 1, { align: 'right' });
		});

		// X-axis time ticks
		[0, 0.25, 0.5, 0.75, 1.0].forEach(frac => {
			const relT  = frac * totalMs;
			const xPos  = CL + frac * CW;
			const label = relT < 1000 ? `${Math.round(relT)}ms` : `${(relT / 1000).toFixed(1)}s`;
			doc.setDrawColor(210, 210, 210);
			doc.setLineWidth(0.2);
			doc.line(xPos, CT, xPos, CB);
			doc.setTextColor(100, 100, 100);
			doc.setFontSize(7);
			doc.text(label, xPos, CB + 4.5, { align: 'center' });
		});
		doc.setTextColor(0, 0, 0);

		// ── Per-joint: polyline + out-of-range markers ────────────────────
		ACTIVE_JOINTS.forEach(id => {
			const joint    = JOINTS.find(j => j.value === id);
			const range    = joint ? NORMATIVE_RANGES[joint.type as keyof typeof NORMATIVE_RANGES] : null;
			const [r, g, b] = hexToRgb(JOINT_COLORS[id as keyof typeof JOINT_COLORS] ?? '#888888');

			// Polyline
			doc.setDrawColor(r, g, b);
			doc.setLineWidth(0.45);
			for (let i = 1; i < chartPts.length; i++) {
				const prev = chartPts[i - 1];
				const curr = chartPts[i];
				doc.line(
					px(prev.t - baseT), py(prev.angles[id] ?? 0),
					px(curr.t - baseT), py(curr.angles[id] ?? 0)
				);
			}

			// Out-of-range markers — red filled square at each violating sample
			if (range) {
				doc.setFillColor(220, 50, 50);
				chartPts.forEach(pt => {
					const angle = pt.angles[id] ?? 0;
					if (angle < range.min || angle > range.max) {
						const mx = px(pt.t - baseT);
						const my = py(angle);
						doc.rect(mx - 0.85, my - 0.85, 1.7, 1.7, 'F');
					}
				});
			}
		});

		// Chart border
		doc.setDrawColor(150, 150, 150);
		doc.setLineWidth(0.3);
		doc.rect(CL, CT, CW, CH, 'S');

		// ── Legend ────────────────────────────────────────────────────────
		const LY1 = CB + 11;
		const LY2 = LY1 + 6;
		const LY3 = LY2 + 6;
		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');

		// Joint line colours
		let lx = CL;
		ACTIVE_JOINTS.forEach(id => {
			const joint = JOINTS.find(j => j.value === id);
			const [r, g, b] = hexToRgb(JOINT_COLORS[id as keyof typeof JOINT_COLORS] ?? '#888888');
			doc.setFillColor(r, g, b);
			doc.rect(lx, LY1 - 2.5, 5, 2.5, 'F');
			doc.setTextColor(50, 50, 50);
			doc.text(joint?.label ?? id, lx + 6, LY1);
			lx += 42;
		});

		// Normative bands
		lx = CL;
		sortedTypes.forEach(type => {
			const range = NORMATIVE_RANGES[type as keyof typeof NORMATIVE_RANGES];
			const rgb   = BAND_COLORS[type] ?? [230, 230, 230];
			doc.setFillColor(rgb[0], rgb[1], rgb[2]);
			doc.rect(lx, LY2 - 2.5, 5, 2.5, 'F');
			doc.setDrawColor(150, 150, 150);
			doc.setLineWidth(0.2);
			doc.rect(lx, LY2 - 2.5, 5, 2.5, 'S');
			doc.setTextColor(80, 80, 80);
			doc.text(`${range?.label ?? type}: 0–${range?.max}°`, lx + 6, LY2);
			lx += 88;
		});

		// Violation marker
		doc.setFillColor(220, 50, 50);
		doc.rect(CL, LY3 - 2.5, 5, 2.5, 'F');
		doc.setTextColor(80, 80, 80);
		doc.text('Outside normative ROM', CL + 6, LY3);

		// ── Footer ────────────────────────────────────────────────────────
		doc.setTextColor(170, 170, 170);
		doc.setFontSize(7);
		doc.setFont('helvetica', 'italic');
		doc.text('Generated by Goniometer Motion Capture System', 105, 290, { align: 'center' });

		doc.save(`goniometer_report_${new Date().toISOString().slice(0, 10)}.pdf`);
	};

	// ── Playback ──────────────────────────────────────────────────────────
	const handleSessionClick = (session: HistorySession) => {
		if (!session.rawData?.length) return;
		setPlaybackSession(session);
		setPlaybackFrameIdx(0);
	};

	const handlePlaybackClose = () => {
		setPlaybackSession(null);
		setPlaybackFrameIdx(0);
	};

	const handlePlaybackExportCSV = () => {
		if (!playbackSession?.rawData?.length) return;
		downloadCSV(
			playbackSession.rawData,
			`goniometer_playback_${playbackSession.timestamp.replace(/:/g, '-')}.csv`
		);
	};

	// ── Shared download helper ────────────────────────────────────────────
	const triggerDownload = (blob: Blob, filename: string) => {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<S.Container>
			<S.MainLayout>
				<S.LeftSection>
					<S.TopPanel>
						<GaugePanel
							angle={displayJointAngles[selectedJoint] ?? 0}
							selectedJoint={selectedJoint}
							onJointChange={setSelectedJoint}
						/>
						{playbackSession ? (
							<PlaybackPanel
								session={playbackSession}
								currentFrame={playbackFrameIdx}
								onFrameChange={setPlaybackFrameIdx}
								onClose={handlePlaybackClose}
								onExportCSV={handlePlaybackExportCSV}
								onGeneratePDF={handleGeneratePDF}
							/>
						) : (
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
								onExportJSON={handleExportJSON}
								onImportJSON={handleImportJSON}
								onSetZero={handleSetZero}
							/>
						)}
					</S.TopPanel>
					<ChartVisualization
						key={playbackSession ? `pb-${playbackSession.timestamp}` : 'live'}
						activeJoints={ACTIVE_JOINTS}
						chartData={displayChartData}
						chartTimestamps={displayTimestamps}
						samplingRate={framesPerPacket * packetFreqHz}
						onAnimateClick={() => setShowAnimateModal(true)}
					/>
				</S.LeftSection>

				<AnimateModal
					isOpen={showAnimateModal}
					onClose={() => setShowAnimateModal(false)}
					targetJoint='leftElbow'
					liveAngle={displayJointAngles['left-elbow']}
				/>

				<StatusSidebar
					activeJoints={ACTIVE_JOINTS}
					jointAngles={displayJointAngles}
					chartData={displayChartData}
					history={history}
					batteryPct={batteryPct}
					isConnected={isConnected}
					onSessionClick={handleSessionClick}
					onImportJSON={handleImportJSON}
				/>
			</S.MainLayout>
		</S.Container>
	);
}
