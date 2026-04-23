import styled from 'styled-components';

export const Container = styled.div`
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	background: var(--bg-color);
	width: 100%;
	height: 100%;
	padding: 30px;
	overflow: hidden;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	color: var(--text-main);
`;

export const MainLayout = styled.div`
	display: flex;
	gap: 30px;
	height: 100%;
    /* Removed overflow: hidden to prevent shadow clipping */
`;

export const LeftSection = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 30px;
	height: 100%;
    /* Removed overflow: hidden to prevent shadow clipping */
`;

export const TopPanel = styled.div`
	display: flex;
	gap: 30px;
	background: var(--bg-color);
	padding: 15px 20px;
	border-radius: 20px;
	box-shadow: var(--shadow-raised);
	align-items: center;
	height: 150px;
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
	background: var(--bg-color);
	padding: 20px;
	border-radius: 20px;
	box-shadow: var(--shadow-raised);
	text-align: center;
`;

export const JointSelector = styled.select`
	background: var(--bg-color);
	border: none;
	color: var(--text-main);
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	padding: 10px 36px 10px 20px;
	border-radius: 50px;
	box-shadow: 5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light);
	transition: all 0.2s ease;
	appearance: none;
	
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 12px center;
	background-size: 16px;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light);
	}

	&:focus {
		outline: none;
		box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);
		transform: translateY(0);
		color: var(--text-highlight);
	}
`;

export const GaugeContainer = styled.div`
	width: 130px;
	height: 130px;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	font-weight: bold;
	color: var(--text-main);
	
	background: var(--bg-color);
	border-radius: 50%;
	box-shadow: 9px 9px 16px var(--shadow-dark), -9px -9px 16px var(--shadow-light);
	
	/* Add a subtle gradient to enhance the convex/elevated look */
	background: linear-gradient(145deg, #ffffff, #e6e6e6);
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
	background: var(--bg-color);
	padding: 30px;
	border-radius: 20px;
	box-shadow: var(--shadow-raised);
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
		color: var(--text-main);
	}

	.subtitle {
		color: var(--text-secondary);
		font-size: 14px;
		font-weight: normal;
	}
`;

export const ChartLegend = styled.div`
	display: flex;
	gap: 20px;
	margin-bottom: 15px;
	flex-wrap: wrap;
`;

export const LegendItem = styled.button<{ $isActive?: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-family: inherit;
	color: ${props => props.$isActive ? 'var(--text-highlight)' : 'var(--text-secondary)'};
	
	background: var(--bg-color);
	border: none;
	padding: 8px 16px;
	border-radius: 50px;
	cursor: pointer;
	
	box-shadow: ${props => props.$isActive 
		? 'var(--shadow-inset-light), var(--shadow-inset-dark)' 
		: 'var(--shadow-raised)'};
		
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	
	/* Prevent text selection */
	user-select: none;
	-webkit-user-select: none;

	&:hover {
		color: ${props => props.$isActive ? 'var(--text-highlight)' : 'var(--text-main)'};
		transform: translateY(0);
		box-shadow: ${props => props.$isActive 
			? 'var(--shadow-inset-light), var(--shadow-inset-dark)' 
			: 'var(--shadow-raised-hover)'};
	}
	
	&:active {
		box-shadow: var(--shadow-inset-light), var(--shadow-inset-dark);
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		/* background is set inline */
		box-shadow: 1px 1px 2px rgba(163,177,198,0.6);
		opacity: ${props => props.$isActive ? 1 : 0.6};
	}
`;

export const SvgChart = styled.svg`
	width: 100%;
	height: 100%;
	flex: 1;
	overflow: hidden;
`;

export const ControlPanel = styled.div`
	background: var(--bg-color);
	padding: 20px;
	border-radius: 20px;
	box-shadow: var(--shadow-raised);
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
		color: var(--text-secondary);
		font-weight: 500;
	}
`;

export const RangeInput = styled.input.attrs({ type: 'range' })`
	-webkit-appearance: none;
	width: 150px;
	background: transparent;
	margin: 0;

	&:focus {
		outline: none;
	}

	&::-webkit-slider-runnable-track {
		width: 100%;
		height: 8px;
		cursor: pointer;
		background: var(--bg-color);
		border-radius: 4px;
		box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);
		border: 1px solid rgba(0,0,0,0.02);
	}

	&::-webkit-slider-thumb {
		box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);
		border: 1px solid rgba(255,255,255,0.5);
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: var(--bg-color);
		cursor: pointer;
		-webkit-appearance: none;
		margin-top: -7px;
		transition: all 0.2s ease;
	}

	&:focus::-webkit-slider-thumb {
		background: var(--bg-color);
	}

	&:hover::-webkit-slider-thumb {
		transform: scale(1.1);
	}

	/* Firefox styles */
	&::-moz-range-track {
		width: 100%;
		height: 8px;
		cursor: pointer;
		background: var(--bg-color);
		border-radius: 4px;
		box-shadow: inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light);
		border: 1px solid rgba(0,0,0,0.02);
	}

	&::-moz-range-thumb {
		box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);
		border: 1px solid rgba(255,255,255,0.5);
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: var(--bg-color);
		cursor: pointer;
		transition: all 0.2s ease;
	}
`;

