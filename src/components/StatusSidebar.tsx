import * as S from '../styles';
import { JOINTS } from '../constants/joints';

interface StatusSidebarProps {
	activeJoints: string[];
}

interface HistorySession {
	timestamp: string;
	joints: string;
	duration: string;
	rate: string;
}

const HISTORY_SESSIONS: HistorySession[] = [
	{ timestamp: '14:32', joints: 'L.Elbow, R.Elbow', duration: '2m 14s', rate: '50Hz' },
	{ timestamp: '14:15', joints: 'L.Knee, R.Knee', duration: '1m 45s', rate: '50Hz' },
	{ timestamp: '13:58', joints: 'L.Elbow, R.Elbow, L.Knee', duration: '3m 22s', rate: '50Hz' },
	{ timestamp: '13:20', joints: 'L.Elbow, R.Elbow, L.Knee, R.Knee', duration: '5m 10s', rate: '50Hz' },
	{ timestamp: '12:45', joints: 'L.Elbow', duration: '1m 30s', rate: '50Hz' },
];

export function StatusSidebar({ activeJoints }: StatusSidebarProps) {
	return (
		<S.RightSidebar>
			{/* Status Section */}
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

			{/* ROM Section */}
			<S.StatusSection>
				<S.StatusTitle>ROM</S.StatusTitle>
				<S.DataGrid style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
					{activeJoints.slice(0, 4).map(jointId => {
						const joint = JOINTS.find(j => j.value === jointId);
						return (
							<S.DataCell key={jointId}>
								<div className="label" style={{ fontSize: '9px' }}>
									{joint?.label.split(' ')[0]}
								</div>
								<div className="value" style={{ fontSize: '13px' }}>
									40.0°
								</div>
							</S.DataCell>
						);
					})}
				</S.DataGrid>
			</S.StatusSection>

			{/* Data Section */}
			<S.StatusSection>
				<S.StatusTitle>Data</S.StatusTitle>
				<S.DataGrid style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))' }}>
					{activeJoints.slice(0, 4).map(jointId => {
						const joint = JOINTS.find(j => j.value === jointId);
						return (
							<div key={jointId} style={{ minWidth: '60px' }}>
								<div style={{ fontSize: '9px', color: '#999', marginBottom: '4px' }}>
									{joint?.label.split(' ')[0]}
								</div>
								<div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Min: 27.2°</div>
								<div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Max: 68.8°</div>
								<div style={{ fontSize: '10px', color: '#666' }}>Avg: 51.8°</div>
							</div>
						);
					})}
				</S.DataGrid>
			</S.StatusSection>

			{/* History Section */}
			<S.StatusSection>
				<S.StatusTitle style={{ marginBottom: '12px' }}>History</S.StatusTitle>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
					{HISTORY_SESSIONS.map((session, i) => (
						<div
							key={i}
							style={{
								padding: '8px 10px',
								background: '#f9f9f9',
								borderRadius: '4px',
								border: '1px solid #e8e8e8',
								cursor: 'pointer',
								transition: 'all 0.2s',
								fontSize: '12px',
							}}
							onMouseEnter={e => {
								e.currentTarget.style.background = '#f0f0f0';
								e.currentTarget.style.borderColor = '#2196f3';
							}}
							onMouseLeave={e => {
								e.currentTarget.style.background = '#f9f9f9';
								e.currentTarget.style.borderColor = '#e8e8e8';
							}}
						>
							<div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>
								{session.timestamp}
							</div>
							<div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>
								Joints: {session.joints}
							</div>
							<div style={{ fontSize: '11px', color: '#999' }}>
								{session.duration} @ {session.rate}
							</div>
						</div>
					))}
				</div>
			</S.StatusSection>
		</S.RightSidebar>
	);
}
