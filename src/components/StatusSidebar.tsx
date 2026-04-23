import * as S from '../styles';
import { JOINTS } from '../constants/joints';
import { HistorySession } from './App';

interface StatusSidebarProps {
	activeJoints: string[];
	jointAngles: Record<string, number>;
	chartData: Record<string, number[]>;
	history: HistorySession[];
}

export function StatusSidebar({ activeJoints, jointAngles, chartData, history }: StatusSidebarProps) {
	return (
		<S.RightSidebar>
			<S.StatusSection>
				<S.StatusTitle>Status</S.StatusTitle>
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
				<S.StatusTitle>Metrics</S.StatusTitle>
				<table style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}>
							<th style={{ textAlign: 'left',  fontSize: '10px', color: 'var(--text-secondary)', padding: '0 0 8px 0', fontWeight: 600 }}>JOINT</th>
							<th style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-secondary)', padding: '0 0 8px 0', fontWeight: 600 }}>ROM</th>
							<th style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-secondary)', padding: '0 0 8px 0', fontWeight: 600 }}>MIN</th>
							<th style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-secondary)', padding: '0 0 8px 0', fontWeight: 600 }}>MAX</th>
						</tr>
					</thead>
					<tbody>
						{activeJoints.slice(0, 4).map((jointId, i) => {
							const joint = JOINTS.find(j => j.value === jointId);
							const angles = chartData[jointId] ?? [];
							const min = angles.length ? Math.min(...angles) : 0;
							const max = angles.length ? Math.max(...angles) : 0;
							const rom = max - min;
							const isLast = i === Math.min(activeJoints.length, 4) - 1;
							return (
								<tr key={jointId} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(163,177,198,0.2)' }}>
									<td style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-main)', fontWeight: 500 }}>{joint?.label}</td>
									<td style={{ padding: '8px 0', fontSize: '12px', fontWeight: 600, color: 'var(--text-highlight)', textAlign: 'right' }}>{rom.toFixed(1)}°</td>
									<td style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>{min.toFixed(1)}°</td>
									<td style={{ padding: '8px 0', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>{max.toFixed(1)}°</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</S.StatusSection>

			<S.StatusSection>
				<S.StatusTitle style={{ marginBottom: '8px' }}>History</S.StatusTitle>
				<S.HistoryContainer>
					<S.HistoryList>
						{history.map((session, i) => (
							<S.HistoryItem key={i}>
								<div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
									{session.timestamp}
								</div>
								<div style={{ fontSize: '11px', color: 'var(--text-main)', marginBottom: '3px' }}>
									Joints: {session.joints}
								</div>
								<div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
									{session.duration} @ {session.rate}
								</div>
							</S.HistoryItem>
						))}
					</S.HistoryList>
				</S.HistoryContainer>
			</S.StatusSection>
		</S.RightSidebar>
	);
}
