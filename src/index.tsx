import { hydrate, prerender as ssr } from 'preact-iso';
import { useState } from 'preact/hooks';
import styled from 'styled-components';

const Container = styled.div`
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	background: #f5f5f5;
	width: 100%;
	height: 100%;
	padding: 20px;
	overflow: hidden;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
`;

const MainLayout = styled.div`
	display: flex;
	gap: 20px;
	height: 100%;
	overflow: hidden;
`;

const LeftSection = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20px;
	height: 100%;
	overflow: hidden;
`;

const TopPanel = styled.div`
	display: flex;
	gap: 30px;
	background: white;
	padding: 15px 20px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	align-items: center;
	height: 120px;
`;

const GaugeSection = styled.div`
	flex: 0 0 auto;
	display: flex;
	align-items: center;
	gap: 12px;

	> div {
		display: flex;
		align-items: center;
		gap: 8px;
	}
`;

const ControlPanelTop = styled.div`
	flex: 1;
	display: flex;
	gap: 20px;
	align-items: center;
	justify-content: flex-start;
`;

const LeftSidebar = styled.div`
	flex: 0 0 200px;
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	text-align: center;
`;

const JointSelector = styled.select`
	background: white;
	border: 1px solid #ddd;
	color: #666;
	cursor: pointer;
	font-size: 13px;
	padding: 6px 10px;
	border-radius: 4px;
	transition: border-color 0.2s;

	&:hover {
		border-color: #999;
	}

	&:focus {
		outline: none;
		border-color: #2196f3;
		box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
	}
`;

const GaugeContainer = styled.div`
	width: 100px;
	height: 100px;
	border: 3px solid #ddd;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	font-weight: bold;
	color: #333;
	position: relative;
	overflow: hidden;
`;

const GaugeFill = styled.div`
	position: absolute;
	bottom: 0;
	width: 100%;
	height: ${props => props.fill}%;
	background: linear-gradient(to top, #2196f3, #64b5f6);
	transition: height 0.3s ease;
`;

const GaugeLabel = styled.div`
	position: relative;
	z-index: 1;
	text-align: center;
`;

const CenterContent = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

const VisualizationArea = styled.div`
	background: white;
	padding: 30px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
	overflow: hidden;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;

	h1 {
		margin: 0;
		font-size: 28px;
		color: #333;
	}

	.subtitle {
		color: #999;
		font-size: 12px;
		font-weight: normal;
	}
`;

const ChartLegend = styled.div`
	display: flex;
	gap: 20px;
	margin-bottom: 15px;
	flex-wrap: wrap;
`;

const LegendItem = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: #666;

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		background: ${props => props.color};
	}
`;

const SvgChart = styled.svg`
	width: 100%;
	height: 100%;
	flex: 1;
	overflow: hidden;
`;

const ControlPanel = styled.div`
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	display: flex;
	gap: 15px;
	align-items: center;
	flex-wrap: wrap;
`;

const ControlGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;

	label {
		font-size: 13px;
		color: #666;
		font-weight: 500;
	}

	input[type='range'] {
		width: 150px;
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #2196f3;
		cursor: pointer;
	}

	input[type='range']::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #2196f3;
		cursor: pointer;
		border: none;
	}
`;

const Button = styled.button`
	background: #2196f3;
	color: white;
	border: none;
	padding: 8px 16px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	transition: background 0.2s;

	&:hover {
		background: #1976d2;
	}

	&.secondary {
		background: #f5f5f5;
		color: #333;
		border: 1px solid #ddd;

		&:hover {
			background: #e8e8e8;
		}
	}
`;

const RightSidebar = styled.div`
	flex: 0 0 280px;
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const StatusSection = styled.div`
	margin-bottom: 20px;

	&:last-child {
		margin-bottom: 0;
	}
`;

const StatusTitle = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #666;
	text-transform: uppercase;
	margin-bottom: 12px;
`;

const StatusItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	border-bottom: 1px solid #f0f0f0;

	&:last-child {
		border-bottom: none;
	}

	.label {
		font-size: 13px;
		color: #666;
	}

	.value {
		font-size: 13px;
		font-weight: 600;
		color: #2196f3;
	}
`;

