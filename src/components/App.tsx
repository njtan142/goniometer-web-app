import { useState } from 'preact/hooks';
import * as S from '../styles';
import { JOINTS, JOINT_COLORS, JOINT_DATA } from '../constants/joints';

export function App() {
	const [angle, setAngle] = useState(31.3);
	const [samplingRate, setSamplingRate] = useState(50);
	const [isRecording, setIsRecording] = useState(false);
	const [selectedJoint, setSelectedJoint] = useState('left-elbow');
	const [activeJoints, setActiveJoints] = useState(['left-elbow', 'right-elbow', 'left-knee', 'right-knee']);

	return (
		<S.Container>
			<S.MainLayout>
				<S.LeftSection>
					<S.TopPanel>
						<S.GaugeSection>
							<div>
								<S.JointSelector value={selectedJoint} onChange={e => setSelectedJoint(e.target.value)}>
									{JOINTS.map(joint => (
										<option key={joint.value} value={joint.value}>
											{joint.label}
										</option>
									))}
								</S.JointSelector>
								<S.GaugeContainer>
									<S.GaugeFill fill={angle} />
									<S.GaugeLabel>{angle.toFixed(1)}°</S.GaugeLabel>
								</S.GaugeContainer>
								<div style={{ fontSize: '11px', color: '#999' }}>Zero</div>
							</div>
						</S.GaugeSection>

						<S.ControlPanelTop>
							<S.ControlGroup>
								<label>Rate:</label>
								<input
									type="range"
									min="10"
									max="100"
									value={samplingRate}
									onChange={e => setSamplingRate(Number(e.target.value))}
								/>
								<span style={{ fontSize: '13px', color: '#666', minWidth: '40px' }}>{samplingRate}Hz</span>
							</S.ControlGroup>

							<div style={{ display: 'flex', gap: '8px' }}>
								<S.Button className="secondary">Hold</S.Button>
								<S.Button onClick={() => setIsRecording(!isRecording)} style={{ background: isRecording ? '#f44336' : '#2196f3' }}>
									{isRecording ? 'Stop' : 'Record'}
								</S.Button>
								<S.Button className="secondary">Export</S.Button>
							</div>

							<S.Button style={{ marginLeft: 'auto' }}>Set Zero</S.Button>
						</S.ControlPanelTop>
					</S.TopPanel>

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
					</S.VisualizationArea>
				</S.LeftSection>

				<S.RightSidebar>
					<S.StatusSection>
						<S.StatusTitle>Status</S.StatusTitle>
						<S.StatusItem>
							<span className="label">WiFi</span>
							<span className="value">85%</span>
						</S.StatusItem>
						<S.StatusItem>
							<span className="label">Battery</span>
							<span className="value">92%</span>
						</S.StatusItem>
						<S.StatusItem style={{ borderBottom: 'none' }}>
							<span className="label">Live</span>
							<span className="value" style={{ color: '#4caf50' }}>◆</span>
						</S.StatusItem>
					</S.StatusSection>

					<S.StatusSection>
						<S.StatusTitle>ROM</S.StatusTitle>
						<S.DataGrid style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
							{activeJoints.slice(0, 4).map(jointId => {
								const joint = JOINTS.find(j => j.value === jointId);
								return (
									<S.DataCell key={jointId}>
										<div className="label" style={{ fontSize: '9px' }}>{joint?.label.split(' ')[0]}</div>
										<div className="value" style={{ fontSize: '13px' }}>40.0°</div>
									</S.DataCell>
								);
							})}
						</S.DataGrid>
					</S.StatusSection>

					<S.StatusSection>
						<S.StatusTitle>Data</S.StatusTitle>
						<S.DataGrid style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))' }}>
							{activeJoints.slice(0, 4).map(jointId => {
								const joint = JOINTS.find(j => j.value === jointId);
								return (
									<div key={jointId} style={{ minWidth: '60px' }}>
										<div style={{ fontSize: '9px', color: '#999', marginBottom: '4px' }}>{joint?.label.split(' ')[0]}</div>
										<div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Min: 27.2°</div>
										<div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Max: 68.8°</div>
										<div style={{ fontSize: '10px', color: '#666' }}>Avg: 51.8°</div>
									</div>
								);
							})}
						</S.DataGrid>
					</S.StatusSection>

					<S.StatusSection>
						<S.StatusTitle style={{ marginBottom: '12px' }}>History</S.StatusTitle>
						<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
							{[
								{ timestamp: '14:32', joints: 'L.Elbow, R.Elbow', duration: '2m 14s', rate: '50Hz' },
								{ timestamp: '14:15', joints: 'L.Knee, R.Knee', duration: '1m 45s', rate: '50Hz' },
								{ timestamp: '13:58', joints: 'L.Elbow, R.Elbow, L.Knee', duration: '3m 22s', rate: '50Hz' },
								{ timestamp: '13:20', joints: 'L.Elbow, R.Elbow, L.Knee, R.Knee', duration: '5m 10s', rate: '50Hz' },
								{ timestamp: '12:45', joints: 'L.Elbow', duration: '1m 30s', rate: '50Hz' },
							].map((session, i) => (
								<div key={i} style={{ 
									padding: '8px 10px', 
									background: '#f9f9f9', 
									borderRadius: '4px', 
									border: '1px solid #e8e8e8',
									cursor: 'pointer',
									transition: 'all 0.2s',
									fontSize: '12px'
								}}
								onMouseEnter={e => {
									e.currentTarget.style.background = '#f0f0f0';
									e.currentTarget.style.borderColor = '#2196f3';
								}}
								onMouseLeave={e => {
									e.currentTarget.style.background = '#f9f9f9';
									e.currentTarget.style.borderColor = '#e8e8e8';
								}}>
									<div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>{session.timestamp}</div>
									<div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>Joints: {session.joints}</div>
									<div style={{ fontSize: '11px', color: '#999' }}>
										{session.duration} @ {session.rate}
									</div>
								</div>
							))}
						</div>
					</S.StatusSection>
				</S.RightSidebar>
			</S.MainLayout>
		</S.Container>
	);
}
