import * as S from '../styles';
import { JOINTS } from '../constants/joints';

interface GaugePanelProps {
	angle: number;
	selectedJoint: string;
	onJointChange: (joint: string) => void;
}

export function GaugePanel({ angle, selectedJoint, onJointChange }: GaugePanelProps) {
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
					<S.GaugeFill fill={angle} />
					<S.GaugeLabel>{angle.toFixed(1)}°</S.GaugeLabel>
				</S.GaugeContainer>
				<div style={{ fontSize: '11px', color: '#999' }}>Zero</div>
			</div>
		</S.GaugeSection>
	);
}
