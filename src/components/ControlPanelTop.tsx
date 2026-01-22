import * as S from '../styles';

interface ControlPanelTopProps {
	samplingRate: number;
	isRecording: boolean;
	onSamplingRateChange: (rate: number) => void;
	onRecordingToggle: () => void;
}

export function ControlPanelTop({
	samplingRate,
	isRecording,
	onSamplingRateChange,
	onRecordingToggle,
}: ControlPanelTopProps) {
	return (
		<S.ControlPanelTop>
			<S.ControlGroup>
				<label>Rate:</label>
				<input
					type="range"
					min="10"
					max="100"
					value={samplingRate}
					onChange={e => onSamplingRateChange(Number(e.target.value))}
				/>
				<span style={{ fontSize: '13px', color: '#666', minWidth: '40px' }}>{samplingRate}Hz</span>
			</S.ControlGroup>

			<div style={{ display: 'flex', gap: '8px' }}>
				<S.Button className="secondary">Hold</S.Button>
				<S.Button onClick={onRecordingToggle} style={{ background: isRecording ? '#f44336' : '#2196f3' }}>
					{isRecording ? 'Stop' : 'Record'}
				</S.Button>
				<S.Button className="secondary">Export</S.Button>
			</div>

			<S.Button style={{ marginLeft: 'auto' }}>Set Zero</S.Button>
		</S.ControlPanelTop>
	);
}
