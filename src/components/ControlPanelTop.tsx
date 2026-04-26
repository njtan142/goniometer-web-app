import * as S from '../styles';

interface ControlPanelTopProps {
	framesPerPacket: number;
	packetFreqHz: number;
	isRecording: boolean;
	isHeld: boolean;
	onFramesPerPacketChange: (v: number) => void;
	onPacketFreqChange: (v: number) => void;
	onRecordingToggle: () => void;
	onHold: () => void;
	onExport: () => void;
	onExportJSON: () => void;
	onImportJSON: () => void;
	onSetZero: () => void;
}

export function ControlPanelTop({
	framesPerPacket,
	packetFreqHz,
	isRecording,
	isHeld,
	onFramesPerPacketChange,
	onPacketFreqChange,
	onRecordingToggle,
	onHold,
	onExport,
	onExportJSON,
	onImportJSON,
	onSetZero,
}: ControlPanelTopProps) {
	const totalHz = framesPerPacket * packetFreqHz;
	return (
		<S.ControlPanelTop>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
				<S.ControlGroup>
					<label>Frames/pkt:</label>
					<S.RangeInput
						min="1"
						max="46"
						value={framesPerPacket}
						onChange={e => onFramesPerPacketChange(Number((e.target as HTMLInputElement).value))}
					/>
					<span style={{ fontSize: '13px', color: 'var(--text-main)', minWidth: '28px' }}>{framesPerPacket}</span>
				</S.ControlGroup>
				<S.ControlGroup>
					<label>Pkt freq:</label>
					<S.RangeInput
						min="10"
						max="400"
						value={packetFreqHz}
						onChange={e => onPacketFreqChange(Number((e.target as HTMLInputElement).value))}
					/>
					<span style={{ fontSize: '13px', color: 'var(--text-main)', minWidth: '40px' }}>{packetFreqHz}Hz</span>
				</S.ControlGroup>
				<div style={{ fontSize: '12px', color: 'var(--text-main)', opacity: 0.7 }}>
					Total: {totalHz} readings/s
				</div>

				<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
					<S.Button className="secondary" onClick={onExport}>CSV</S.Button>
					<S.Button className="secondary" onClick={onExportJSON}>JSON</S.Button>
					<S.Button className="secondary" onClick={onImportJSON}>Import</S.Button>
				</div>
			</div>

			<S.Button onClick={onSetZero}>Set Zero</S.Button>
		</S.ControlPanelTop>
	);
}
