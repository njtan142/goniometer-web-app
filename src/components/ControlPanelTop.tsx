import * as S from '../styles';

interface ControlPanelTopProps {
	samplingRate: number;
	isRecording: boolean;
	isHeld: boolean;
	onSamplingRateChange: (rate: number) => void;
	onRecordingToggle: () => void;
	onHold: () => void;
	onExport: () => void;
	onSetZero: () => void;
}

export function ControlPanelTop({
	samplingRate,
	isRecording,
	isHeld,
	onSamplingRateChange,
	onRecordingToggle,
	onHold,
	onExport,
	onSetZero,
}: ControlPanelTopProps) {
	return (
		<S.ControlPanelTop>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
				<S.ControlGroup>
					<label>Rate:</label>
					<S.RangeInput
						min="10"
						max="100"
						value={samplingRate}
						onChange={e => onSamplingRateChange(Number(e.target.value))}
					/>
					<span style={{ fontSize: '13px', color: 'var(--text-main)', minWidth: '40px' }}>{samplingRate}Hz</span>
				</S.ControlGroup>

				<div style={{ display: 'flex', gap: '8px' }}>
					<S.Button
						className="secondary"
						onClick={onHold}
						style={isHeld ? {
							boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.2)',
							color: 'var(--text-highlight)',
						} : undefined}
					>
						{isHeld ? 'Resume' : 'Hold'}
					</S.Button>
					<S.Button
						onClick={onRecordingToggle}
						style={{
							background: isRecording ? '#f44336' : 'var(--bg-color)',
							color: isRecording ? 'white' : 'var(--text-highlight)',
							boxShadow: isRecording ? 'inset 2px 2px 5px rgba(0,0,0,0.2)' : undefined,
						}}
					>
						{isRecording ? 'Stop' : 'Record'}
					</S.Button>
					<S.Button className="secondary" onClick={onExport}>Export</S.Button>
				</div>
			</div>

			<S.Button onClick={onSetZero}>Set Zero</S.Button>
		</S.ControlPanelTop>
	);
}
