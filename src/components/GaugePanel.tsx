import * as S from '../styles';
import { JOINTS } from '../constants/joints';
import { useMemo } from 'preact/hooks';

interface GaugePanelProps {
	angle: number;
	selectedJoint: string;
	onJointChange: (joint: string) => void;
}

export function GaugePanel({ angle, selectedJoint, onJointChange }: GaugePanelProps) {
	const size = 130;
	const center = size / 2;
	const radius = size / 2 - 5; // Reduced radius slightly to account for stroke/padding

	const ticks = useMemo(() => {
		const result = [];
		for (let i = 0; i < 360; i += 10) {
			const isMajor = i % 30 === 0;
			const tickLen = isMajor ? 10 : 5;
			// Convert to radians (SVG coordinates: 0 is right (3 o'clock), clockwise is positive)
			// Wait, standard Math.cos/sin: 0 is right, CCW is positive y-down...
			// SVG y increases downwards.
			// 0 deg: (1, 0) -> Right.
			// 90 deg: (0, 1) -> Bottom.
			// So SVG angle is Clockwise from Right.
			
			// We want 0 at Right, increasing CCW? 
			// Standard math: 0 Right, 90 Up.
			// SVG: 0 Right, 90 Down.
			// To match standard math (CCW): angle = -i
			const theta = ( -i * Math.PI) / 180;
			
			const x1 = center + (radius - tickLen) * Math.cos(theta);
			const y1 = center + (radius - tickLen) * Math.sin(theta);
			const x2 = center + radius * Math.cos(theta);
			const y2 = center + radius * Math.sin(theta);

			result.push(
				<line
					key={`tick-${i}`}
					x1={x1}
					y1={y1}
					x2={x2}
					y2={y2}
					stroke="var(--text-secondary)"
					strokeWidth={isMajor ? 1.5 : 1}
				/>
			);

			if (isMajor) {
				const textRadius = radius - 18;
				const tx = center + textRadius * Math.cos(theta);
				const ty = center + textRadius * Math.sin(theta);
				result.push(
					<text
						key={`text-${i}`}
						x={tx}
						y={ty}
						textAnchor="middle"
						dominantBaseline="middle" // This might be dominant-baseline in SVG
						fontSize="8"
						fill="var(--text-main)"
						style={{ userSelect: 'none', pointerEvents: 'none' }}
					>
						{i}
					</text>
				);
			}
		}
		return result;
	}, [center, radius]);

	return (
		<S.GaugeSection>
			<div>
				<S.JointSelector value={selectedJoint} onChange={e => onJointChange(e.target.value)}>
					{JOINTS.map(joint => (
						<option key={joint.value} value={joint.value}>
							{joint.label}
						</option>
					))}
				</S.JointSelector>
				<S.GaugeContainer>
					<svg width={size} height={size} style={{ overflow: 'visible' }}>
						{/* Background circle removed/transparent to let container gradient show */}
						<circle cx={center} cy={center} r={radius} fill="none" stroke="var(--shadow-dark)" strokeWidth="0.5" opacity="0.5" />
						{ticks}

						{/* Needle - Rotate by -angle to match the CCW scale */}
						<g transform={`rotate(${-angle}, ${center}, ${center})`}>
							<line
								x1={center}
								y1={center}
								x2={center + radius - 5}
								y2={center}
								stroke="#d32f2f"
								strokeWidth="2"
								strokeLinecap="round"
							/>
							<polygon
								points={`${center + radius},${center} ${center + radius - 8},${center - 4} ${center + radius - 8},${center + 4}`}
								fill="#d32f2f"
							/>
							<circle cx={center} cy={center} r="4" fill="#d32f2f" />
						</g>
					</svg>
					<div
						style={{
							position: 'absolute',
							bottom: '25%',
							width: '100%',
							textAlign: 'center',
							fontSize: '16px',
							fontWeight: 'bold',
							pointerEvents: 'none',
                            color: 'var(--text-main)'
						}}
					>
						{angle.toFixed(1)}°
					</div>
				</S.GaugeContainer>
				<div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Zero</div>
			</div>
		</S.GaugeSection>
	);
}
