import { useState, useEffect } from 'preact/hooks';
import * as S from '../styles';
import { JOINTS, JOINT_COLORS, JOINT_DATA, NORMATIVE_RANGES } from '../constants/joints';

interface ChartVisualizationProps {
	activeJoints: string[];
	onAnimateClick: () => void;
}

export function ChartVisualization({ activeJoints, onAnimateClick }: ChartVisualizationProps) {
	const [visibleJoints, setVisibleJoints] = useState<string[]>(activeJoints);

	useEffect(() => {
		setVisibleJoints(activeJoints);
	}, [activeJoints]);

	const toggleJoint = (jointId: string) => {
		setVisibleJoints(prev => 
			prev.includes(jointId)
				? prev.filter(id => id !== jointId)
				: [...prev, jointId]
		);
	};

	const getY = (deg: number) => 250 - (deg * (200 / 180));
	const getDeg = (y: number) => (250 - y) * (180 / 200);

	const activeTypes = Array.from(new Set(
		visibleJoints.map(id => JOINTS.find(j => j.value === id)?.type).filter(Boolean)
	)) as string[];

	// Sort types by range size (max - min) so larger ranges are rendered first (at the back)
	activeTypes.sort((a, b) => {
		const rangeA = NORMATIVE_RANGES[a as keyof typeof NORMATIVE_RANGES];
		const rangeB = NORMATIVE_RANGES[b as keyof typeof NORMATIVE_RANGES];
		const heightA = (rangeA?.max || 0) - (rangeA?.min || 0);
		const heightB = (rangeB?.max || 0) - (rangeB?.min || 0);
		return heightB - heightA;
	});

	const patternLineThickness = 0.75; // Thinner lines for the grid

	const getDynamicColor = (index: number, total: number) => {
		const baseHue = 197; // Sky blue
		const step = 360 / total;
		const hue = (baseHue + (index * step)) % 360;
		return {
			bg: `hsla(${hue}, 50%, 75%, 1)`, // Lower saturation (pastel), opaque
			line: `hsla(${hue}, 40%, 60%, 1)`,
			glow: `hsla(${hue}, 100%, 60%, 1)`
		};
	};

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
					const isVisible = visibleJoints.includes(jointId);
					return (
						<S.LegendItem 
							key={jointId} 
							style={{ cursor: 'pointer', opacity: isVisible ? 1 : 0.5 }}
							onClick={() => toggleJoint(jointId)}
						>
							<input 
								type="checkbox" 
								checked={isVisible} 
								readOnly 
								style={{ cursor: 'pointer', marginRight: '4px' }}
							/>
							<div className="dot" style={{ background: JOINT_COLORS[jointId as keyof typeof JOINT_COLORS] }} />
							<span>{joint?.label}</span>
						</S.LegendItem>
					);
				})}
			</S.ChartLegend>

			<S.SvgChart viewBox="0 0 800 300">
				<defs>
					{activeTypes.map((type, i) => {
						const colors = getDynamicColor(i, activeTypes.length);
						// Fixed angle (cross pattern), just offset the starting position
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
								{/* Vertical line */}
								<rect x={(patternSize - patternLineThickness) / 2} y="0" width={patternLineThickness} height={patternSize} fill={colors.bg} />
								{/* Horizontal line */}
								<rect x="0" y={(patternSize - patternLineThickness) / 2} width={patternSize} height={patternLineThickness} fill={colors.bg} />
							</pattern>
						);
					})}
				</defs>

				{/* Background Ranges - Rendered first */}
				{activeTypes.map((type, i) => {
					const range = NORMATIVE_RANGES[type as keyof typeof NORMATIVE_RANGES];
					if (!range) return null;
					
					const yTop = getY(range.max);
					const yBottom = getY(range.min);
					const height = yBottom - yTop;

					return (
						<rect 
							key={`range-rect-${type}`}
							x="50" 
							y={yTop} 
							width="700" 
							height={height} 
							fill={`url(#pattern-${type})`}
							stroke="#eee"
							strokeWidth="1"
						/>
					);
				})}

				{/* Range Labels - Rendered on top of all ranges */}
				{activeTypes.map((type, i) => {
					const range = NORMATIVE_RANGES[type as keyof typeof NORMATIVE_RANGES];
					if (!range) return null;
					
					const yBottom = getY(range.min);
					const colors = getDynamicColor(i, activeTypes.length);

					return (
						<text 
							key={`range-label-${type}`}
							x="740" 
							y={yBottom - 10 - (i * 12)} 
							textAnchor="end" 
							fontSize="10" 
							fill="white"
							style={{ 
								fontWeight: 600, 
								textShadow: `0 0 4px ${colors.glow}, 0 0 2px ${colors.glow}`
							}}
						>
							{range.label} ✓
						</text>
					);
				})}

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
				{visibleJoints.map((jointId, idx) => {
					const pointsStr = JOINT_DATA[jointId as keyof typeof JOINT_DATA];
					const points = pointsStr.split(' ').map(p => {
						const [x, y] = p.split(',').map(Number);
						return { x, y };
					});
					
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
							{range && points.map((p, i) => {
								const deg = getDeg(p.y);
								const isNormative = deg >= range.min && deg <= range.max;
								
								if (!isNormative) {
									return (
										<g key={`point-warning-${jointId}-${i}`}>
											<text
												x={p.x}
												y={p.y + 4}
												textAnchor="middle"
												fontSize="14"
												fill="#f44336"
												style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))' }}
											>
												⚠
											</text>
										</g>
									);
								}

								return (
									<g key={`point-${jointId}-${i}`}>
										<circle 
											cx={p.x} 
											cy={p.y} 
											r="4" 
											fill="#fff"
											stroke={JOINT_COLORS[jointId as keyof typeof JOINT_COLORS]}
											strokeWidth="1"
										/>
										<circle 
											cx={p.x} 
											cy={p.y} 
											r="2.5" 
											fill={JOINT_COLORS[jointId as keyof typeof JOINT_COLORS]}
										/>
									</g>
								);
							})}
						</g>
					);
				})}

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
