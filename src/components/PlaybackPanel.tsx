import { useState, useRef, useEffect } from 'preact/hooks';
import * as S from '../styles';
import { HistorySession } from '../constants/joints';

interface PlaybackPanelProps {
	session: HistorySession;
	currentFrame: number;
	onFrameChange: (idx: number) => void;
	onClose: () => void;
	onExportCSV: () => void;
	onGeneratePDF: () => void;
	onAnimateClick?: () => void;
}

export function PlaybackPanel({ session, currentFrame, onFrameChange, onClose, onExportCSV, onGeneratePDF, onAnimateClick }: PlaybackPanelProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [speed, setSpeed] = useState(1);

	const isPlayingRef = useRef(false);
	const speedRef     = useRef(1);
	const frameRef     = useRef(currentFrame);
	const rafRef       = useRef<number | null>(null);
	const rawDataRef   = useRef(session.rawData ?? []);

	// Cumulative playback anchors — set on the first RAF tick after play is pressed.
	// Using cumulative wall time avoids the bug where incremental wallElapsed
	// gets added to the (large, absolute) data[idx].t each frame, causing targetT
	// to never reach data[idx+1].t.
	const playStartWallRef = useRef<number | null>(null);
	const playStartRecordingT = useRef<number>(0);

	isPlayingRef.current = isPlaying;
	speedRef.current     = speed;
	frameRef.current     = currentFrame;

	useEffect(() => {
		if (!isPlaying) {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			// Reset anchors so next Play press starts fresh from current position
			playStartWallRef.current = null;
			return;
		}

		const step = (now: number) => {
			if (!isPlayingRef.current) return;

			const data = rawDataRef.current;
			if (data.length === 0) { setIsPlaying(false); return; }

			// First tick: anchor wall clock and recording position
			if (playStartWallRef.current === null) {
				playStartWallRef.current  = now;
				playStartRecordingT.current = data[frameRef.current]?.t ?? 0;
				rafRef.current = requestAnimationFrame(step);
				return;
			}

			// How far along the recording should we be?
			const totalWallMs    = (now - playStartWallRef.current) * speedRef.current;
			const targetT        = playStartRecordingT.current + totalWallMs;

			// Scan forward from current frame
			let nextIdx = frameRef.current;
			while (nextIdx < data.length - 1 && data[nextIdx + 1].t <= targetT) {
				nextIdx++;
			}

			if (nextIdx !== frameRef.current) onFrameChange(nextIdx);

			if (nextIdx >= data.length - 1) {
				setIsPlaying(false);
				return;
			}

			rafRef.current = requestAnimationFrame(step);
		};

		rafRef.current = requestAnimationFrame(step);
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying]);

	const totalFrames = rawDataRef.current.length;

	return (
		<S.ControlPanelTop>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
				<div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
					{session.timestamp} · {session.duration} @ {session.rate}
				</div>

				<S.ControlGroup>
					<label>Scrub:</label>
					<S.RangeInput
						min="0"
						max={Math.max(0, totalFrames - 1)}
						value={currentFrame}
						onChange={e => {
							setIsPlaying(false);
							onFrameChange(Number((e.target as HTMLInputElement).value));
						}}
					/>
					<span style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '56px' }}>
						{currentFrame + 1}/{totalFrames}
					</span>
				</S.ControlGroup>

				<S.ControlGroup>
					<label>Speed:</label>
					<S.RangeInput
						min="0.25"
						max="4"
						step="0.25"
						value={speed}
						onChange={e => setSpeed(Number((e.target as HTMLInputElement).value))}
					/>
					<span style={{ fontSize: '12px', color: 'var(--text-main)', minWidth: '28px' }}>
						{speed}x
					</span>
				</S.ControlGroup>

				<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
					<S.Button
						className="secondary"
						onClick={() => { setIsPlaying(false); onFrameChange(0); }}
					>
						Reset
					</S.Button>
					<S.Button
						onClick={() => setIsPlaying(p => !p)}
						style={isPlaying ? { boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.2)', color: 'var(--text-highlight)' } : undefined}
					>
						{isPlaying ? 'Pause' : 'Play'}
					</S.Button>
					<S.Button className="secondary" onClick={onExportCSV}>CSV</S.Button>
					<S.Button className="secondary" onClick={onGeneratePDF}>PDF</S.Button>
					{onAnimateClick && (
						<S.Button className="secondary" onClick={onAnimateClick}>Animate</S.Button>
					)}
					<S.Button className="secondary" onClick={onClose}>Exit</S.Button>
				</div>
			</div>
		</S.ControlPanelTop>
	);
}
