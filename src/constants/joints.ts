// Active sensor joints — matches ESP32 k_joint_name[MT6701_NUM_SENSORS] order (index 0–3)
export const ACTIVE_JOINTS = ['knee-central', 'hip-yaw', 'hip-pitch', 'ankle-yaw'];

// Rolling-window size for the live chart (number of data points shown by default)
export const CHART_POINTS = 29;

// Ring-buffer size cap for liveHistoryRef.  Large enough for ~2.7 s at max rate
// (46 frames × 400 Hz = 18 400 fps).  Trimmed with in-place splice, not slice.
export const LIVE_HISTORY_CAP = 50_000;

// Maximum data points forwarded to ChartVisualization in live mode.
// Prevents mapping a 50 k-element array before ChartVisualization re-slices it.
export const MAX_CHART_DISPLAY_PTS = 5_000;

export interface HistorySession {
	timestamp: string;
	joints: string;
	duration: string;
	rate: string;
	/** Raw recording frames — present when the session was recorded in this browser tab or imported from JSON */
	rawData?: { t: number; angles: Record<string, number> }[];
}

export const JOINTS = [

	// Sensor 0 – MT6701 index 0
	{ value: 'knee-central', label: 'Knee (central)', type: 'knee' },
	// Sensor 1 – MT6701 index 1
	{ value: 'hip-yaw',     label: 'Hip-yaw',        type: 'hip' },
	// Sensor 2 – MT6701 index 2
	{ value: 'hip-pitch',   label: 'Hip-pitch',       type: 'hip' },
	// Sensor 3 – MT6701 index 3
	{ value: 'ankle-yaw',   label: 'Ankle-yaw',       type: 'ankle' },
	// Legacy joints kept for JSON import compatibility
	{ value: 'left-elbow',     label: 'Left Elbow',     type: 'elbow' },
	{ value: 'right-elbow',    label: 'Right Elbow',    type: 'elbow' },
	{ value: 'left-knee',      label: 'Left Knee',      type: 'knee' },
	{ value: 'right-knee',     label: 'Right Knee',     type: 'knee' },
	{ value: 'left-shoulder',  label: 'Left Shoulder',  type: 'shoulder' },
	{ value: 'right-shoulder', label: 'Right Shoulder', type: 'shoulder' },
	{ value: 'left-hip',       label: 'Left Hip',       type: 'hip' },
	{ value: 'right-hip',      label: 'Right Hip',      type: 'hip' },
	{ value: 'left-wrist',     label: 'Left Wrist',     type: 'wrist' },
	{ value: 'right-wrist',    label: 'Right Wrist',    type: 'wrist' },
	{ value: 'left-ankle',     label: 'Left Ankle',     type: 'ankle' },
	{ value: 'right-ankle',    label: 'Right Ankle',    type: 'ankle' },
];

export const NORMATIVE_RANGES = {
	elbow: { min: 0, max: 140, color: 'rgba(68, 138, 255, 0.2)', label: 'Normative Range (Elbows)' }, // Blue
	knee: { min: 0, max: 150, color: 'rgba(105, 240, 174, 0.2)', label: 'Normative Range (Knees)' }, // Green
	shoulder: { min: 0, max: 180, color: 'rgba(224, 64, 251, 0.2)', label: 'Normative Range (Shoulders)' }, // Magenta/Purple
	hip: { min: 0, max: 135, color: 'rgba(255, 215, 0, 0.25)', label: 'Normative Range (Hips)' }, // Yellow/Gold
	wrist: { min: 0, max: 90, color: 'rgba(24, 255, 255, 0.2)', label: 'Normative Range (Wrists)' }, // Cyan
	ankle: { min: 0, max: 50, color: 'rgba(255, 82, 82, 0.2)', label: 'Normative Range (Ankles)' }, // Red
};

export const JOINT_COLORS = {
	// Active sensor joints
	'knee-central': '#2196f3', // blue
	'hip-yaw':      '#ff9800', // orange
	'hip-pitch':    '#4caf50', // green
	'ankle-yaw':    '#f44336', // red
	// Legacy
	'left-elbow':     '#2196f3',
	'right-elbow':    '#ff9800',
	'left-knee':      '#4caf50',
	'right-knee':     '#f44336',
	'left-shoulder':  '#9c27b0',
	'right-shoulder': '#673ab7',
	'left-hip':       '#ffeb3b',
	'right-hip':      '#ffc107',
	'left-wrist':     '#00bcd4',
	'right-wrist':    '#009688',
	'left-ankle':     '#e91e63',
	'right-ankle':    '#9c27b0',
};

export const JOINT_DATA = {
	'left-elbow': '50,150 100,120 150,100 200,90 250,110 300,130 350,100 400,80 450,100 500,120 550,140 600,130 650,110 700,100 750,120',
	'right-elbow': '50,160 100,140 150,120 200,110 250,130 300,150 350,120 400,100 450,110 500,130 550,150 600,140 650,120 700,110 750,130',
	'left-knee': '50,120 100,100 150,80 200,70 250,90 300,110 350,80 400,60 450,80 500,100 550,120 600,110 650,90 700,80 750,100',
	'right-knee': '50,140 100,130 150,110 200,100 250,120 300,140 350,110 400,90 450,100 500,120 550,130 600,120 650,100 700,90 750,110',
	'left-shoulder': '50,50 100,60 150,80 200,100 250,90 300,70 350,60 400,80 450,100 500,90 550,70 600,60 650,80 700,90 750,70',
	'right-shoulder': '50,60 100,70 150,90 200,110 250,100 300,80 350,70 400,90 450,110 500,100 550,80 600,70 650,90 700,100 750,80',
	'left-hip': '50,30 100,40 150,50 200,40 250,30 300,20 350,30 400,40 450,50 500,40 550,30 600,20 650,30 700,40 750,30',
	'right-hip': '50,40 100,50 150,60 200,50 250,40 300,30 350,40 400,50 450,60 500,50 550,40 600,30 650,40 700,50 750,40',
	'left-wrist': '50,40 100,30 150,20 200,30 250,40 300,50 350,40 400,30 450,20 500,30 550,40 600,50 650,40 700,30 750,40',
	'right-wrist': '50,50 100,40 150,30 200,40 250,50 300,60 350,50 400,40 450,30 500,40 550,50 600,60 650,50 700,40 750,50',
	'left-ankle': '50,20 100,15 150,10 200,15 250,20 300,25 350,20 400,15 450,10 500,15 550,20 600,25 650,20 700,15 750,20',
	'right-ankle': '50,25 100,20 150,15 200,20 250,25 300,30 350,25 400,20 450,15 500,20 550,25 600,30 650,25 700,20 750,25',
};
