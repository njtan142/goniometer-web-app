import * as S from '../styles';
import { JOINTS, JOINT_COLORS, JOINT_DATA } from '../constants/joints';

interface ChartVisualizationProps {
	activeJoints: string[];
	onAnimateClick: () => void;
}

export function ChartVisualization({ activeJoints, onAnimateClick }: ChartVisualizationProps) {
	return (
		<S.VisualizationArea>
			<S.Header>
				<div>
					<h1>Goniometer</h1>
					<div className="subtitle">Motion Capture System</div>
				</div>
				<div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
					Rate: <span style={{ color: '#2196f3' }}>50Hz</span>
				</div>
			</S.Header>

			<S.ChartLegend>
				{activeJoints.map(jointId => {
					const joint = JOINTS.find(j => j.value === jointId);
					return (
						<S.LegendItem key={jointId}>
							<div className="dot" style={{ background: JOINT_COLORS[jointId] }} />
							<span>{joint?.label}</span>
						</S.LegendItem>
					);
				})}
			</S.ChartLegend>

			<S.SvgChart viewBox="0 0 800 300">
				<line x1="50" y1="250" x2="750" y2="250" stroke="#ddd" />
				<line x1="50" y1="50" x2="50" y2="250" stroke="#ddd" />

				{/* Y-axis labels */}
				{[0, 45, 90, 135, 180].map((val, i) => (
					<text key={`y-${i}`} x="30" y={250 - (i * 50)} fontSize="12" textAnchor="end" fill="#999">
						{val}
					</text>
				))}

				{/* Grid lines */}
				{[50, 100, 150, 200].map((y, i) => (
					<line key={`grid-${i}`} x1="50" y1={250 - y} x2="750" y2={250 - y} stroke="#f5f5f5" strokeDasharray="2" />
				))}

				{/* Sample data lines for active joints */}
				{activeJoints.map((jointId, idx) => (
					<polyline
						key={`line-${jointId}`}
						points={JOINT_DATA[jointId]}
						fill="none"
						stroke={JOINT_COLORS[jointId]}
						strokeWidth="2"
						opacity={1 - idx * 0.15}
					/>
				))}

				{/* X-axis labels */}
				{Array.from({ length: 29 }).map((_, i) => (
					<text key={`x-${i}`} x={50 + i * 25} y="270" fontSize="11" textAnchor="middle" fill="#999">
						{i}
					</text>
				))}
			</S.SvgChart>
			<S.AnimateButtonContainer>
				<S.Button onClick={onAnimateClick}>Animate</S.Button>
			</S.AnimateButtonContainer>
		</S.VisualizationArea>
	);
}
