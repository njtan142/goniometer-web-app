import styled from 'styled-components';

export const Container = styled.div`
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

export const MainLayout = styled.div`
	display: flex;
	gap: 20px;
	height: 100%;
	overflow: hidden;
`;

export const LeftSection = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20px;
	height: 100%;
	overflow: hidden;
`;

export const TopPanel = styled.div`
	display: flex;
	gap: 30px;
	background: white;
	padding: 15px 20px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	align-items: center;
	height: 120px;
`;

export const GaugeSection = styled.div`
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

export const ControlPanelTop = styled.div`
	flex: 1;
	display: flex;
	gap: 20px;
	align-items: center;
	justify-content: flex-start;
`;

export const LeftSidebar = styled.div`
	flex: 0 0 200px;
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	text-align: center;
`;

export const JointSelector = styled.select`
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

export const GaugeContainer = styled.div`
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

export const GaugeFill = styled.div`
	position: absolute;
	bottom: 0;
	width: 100%;
	height: ${props => props.fill}%;
	background: linear-gradient(to top, #2196f3, #64b5f6);
	transition: height 0.3s ease;
`;

export const GaugeLabel = styled.div`
	position: relative;
	z-index: 1;
	text-align: center;
`;

export const CenterContent = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

export const VisualizationArea = styled.div`
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

export const Header = styled.div`
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

export const ChartLegend = styled.div`
	display: flex;
	gap: 20px;
	margin-bottom: 15px;
	flex-wrap: wrap;
`;

export const LegendItem = styled.div`
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

export const SvgChart = styled.svg`
	width: 100%;
	height: 100%;
	flex: 1;
	overflow: hidden;
`;

export const ControlPanel = styled.div`
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	display: flex;
	gap: 15px;
	align-items: center;
	flex-wrap: wrap;
`;

export const ControlGroup = styled.div`
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

export const Button = styled.button`
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

export const RightSidebar = styled.div`
	flex: 0 0 280px;
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const StatusSection = styled.div`
	margin-bottom: 20px;

	&:last-child {
		margin-bottom: 0;
	}
`;

export const StatusTitle = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #666;
	text-transform: uppercase;
	margin-bottom: 12px;
`;

export const StatusItem = styled.div`
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

export const ProgressBar = styled.div`
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

export const DataGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	padding: 12px 0;
`;

export const DataCell = styled.div`
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

export const RecentDataButton = styled.button`
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

export const AnimateButtonContainer = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 16px;
	padding: 0 20px;
`;

export const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

export const ModalContent = styled.div`
	background: white;
	border-radius: 8px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	min-width: 400px;
	max-width: 90%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
`;

export const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px 20px;
	border-bottom: 1px solid #f0f0f0;
`;

export const ModalTitle = styled.h2`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #333;
`;

export const CloseButton = styled.button`
	background: none;
	border: none;
	font-size: 24px;
	color: #999;
	cursor: pointer;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s;

	&:hover {
		color: #333;
	}
`;

export const ModalBody = styled.div`
	padding: 20px;
	overflow-y: auto;
	flex: 1;
`;

export const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 16px 20px;
	border-top: 1px solid #f0f0f0;
	background: #fafafa;
`;