export const Button = styled.button`
	background: var(--bg-color);
	color: var(--text-highlight);
	border: none;
	padding: 8px 16px;
	border-radius: 50px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	transition: all 0.2s ease;
	box-shadow: var(--shadow-raised);

	&:hover {
		box-shadow: var(--shadow-raised-hover);
		transform: translateY(-1px);
	}

	&:active {
		box-shadow: var(--shadow-inset-light), var(--shadow-inset-dark);
		transform: translateY(0);
	}

	&.secondary {
		color: var(--text-main);
	}
`;

export const RightSidebar = styled.div`
	flex: 0 0 280px;
	background: var(--bg-color);
	padding: 20px;
	border-radius: 20px;
	box-shadow: var(--shadow-raised);
	display: flex;
	flex-direction: column;
	overflow: hidden; /* Contains content vertically */
	min-height: 0;
`;

export const StatusSection = styled.div`
	margin-bottom: 15px;
	flex-shrink: 0;

	&:last-child {
		margin-bottom: 0;
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
`;

export const StatusTitle = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: var(--text-secondary);
	text-transform: uppercase;
	margin-bottom: 8px;
`;

export const StatusItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	border-bottom: 1px solid rgba(163,177,198,0.3);

	&:last-child {
		border-bottom: none;
	}

	.label {
		font-size: 13px;
		color: var(--text-main);
	}

	.value {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-highlight);
	}
`;

export const ProgressBar = styled.div`
	width: 100%;
	height: 10px;
	background: var(--bg-color);
	border-radius: 5px;
	overflow: hidden;
	margin-top: 8px;
	box-shadow: var(--shadow-inset-light), var(--shadow-inset-dark);

	.fill {
		height: 100%;
		background: #4caf50;
		width: ${props => props.value}%;
		transition: width 0.3s ease;
		border-radius: 5px;
		box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
	}
`;

export const DataGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
	padding: 8px 0;
`;

export const DataCell = styled.div`
	.label {
		font-size: 11px;
		color: var(--text-secondary);
		text-transform: uppercase;
		margin-bottom: 4px;
	}

	.value {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-highlight);
		text-shadow: 1px 1px 1px var(--shadow-light);
	}
`;

export const RecentDataButton = styled.button`
	background: var(--bg-color);
	border: none;
	padding: 6px 12px;
	border-radius: 12px;
	font-size: 11px;
	color: var(--text-highlight);
	cursor: pointer;
	margin: 4px;
	transition: all 0.2s;
	box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);

	&:hover {
		box-shadow: 1px 1px 3px var(--shadow-dark), -1px -1px 3px var(--shadow-light);
		transform: translateY(-1px);
	}

	&:active {
		box-shadow: var(--shadow-inset-light), var(--shadow-inset-dark);
		transform: translateY(0);
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
	background: rgba(240, 240, 240, 0.8);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
`;

export const ModalContent = styled.div`
	background: var(--bg-color);
	border-radius: 20px;
	box-shadow: var(--shadow-raised);
	min-width: 400px;
	max-width: 90%;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	border: 1px solid rgba(255,255,255,0.4);
`;

export const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px;
	border-bottom: 1px solid rgba(163,177,198,0.2);
`;

export const ModalTitle = styled.h2`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: var(--text-main);
`;

export const CloseButton = styled.button`
	background: var(--bg-color);
	border: none;
	font-size: 18px;
	color: #666;
	cursor: pointer;
	padding: 0;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
	box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);

	&:hover {
		color: #333;
		box-shadow: 1px 1px 3px var(--shadow-dark), -1px -1px 3px var(--shadow-light);
	}
	
	&:active {
		box-shadow: var(--shadow-inset-light), var(--shadow-inset-dark);
	}
`;

export const ModalBody = styled.div`
	padding: 24px;
	overflow-y: auto;
	flex: 1;
`;

export const ModalFooter = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding: 20px 24px;
	border-top: 1px solid rgba(163,177,198,0.2);
	background: transparent;
`;

export const HistoryItem = styled.div`
	padding: 12px;
	background: var(--bg-color);
	border-radius: 12px;
	cursor: pointer;
	font-size: 12px;
	transition: all 0.2s ease;
	box-shadow: 2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light);
	border: none;

	&:hover {
		box-shadow: 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light);
		transform: translateY(-1px);
	}

	&:active {
		box-shadow: var(--shadow-inset-light), var(--shadow-inset-dark);
		transform: translateY(0);
	}
`;

export const HistoryContainer = styled.div`
	position: relative;
	flex: 1;
	min-height: 0; 
	/* No overflow: hidden here, so scrollbar of child is visible */
	
	/* The overlay shadow (Recessed Well) */
	&::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 10px; /* Leave space for scrollbar on the right */
		border-radius: 16px;
		box-shadow: var(--shadow-inset-light), var(--shadow-inset-dark);
		pointer-events: none;
		z-index: 2;
	}
`;

export const HistoryList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 100%;
	overflow-y: auto;
	
	/* Padding to fit items inside the recessed area (right padding accounts for scrollbar gap) */
	padding: 16px 26px 16px 16px; 

	/* Ensure items stay below the overlay */
	position: relative;
	z-index: 1;

	/* Custom Scrollbar */
	&::-webkit-scrollbar {
		width: 4px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 10px;
	}

	&:hover::-webkit-scrollbar-thumb {
		background: rgba(136, 136, 136, 0.4);
	}
`;