const ProgressBar = styled.div`
	width: 100%;
	height: 6px;
	background: #e0e0e0;
	border-radius: 3px;
	overflow: hidden;
	margin-top: 4px;

	.fill {
		height: 100%;
		background: #4caf50;
		width: ${props => props.value}%;
		transition: width 0.3s ease;
	}
`;

const DataGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	padding: 12px 0;
`;

const DataCell = styled.div`
	.label {
		font-size: 11px;
		color: #999;
		text-transform: uppercase;
		margin-bottom: 4px;
	}

	.value {
		font-size: 16px;
		font-weight: 600;
		color: #2196f3;
	}
`;

const RecentDataButton = styled.button`
	background: none;
	border: 1px solid #e0e0e0;
	padding: 4px 8px;
	border-radius: 3px;
	font-size: 11px;
	color: #2196f3;
	cursor: pointer;
	margin: 2px;
	transition: all 0.2s;

	&:hover {
		background: #f5f5f5;
		border-color: #2196f3;
	}
`;

export function App() {
	const [angle, setAngle] = useState(31.3);
	const [samplingRate, setSamplingRate] = useState(50);
	const [isRecording, setIsRecording] = useState(false);
	const [selectedJoint, setSelectedJoint] = useState('left-elbow');

	const joints = [
		{ value: 'left-elbow', label: 'Left Elbow' },
		{ value: 'right-elbow', label: 'Right Elbow' },
		{ value: 'left-knee', label: 'Left Knee' },
		{ value: 'right-knee', label: 'Right Knee' },
		{ value: 'left-shoulder', label: 'Left Shoulder' },
		{ value: 'right-shoulder', label: 'Right Shoulder' },
		{ value: 'left-hip', label: 'Left Hip' },
		{ value: 'right-hip', label: 'Right Hip' },
	];

	const jointColors = {
		'left-elbow': '#2196f3',
		'right-elbow': '#ff9800',
		'left-knee': '#4caf50',
		'right-knee': '#f44336',
	};

	const jointData = {
		'left-elbow': '50,150 100,120 150,100 200,90 250,110 300,130 350,100 400,80 450,100 500,120 550,140 600,130 650,110 700,100 750,120',
		'right-elbow': '50,160 100,140 150,120 200,110 250,130 300,150 350,120 400,100 450,110 500,130 550,150 600,140 650,120 700,110 750,130',
		'left-knee': '50,120 100,100 150,80 200,70 250,90 300,110 350,80 400,60 450,80 500,100 550,120 600,110 650,90 700,80 750,100',
		'right-knee': '50,140 100,130 150,110 200,100 250,120 300,140 350,110 400,90 450,100 500,120 550,130 600,120 650,100 700,90 750,110',
	};

	const [activeJoints, setActiveJoints] = useState(['left-elbow', 'right-elbow', 'left-knee', 'right-knee']);

	return (
		<Container>
			<MainLayout>
				<LeftSection>
					<TopPanel>
						<GaugeSection>
							<div>
								<JointSelector value={selectedJoint} onChange={e => setSelectedJoint(e.target.value)}>
									{joints.map(joint => (
										<option key={joint.value} value={joint.value}>
											{joint.label}
										</option>
									))}
								</JointSelector>
								<GaugeContainer>
									<GaugeFill fill={angle} />
									<GaugeLabel>{angle.toFixed(1)}°</GaugeLabel>
								</GaugeContainer>
								<div style={{ fontSize: '11px', color: '#999' }}>Zero</div>
							</div>
						</GaugeSection>

						<ControlPanelTop>
							<ControlGroup>
								<label>Rate:</label>
								<input
									type="range"
									min="10"
									max="100"
									value={samplingRate}
									onChange={e => setSamplingRate(Number(e.target.value))}
								/>
								<span style={{ fontSize: '13px', color: '#666', minWidth: '40px' }}>{samplingRate}Hz</span>
							</ControlGroup>

							<div style={{ display: 'flex', gap: '8px' }}>
								<Button className="secondary">Hold</Button>
								<Button onClick={() => setIsRecording(!isRecording)} style={{ background: isRecording ? '#f44336' : '#2196f3' }}>
									{isRecording ? 'Stop' : 'Record'}
								</Button>
								<Button className="secondary">Export</Button>
							</div>

							<Button style={{ marginLeft: 'auto' }}>Set Zero</Button>
						</ControlPanelTop>
					</TopPanel>

					<VisualizationArea>
						<Header>
							<div>
								<h1>Goniometer</h1>
								<div className="subtitle">Motion Capture System</div>
							</div>
							<div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
								Rate: <span style={{ color: '#2196f3' }}>50Hz</span>
							</div>
						</Header>

						<ChartLegend>
							{activeJoints.map(jointId => {
								const joint = joints.find(j => j.value === jointId);
								return (
									<LegendItem key={jointId}>
										<div className="dot" style={{ background: jointColors[jointId] }} />
										<span>{joint?.label}</span>
									</LegendItem>
								);
							})}
						</ChartLegend>

						<SvgChart viewBox="0 0 800 300">
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
									points={jointData[jointId]}
									fill="none"
									stroke={jointColors[jointId]}
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
						</SvgChart>
					</VisualizationArea>
				</LeftSection>

				<RightSidebar>
					<StatusSection>
						<StatusTitle>Device</StatusTitle>
						<div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', marginTop: '-4px' }}>v0 block</div>
						<Button style={{ width: '100%', marginBottom: '8px' }}>Connect</Button>
						<StatusItem>
							<span className="label">Status</span>
							<span className="value" style={{ color: '#4caf50' }}>✓</span>
						</StatusItem>
					</StatusSection>

					<StatusSection>
						<StatusTitle>Connectivity</StatusTitle>
						<StatusItem>
							<span className="label">WiFi</span>
							<span className="value">85%</span>
						</StatusItem>
						<ProgressBar value={85}>
							<div className="fill" />
						</ProgressBar>
						<StatusItem style={{ marginTop: '12px' }}>
							<span className="label">Battery</span>
							<span className="value">92%</span>
						</StatusItem>
						<ProgressBar value={92}>
							<div className="fill" />
						</ProgressBar>
						<StatusItem style={{ marginTop: '12px', borderBottom: 'none' }}>
							<span className="label">Live</span>
							<span className="value" style={{ color: '#4caf50' }}>◆</span>
						</StatusItem>
					</StatusSection>

					<StatusSection>
						<StatusTitle>ROM</StatusTitle>
						<DataGrid>
							<DataCell>
								<div className="label">Min</div>
								<div className="value">25.0°</div>
							</DataCell>
							<DataCell>
								<div className="label">Max</div>
								<div className="value">65.0°</div>
							</DataCell>
							<DataCell>
								<div className="label">ROM</div>
								<div className="value" style={{ gridColumn: 'span 2' }}>40.0°</div>
							</DataCell>
						</DataGrid>
					</StatusSection>

					<StatusSection>
						<StatusTitle>Data</StatusTitle>
						<DataGrid>
							<DataCell>
								<div className="label">Min</div>
								<div className="value">27.2°</div>
							</DataCell>
							<DataCell>
								<div className="label">Max</div>
								<div className="value">68.8°</div>
							</DataCell>
							<DataCell>
								<div className="label">Avg</div>
								<div className="value">51.8°</div>
							</DataCell>
							<DataCell>
								<div className="label">Count</div>
								<div className="value">30</div>
							</DataCell>
						</DataGrid>
					</StatusSection>

					<StatusSection>
						<StatusTitle style={{ marginBottom: '8px' }}>Recent</StatusTitle>
						<div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
							{['83.4°', '60.8°', '61.6°', '64.6°', '86.2°', '62.8°', '64.8°', '65.4°'].map((val, i) => (
								<RecentDataButton key={i}>{val}</RecentDataButton>
							))}
						</div>
					</StatusSection>
				</RightSidebar>
			</MainLayout>
		</Container>
	);
}

if (typeof window !== 'undefined') {
	hydrate(<App />, document.getElementById('app'));
}

export async function prerender(data) {
	return await ssr(<App {...data} />);
}
