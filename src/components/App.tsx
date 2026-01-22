import { useState } from 'preact/hooks';
import * as S from '../styles';
import { GaugePanel } from './GaugePanel';
import { ControlPanelTop } from './ControlPanelTop';
import { ChartVisualization } from './ChartVisualization';
import { AnimateModal } from './AnimateModal';
import { StatusSidebar } from './StatusSidebar';

export function App() {
	const [angle, setAngle] = useState(31.3);
	const [samplingRate, setSamplingRate] = useState(50);
	const [isRecording, setIsRecording] = useState(false);
	const [selectedJoint, setSelectedJoint] = useState('left-elbow');
	const [activeJoints, setActiveJoints] = useState(['left-elbow', 'right-elbow', 'left-knee', 'right-knee']);
	const [showAnimateModal, setShowAnimateModal] = useState(false);

	return (
		<S.Container>
			<S.MainLayout>
				<S.LeftSection>
					<S.TopPanel>
						<GaugePanel
							angle={angle}
							selectedJoint={selectedJoint}
							onJointChange={setSelectedJoint}
						/>
						<ControlPanelTop
							samplingRate={samplingRate}
							isRecording={isRecording}
							onSamplingRateChange={setSamplingRate}
							onRecordingToggle={() => setIsRecording(!isRecording)}
						/>
					</S.TopPanel>

					<ChartVisualization
						activeJoints={activeJoints}
						onAnimateClick={() => setShowAnimateModal(true)}
					/>
				</S.LeftSection>

				<AnimateModal
					isOpen={showAnimateModal}
					onClose={() => setShowAnimateModal(false)}
				/>

				<StatusSidebar activeJoints={activeJoints} />
			</S.MainLayout>
		</S.Container>
	);
}
