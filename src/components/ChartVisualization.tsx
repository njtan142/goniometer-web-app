import { useState, useEffect, useRef } from 'preact/hooks';
import * as S from '../styles';
import { JOINTS, JOINT_COLORS, NORMATIVE_RANGES, MAX_CHART_DISPLAY_PTS, CHART_POINTS } from '../constants/joints';


interface ChartVisualizationProps {
	activeJoints: string[];
	chartData: Record<string, number[]>;
	chartTimestamps: number[];
	samplingRate: number;
	onAnimateClick: () => void;
}

export function ChartVisualization({ activeJoints, chartData, chartTimestamps, samplingRate, onAnimateClick }: ChartVisualizationProps) {
	const [visibleJoints, setVisibleJoints] = useState<string[]>(activeJoints);
	// visibleCount: how many trailing points to render; scroll wheel shrinks/grows this
	const [visibleCount, setVisibleCount] = useState(CHART_POINTS);
	const chartWrapRef = useRef<HTMLDivElement>(null);
	const chartDataRef = useRef(chartData);
	chartDataRef.current = chartData;

	useEffect(() => {
		setVisibleJoints(activeJoints);
	}, [activeJoints]);

	// Attach non-passive wheel listener so we can call preventDefault().
	// Uses a ref for chartData so the listener is only added/removed once (no churn per packet).
	useEffect(() => {
		const el = chartWrapRef.current;
		if (!el) return;
		const handler = (e: WheelEvent) => {
			e.preventDefault();
			const step = Math.ceil(Math.abs(e.deltaY) / 100) * 10;
			setVisibleCount(prev => {
				const vals = Object.values(chartDataRef.current ?? {});
				const maxPts = vals.length
					? vals.reduce((m, a) => Math.max(m, a.length), CHART_POINTS)
					: CHART_POINTS;
				return Math.max(5, Math.min(maxPts, prev + (e.deltaY > 0 ? step : -step)));
			});
		};
		el.addEventListener('wheel', handler, { passive: false });
		return () => el.removeEventListener('wheel', handler);
	}, []);

	const toggleJoint = (jointId: string) => {
		setVisibleJoints(prev =>
			prev.includes(jointId) ? prev.filter(id => id !== jointId) : [...prev, jointId]
		);
	};

	const getY = (deg: number) => 250 - (deg * (200 / 180));

	const safeChartData: Record<string, number[]> = chartData ?? {};
	const slicedData = Object.fromEntries(
		Object.entries(safeChartData).map(([id, angles]) => [id, angles.slice(-visibleCount)])
	);
	const slicedTimestamps = chartTimestamps.slice(-visibleCount);
	const slicedVals = Object.values(slicedData);
	const pointCount = slicedVals.length
		? slicedVals.reduce((m, a) => Math.max(m, a.length), 1)
		: 1;

	const toPoints = (angles: number[]): string =>
		angles.map((deg, i) => {
			const x = 50 + i * (700 / Math.max(1, angles.length - 1));
			const y = Math.max(50, Math.min(250, getY(deg)));
			return `${x.toFixed(1)},${y.toFixed(1)}`;
		}).join(' ');

	// X-axis: nice time-interval ticks derived from actual timestamps
	const firstRealTs = slicedTimestamps.find(t => t > 0) ?? 0;
	const lastRealTs = [...slicedTimestamps].reverse().find(t => t > 0) ?? 0;
	const totalRangeMs = (firstRealTs > 0 && lastRealTs > firstRealTs)
		? (lastRealTs - firstRealTs) / 1000 : 0;

	// Pick the smallest candidate interval that yields ≤8 ticks
	const TICK_CANDIDATES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 30000, 60000, 120000, 300000, 600000];
	const tickIntervalMs = totalRangeMs > 0
		? (TICK_CANDIDATES.find(c => totalRangeMs / c <= 7) ?? TICK_CANDIDATES[TICK_CANDIDATES.length - 1])
		: 0;

	const formatTickMs = (ms: number): string => {
		if (ms < 1000) return `${Math.round(ms)}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`;
		const m = Math.floor(ms / 60000);
		const s = Math.floor((ms % 60000) / 1000);
		return `${m}:${s.toString().padStart(2, '0')}`;
	};

	// Build tick list: evenly spaced by time, mapped to SVG x coordinate
	const xTicks: { x: number; label: string }[] = [];
	if (tickIntervalMs > 0 && totalRangeMs > 0) {
		for (let tickMs = 0; tickMs <= totalRangeMs + tickIntervalMs * 0.01; tickMs += tickIntervalMs) {
			const frac = Math.min(tickMs / totalRangeMs, 1);
			xTicks.push({ x: 50 + frac * 700, label: formatTickMs(tickMs) });
		}
	} else {
		// Fallback when no real timestamps yet: show a few frame-index labels
		const n = Math.min(5, pointCount);
		for (let i = 0; i < n; i++) {
			xTicks.push({ x: 50 + (i / Math.max(1, n - 1)) * 700, label: `${Math.round(i * (pointCount - 1) / Math.max(1, n - 1))}` });
		}
	}

	const activeTypes = Array.from(new Set(
		visibleJoints.map(id => JOINTS.find(j => j.value === id)?.type).filter(Boolean)
	)) as string[];

	activeTypes.sort((a, b) => {
		const rangeA = NORMATIVE_RANGES[a as keyof typeof NORMATIVE_RANGES];
		const rangeB = NORMATIVE_RANGES[b as keyof typeof NORMATIVE_RANGES];
		return ((rangeB?.max ?? 0) - (rangeB?.min ?? 0)) - ((rangeA?.max ?? 0) - (rangeA?.min ?? 0));
	});

	const patternLineThickness = 0.75;

	const getDynamicColor = (index: number, total: number) => {
		const baseHue = 197;
		const step = 360 / total;
		const hue = (baseHue + index * step) % 360;
		return {
			bg: `hsla(${hue}, 50%, 75%, 1)`,
			line: `hsla(${hue}, 40%, 60%, 1)`,
			glow: `hsla(${hue}, 100%, 60%, 1)`,
		};
	};

	return (
		<S.VisualizationArea>
			<S.Header>
				<div>
					<h1>Goniometer</h1>
					<div className="subtitle">Motion Capture System</div>
				</div>
				<div style={{ textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>
					Rate: <span style={{ color: 'var(--text-highlight)' }}>{samplingRate}Hz</span>
					{visibleCount < CHART_POINTS && (
						<span style={{ marginLeft: '10px', color: 'var(--text-secondary)', fontSize: '12px' }}>
							{visibleCount}pts
						</span>
					)}
				</div>
			</S.Header>

			<S.ChartLegend>
				{activeJoints.map(jointId => {
					const joint = JOINTS.find(j => j.value === jointId);
					const isVisible = visibleJoints.includes(jointId);
					return (
						<S.LegendItem key={jointId} $isActive={isVisible} onClick={() => toggleJoint(jointId)}>
							<div className="dot" style={{ background: JOINT_COLORS[jointId as keyof typeof JOINT_COLORS] }} />
							<span>{joint?.label}</span>
						</S.LegendItem>
					);
				})}
			</S.ChartLegend>

			{/* Wrap SVG in a div to capture non-passive wheel events */}
			<div
				ref={chartWrapRef}
				style={{ flex: 1, minHeight: 0, overflow: 'hidden', cursor: 'crosshair' }}
				title="Scroll to zoom in/out on time axis"
			>
				<S.SvgChart viewBox="0 0 800 300">
					<defs>
						{activeTypes.map((type, i) => {
							const colors = getDynamicColor(i, activeTypes.length);
							const patternSize = 8;
							const offset = i * 3;
							return (
								<pattern
									key={`pattern-def-${type}`}
									id={`pattern-${type}`}
									patternUnits="userSpaceOnUse"
									width={patternSize}
									height={patternSize}
									patternTransform={`rotate(45) translate(${offset}, 0)`}
								>
									<rect width={patternSize} height={patternSize} fill="white" fillOpacity="0.3" />
									<rect x={(patternSize - patternLineThickness) / 2} y="0" width={patternLineThickness} height={patternSize} fill={colors.bg} />
									<rect x="0" y={(patternSize - patternLineThickness) / 2} width={patternSize} height={patternLineThickness} fill={colors.bg} />
								</pattern>
							);
						})}
					</defs>

					{activeTypes.map((type) => {
						const range = NORMATIVE_RANGES[type as keyof typeof NORMATIVE_RANGES];
						if (!range) return null;
						const yTop = getY(range.max);
						const yBottom = getY(range.min);
						return (
							<rect
								key={`range-rect-${type}`}
								x="50" y={yTop} width="700" height={yBottom - yTop}
								fill={`url(#pattern-${type})`}
								stroke="#eee" strokeWidth="1"
							/>
						);
					})}

					{activeTypes.map((type, i) => {
						const range = NORMATIVE_RANGES[type as keyof typeof NORMATIVE_RANGES];
						if (!range) return null;
						const yBottom = getY(range.min);
						const colors = getDynamicColor(i, activeTypes.length);
						return (
							<text
								key={`range-label-${type}`}
								x="740" y={yBottom - 14 - i * 18}
								textAnchor="end" fontSize="14" fill="white"
								style={{ fontWeight: 600, textShadow: `0 0 4px ${colors.glow}, 0 0 2px ${colors.glow}` }}
							>
								{range.label} ✓
							</text>
						);
					})}

					<line x1="50" y1="250" x2="750" y2="250" stroke="var(--shadow-dark)" />
					<line x1="50" y1="50" x2="50" y2="250" stroke="var(--shadow-dark)" />

					{[0, 45, 90, 135, 180].map((val, i) => (
						<text key={`y-${i}`} x="30" y={250 - i * 50} fontSize="14" textAnchor="end" fill="var(--text-secondary)">
							{val}
						</text>
					))}

					{[50, 100, 150, 200].map((y, i) => (
						<line key={`grid-${i}`} x1="50" y1={250 - y} x2="750" y2={250 - y} stroke="var(--shadow-dark)" strokeDasharray="2" />
					))}

					{visibleJoints.map((jointId, idx) => {
						const angles = slicedData[jointId] ?? [];
						if (angles.length === 0) return null;

						const pointsStr = toPoints(angles);
						const n = angles.length;
						// Only compute per-point data when zoomed in enough to benefit from dots
						const showPoints = visibleCount <= 100;
						const points = showPoints
							? angles.map((deg, i) => ({
								x: 50 + i * (700 / Math.max(1, n - 1)),
								y: Math.max(50, Math.min(250, getY(deg))),
								deg,
							}))
							: [];

						const joint = JOINTS.find(j => j.value === jointId);
						const range = joint ? NORMATIVE_RANGES[joint.type as keyof typeof NORMATIVE_RANGES] : null;

						return (
							<g key={`group-${jointId}`}>
								<polyline
									points={pointsStr}
									fill="none"
									stroke={JOINT_COLORS[jointId as keyof typeof JOINT_COLORS]}
									strokeWidth="2"
									opacity={1 - idx * 0.15}
								/>
								{showPoints && range && points.map((p, i) => {
									const isNormative = p.deg >= range.min && p.deg <= range.max;
									if (!isNormative) {
										return (
											<text
												key={`warn-${jointId}-${i}`}
												x={p.x} y={p.y + 4}
												textAnchor="middle" fontSize="14" fill="#f44336"
												style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))' }}
											>
												⚠
											</text>
										);
									}
									return (
										<g key={`point-${jointId}-${i}`}>
											<circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={JOINT_COLORS[jointId as keyof typeof JOINT_COLORS]} strokeWidth="1" />
											<circle cx={p.x} cy={p.y} r="2.5" fill={JOINT_COLORS[jointId as keyof typeof JOINT_COLORS]} />
										</g>
									);
								})}
							</g>
						);
					})}

					{/* X-axis time labels */}
					{xTicks.map(({ x, label }, i) => (
						<text
							key={`x-${i}`}
							x={x}
							y="270"
							fontSize="11"
							textAnchor="middle"
							fill="var(--text-secondary)"
						>
							{label}
						</text>
					))}
				</S.SvgChart>
			</div>

			<S.AnimateButtonContainer>
				<S.Button onClick={onAnimateClick}>Animate</S.Button>
			</S.AnimateButtonContainer>
		</S.VisualizationArea>
	);
}
