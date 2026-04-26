import { useEffect, useRef, useState } from 'preact/hooks';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import sceneUrl from '../assets/character/scene.gltf?url';
// @ts-ignore — force Vite to bundle the binary alongside the gltf
import '../assets/character/scene.bin?url';
import * as S from '../styles';
import { JOINTS, JOINT_COLORS, ACTIVE_JOINTS } from '../constants/joints';

// ── Singleton GLTF cache ─────────────────────────────────────────────────────
// The model is fetched once when this module first imports; re-opening the modal
// never re-fetches.  Each call returns a SkeletonUtils.clone so skinned-mesh
// bones are properly rebound (Object3D.clone breaks skinned meshes).
let _gltfRoot: THREE.Group | null = null;
let _gltfPromise: Promise<THREE.Group> | null = null;

function getCachedModel(): Promise<THREE.Group> {
	if (!_gltfPromise) {
		_gltfPromise = new Promise((resolve, reject) => {
			const loader = new GLTFLoader();
			const base = sceneUrl.substring(0, sceneUrl.lastIndexOf('/') + 1);
			loader.setResourcePath(base);
			loader.load(sceneUrl, gltf => {
				_gltfRoot = gltf.scene;
				resolve(SkeletonUtils.clone(_gltfRoot) as THREE.Group);
			}, undefined, reject);
		});
	}
	return _gltfPromise.then(() => SkeletonUtils.clone(_gltfRoot!) as THREE.Group);
}

// ── Bone patterns per joint value ────────────────────────────────────────────
// Patterns are matched against lowercased bone names. Order matters — first
// match wins, so place the most specific pattern first.
// `exclude` rejects bones whose name contains any of these substrings (avoids
// e.g. "leftleg" matching "leftupleg").
type PatternCfg = { patterns: string[]; exclude?: string[]; axis: 'x' | 'y' | 'z' };
const BONE_PATTERNS: Record<string, PatternCfg> = {
	'knee-central': { patterns: ['leftleg', 'l_leg'], exclude: ['upleg'], axis: 'x' },
	'hip-yaw':      { patterns: ['leftupleg', 'l_upleg', 'l_thigh'], axis: 'y' },
	'hip-pitch':    { patterns: ['leftupleg', 'l_upleg', 'l_thigh'], axis: 'x' },
	'ankle-yaw':    { patterns: ['leftfoot', 'l_foot'], axis: 'y' },
	'left-knee':    { patterns: ['leftleg', 'l_leg'], exclude: ['upleg'], axis: 'x' },
	'right-knee':   { patterns: ['rightleg', 'r_leg'], exclude: ['upleg'], axis: 'x' },
	'left-hip':     { patterns: ['leftupleg', 'l_upleg', 'l_thigh'], axis: 'x' },
	'right-hip':    { patterns: ['rightupleg', 'r_upleg', 'r_thigh'], axis: 'x' },
	'left-ankle':   { patterns: ['leftfoot', 'l_foot'], axis: 'x' },
	'right-ankle':  { patterns: ['rightfoot', 'r_foot'], axis: 'x' },
	'left-shoulder':  { patterns: ['leftshoulder', 'leftarm', 'l_shoulder'], axis: 'x' },
	'right-shoulder': { patterns: ['rightshoulder', 'rightarm', 'r_shoulder'], axis: 'x' },
	'left-elbow':   { patterns: ['leftforearm', 'l_forearm'], axis: 'x' },
	'right-elbow':  { patterns: ['rightforearm', 'r_forearm'], axis: 'x' },
	'left-wrist':   { patterns: ['lefthand', 'l_hand'], axis: 'x' },
	'right-wrist':  { patterns: ['righthand', 'r_hand'], axis: 'x' },
};

// Per-bone initial (rest-pose) quaternion — captured once when bones are mapped
type BoneEntry = { bone: THREE.Bone; restQ: THREE.Quaternion; axis: 'x' | 'y' | 'z' };

interface AnimateModalProps {
	isOpen: boolean;
	onClose: () => void;
	/** Current angles for all active joints (live or playback frame) */
	jointAngles: Record<string, number>;
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const css = {
	overlay: {
		position: 'fixed' as const,
		inset: 0,
		background: 'rgba(0,0,0,0.55)',
		backdropFilter: 'blur(6px)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1000,
		padding: '16px',
	},
	dialog: {
		background: 'var(--bg-panel,#fff)',
		borderRadius: '20px',
		boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
		width: 'min(96vw,1100px)',
		height: 'min(92vh,780px)',
		display: 'flex',
		flexDirection: 'column' as const,
		overflow: 'hidden',
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '14px 20px 12px',
		borderBottom: '1px solid var(--shadow-dark,#e5e5e5)',
		flexShrink: 0,
	},
	title: {
		fontSize: '17px',
		fontWeight: 700,
		color: 'var(--text-main,#1a1a1a)',
		letterSpacing: '-0.3px',
	},
	closeBtn: {
		width: '32px',
		height: '32px',
		borderRadius: '50%',
		border: '1px solid var(--shadow-dark,#ddd)',
		background: 'var(--bg-base,#f5f5f5)',
		cursor: 'pointer',
		fontSize: '18px',
		lineHeight: '30px',
		textAlign: 'center' as const,
		color: 'var(--text-secondary,#666)',
	},
	body: {
		display: 'flex',
		flex: 1,
		minHeight: 0,
	},
	viewport: {
		flex: 1,
		position: 'relative' as const,
		background: 'linear-gradient(145deg,#e8edf5 0%,#f4f7fb 60%,#eaf0f8 100%)',
		cursor: 'grab',
	},
	sidebar: {
		width: '220px',
		flexShrink: 0,
		padding: '16px 14px',
		borderLeft: '1px solid var(--shadow-dark,#e5e5e5)',
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '14px',
		overflowY: 'auto' as const,
		background: 'var(--bg-panel,#fff)',
	},
	sectionLabel: {
		fontSize: '10px',
		fontWeight: 700,
		letterSpacing: '1.5px',
		textTransform: 'uppercase' as const,
		color: 'var(--text-secondary,#888)',
		marginBottom: '4px',
	},
	footer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '10px 20px',
		borderTop: '1px solid var(--shadow-dark,#e5e5e5)',
		flexShrink: 0,
	},
};

const dot = (color: string) => ({
	width: '8px', height: '8px', borderRadius: '50%',
	background: color, flexShrink: 0,
});
const angleCard = (color: string) => ({
	borderRadius: '12px',
	background: `${color}14`,
	border: `1px solid ${color}40`,
	padding: '10px 12px',
});
const jointBtn = (active: boolean, color: string) => ({
	display: 'flex',
	alignItems: 'center',
	gap: '8px',
	padding: '7px 10px',
	borderRadius: '10px',
	border: `1px solid ${active ? color : 'transparent'}`,
	background: active ? `${color}18` : 'var(--bg-base,#f5f5f5)',
	cursor: 'pointer',
	fontSize: '12px',
	fontWeight: active ? 700 : 400,
	color: active ? color : 'var(--text-main,#333)',
	transition: 'all .15s',
	width: '100%',
	marginBottom: '4px',
});
const ctrlBtn = (on?: boolean) => ({
	padding: '7px 12px',
	borderRadius: '10px',
	border: '1px solid var(--shadow-dark,#ddd)',
	background: on ? 'rgba(33,150,243,0.1)' : 'var(--bg-base,#f5f5f5)',
	cursor: 'pointer',
	fontSize: '12px',
	fontWeight: 600,
	color: on ? '#2196f3' : 'var(--text-main,#333)',
	width: '100%',
	textAlign: 'left' as const,
	marginBottom: '4px',
});

export function AnimateModal({ isOpen, onClose, jointAngles }: AnimateModalProps) {
	const [selectedJoint, setSelectedJoint] = useState<string>(ACTIVE_JOINTS[0]);
	const [showGrid, setShowGrid] = useState(true);
	const [isDragging, setIsDragging] = useState(false);
	const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

	const containerRef = useRef<HTMLDivElement>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const bonesRef = useRef<Record<string, BoneEntry>>({});
	const prevSelectedRef = useRef<string | null>(null);
	const gridRef = useRef<THREE.GridHelper | null>(null);
	const rafRef = useRef<number | null>(null);
	const jointAnglesRef = useRef(jointAngles);
	const selectedJointRef = useRef(selectedJoint);
	const orbit = useRef({ theta: 0.3, phi: 1.1, radius: 5, panX: 0, panY: 0, lastX: 0, lastY: 0, btn: -1 });

	// Keep refs fresh without re-triggering setup
	useEffect(() => { jointAnglesRef.current = jointAngles; }, [jointAngles]);
	useEffect(() => { selectedJointRef.current = selectedJoint; }, [selectedJoint]);

	// ── Three.js scene (once per open) ───────────────────────────────────
	useEffect(() => {
		if (!isOpen || !containerRef.current) return;
		setLoadState('loading');
		const container = containerRef.current;

		const scene = new THREE.Scene();
		sceneRef.current = scene;

		const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.01, 1000);
		cameraRef.current = camera;

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.shadowMap.enabled = true;
		container.appendChild(renderer.domElement);
		rendererRef.current = renderer;

		// Lighting
		scene.add(new THREE.AmbientLight(0xffffff, 0.7));
		const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(4, 8, 5); scene.add(key);
		const fill = new THREE.DirectionalLight(0xb0c8ff, 0.4); fill.position.set(-4, 2, -3); scene.add(fill);

		// Grid
		const grid = new THREE.GridHelper(10, 20, 0xcccccc, 0xe5e5e5);
		grid.position.y = -1.1;
		scene.add(grid);
		gridRef.current = grid;

		// Camera update helper
		const applyOrbit = () => {
			const { theta, phi, radius, panX, panY } = orbit.current;
			const x = radius * Math.sin(phi) * Math.sin(theta);
			const y = radius * Math.cos(phi);
			const z = radius * Math.sin(phi) * Math.cos(theta);
			if (cameraRef.current) {
				cameraRef.current.position.set(x + panX, y + panY, z);
				cameraRef.current.lookAt(panX, panY, 0);
			}
		};

		// Load cached model
		getCachedModel().then(model => {
			scene.add(model);

			const box = new THREE.Box3().setFromObject(model);
			const centre = box.getCenter(new THREE.Vector3());
			const size = box.getSize(new THREE.Vector3());
			model.position.sub(centre);
			grid.position.y = -size.y / 2;

			// Map all joint bones up-front and snapshot rest-pose quaternions
			const bones: Record<string, BoneEntry> = {};
			model.traverse(node => {
				if (!(node instanceof THREE.Bone)) return;
				const name = node.name.toLowerCase();
				Object.entries(BONE_PATTERNS).forEach(([jid, cfg]) => {
					if (!bones[jid]
						&& cfg.patterns.some(p => name.includes(p))
						&& !(cfg.exclude?.some(ex => name.includes(ex)))) {
						bones[jid] = {
							bone: node,
							restQ: node.quaternion.clone(),
							axis: cfg.axis,
						};
					}
				});
			});
			bonesRef.current = bones;
			console.log('[AnimateModal] mapped bones:', Object.keys(bones));

			orbit.current.radius = Math.max(size.x, size.y, size.z) * 1.8;
			applyOrbit();
			setLoadState('ready');
		}).catch(() => setLoadState('error'));

		// Render loop
		// Reusable scratch objects (allocated once outside tick to avoid GC)
		const _q = new THREE.Quaternion();
		const _axisX = new THREE.Vector3(1, 0, 0);
		const _axisY = new THREE.Vector3(0, 1, 0);
		const _axisZ = new THREE.Vector3(0, 0, 1);

		const tick = () => {
			rafRef.current = requestAnimationFrame(tick);
			const angles = jointAnglesRef.current;
			const boneMap = bonesRef.current;

			// 1) Reset every mapped bone to its rest-pose quaternion
			const resetDone = new Set<THREE.Bone>();
			Object.values(boneMap).forEach(entry => {
				if (!resetDone.has(entry.bone)) {
					entry.bone.quaternion.copy(entry.restQ);
					resetDone.add(entry.bone);
				}
			});

			// 2) Accumulate rotation deltas — multiple joints may share one bone
			Object.entries(boneMap).forEach(([jid, entry]) => {
				if (!(jid in angles)) return;
				const rad = (angles[jid] * Math.PI) / 180;
				switch (entry.axis) {
					case 'x': _q.setFromAxisAngle(_axisX, rad); break;
					case 'y': _q.setFromAxisAngle(_axisY, rad); break;
					case 'z': _q.setFromAxisAngle(_axisZ, rad); break;
				}
				entry.bone.quaternion.multiply(_q);
			});
			// Restore emissive on previously-highlighted bone
			const prevSel = prevSelectedRef.current;
			if (prevSel && prevSel !== selectedJointRef.current && bonesRef.current[prevSel]) {
				bonesRef.current[prevSel].bone.traverse(child => {
					if (child instanceof THREE.Mesh && child.material) {
						const mat = child.material as THREE.MeshStandardMaterial;
						if (mat.emissive) mat.emissive.setScalar(0);
					}
				});
			}
			prevSelectedRef.current = selectedJointRef.current;

			// Highlight the selected bone with an emissive color pulse
			const sel = bonesRef.current[selectedJointRef.current];
			if (sel) {
				const jColor = JOINT_COLORS[selectedJointRef.current as keyof typeof JOINT_COLORS] ?? '#2196f3';
				const pulseT = 0.35 + 0.35 * Math.sin(performance.now() / 400);   // 0 – 0.7
				sel.bone.traverse(child => {
					if (child instanceof THREE.Mesh && child.material) {
						const mat = child.material as THREE.MeshStandardMaterial;
						if (mat.emissive) {
							mat.emissive.set(jColor);
							mat.emissiveIntensity = pulseT;
						}
					}
				});
			}
			renderer.render(scene, camera);
		};
		tick();

		// Pointer controls
		const el = renderer.domElement;
		const onDown = (e: PointerEvent) => {
			orbit.current.lastX = e.clientX; orbit.current.lastY = e.clientY;
			orbit.current.btn = e.button;
			el.setPointerCapture(e.pointerId);
			setIsDragging(true);
		};
		const onMove = (e: PointerEvent) => {
			if (orbit.current.btn === -1) return;
			const dx = e.clientX - orbit.current.lastX;
			const dy = e.clientY - orbit.current.lastY;
			orbit.current.lastX = e.clientX; orbit.current.lastY = e.clientY;
			if (orbit.current.btn === 2 || e.shiftKey) {
				const s = orbit.current.radius * 0.001;
				orbit.current.panX -= dx * s;
				orbit.current.panY += dy * s;
			} else {
				orbit.current.theta -= dx * 0.008;
				orbit.current.phi = Math.max(0.05, Math.min(Math.PI - 0.05, orbit.current.phi + dy * 0.008));
			}
			applyOrbit();
		};
		const onUp = () => { orbit.current.btn = -1; setIsDragging(false); };
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			orbit.current.radius = Math.max(0.5, orbit.current.radius * (1 + e.deltaY * 0.001));
			applyOrbit();
		};
		el.addEventListener('pointerdown', onDown);
		el.addEventListener('pointermove', onMove);
		el.addEventListener('pointerup', onUp);
		el.addEventListener('pointercancel', onUp);
		el.addEventListener('contextmenu', e => e.preventDefault());
		el.addEventListener('wheel', onWheel, { passive: false });

		// Resize observer
		const ro = new ResizeObserver(() => {
			if (!container || !cameraRef.current || !rendererRef.current) return;
			cameraRef.current.aspect = container.clientWidth / container.clientHeight;
			cameraRef.current.updateProjectionMatrix();
			rendererRef.current.setSize(container.clientWidth, container.clientHeight);
		});
		ro.observe(container);

		return () => {
			ro.disconnect();
			el.removeEventListener('pointerdown', onDown);
			el.removeEventListener('pointermove', onMove);
			el.removeEventListener('pointerup', onUp);
			el.removeEventListener('pointercancel', onUp);
			el.removeEventListener('wheel', onWheel);
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
			renderer.dispose();
			rendererRef.current = null;
			sceneRef.current = null;
			cameraRef.current = null;
		};
	}, [isOpen]);

	// Grid toggle
	useEffect(() => { if (gridRef.current) gridRef.current.visible = showGrid; }, [showGrid]);

	// Reset camera
	const resetCamera = () => {
		Object.assign(orbit.current, { theta: 0.3, phi: 1.1, panX: 0, panY: 0 });
		if (cameraRef.current) {
			const { theta, phi, radius, panX, panY } = orbit.current;
			const x = radius * Math.sin(phi) * Math.sin(theta);
			const y = radius * Math.cos(phi);
			const z = radius * Math.sin(phi) * Math.cos(theta);
			cameraRef.current.position.set(x + panX, y + panY, z);
			cameraRef.current.lookAt(panX, panY, 0);
		}
	};

	if (!isOpen) return null;

	const activeColor = JOINT_COLORS[selectedJoint as keyof typeof JOINT_COLORS] ?? '#2196f3';
	const currentAngle = jointAngles[selectedJoint] ?? 0;

	return (
		<div style={css.overlay} onClick={onClose}>
			<div style={css.dialog} onClick={e => e.stopPropagation()}>

				{/* Header */}
				<div style={css.header}>
					<span style={css.title}>3D Motion Viewer</span>
					<button style={css.closeBtn} onClick={onClose}>×</button>
				</div>

				{/* Body */}
				<div style={css.body}>

					{/* 3-D viewport */}
					<div ref={containerRef} style={{ ...css.viewport, cursor: isDragging ? 'grabbing' : 'grab' }}>
						{loadState !== 'ready' && (
							<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary,#888)', fontSize: '14px' }}>
								{loadState === 'loading' ? <><div style={{ fontSize: '28px' }}>⏳</div>Loading model…</> : <><div style={{ fontSize: '28px' }}>⚠️</div>Failed to load model</>}
							</div>
						)}
						{loadState === 'ready' && (
							<div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.35)', color: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
								Drag to orbit · Scroll to zoom · Shift+drag to pan
							</div>
						)}
					</div>

					{/* Sidebar */}
					<div style={css.sidebar}>

						{/* Angle readout */}
						<div>
							<div style={css.sectionLabel}>Current Angle</div>
							<div style={angleCard(activeColor)}>
								<div style={{ fontSize: '24px', fontWeight: 800, color: activeColor, lineHeight: 1 }}>{currentAngle.toFixed(1)}°</div>
								<div style={{ fontSize: '10px', color: 'var(--text-secondary,#888)', marginTop: '3px' }}>
									{JOINTS.find(j => j.value === selectedJoint)?.label ?? selectedJoint}
								</div>
							</div>
						</div>

						{/* Joint selector */}
						<div>
							<div style={css.sectionLabel}>Joint</div>
							{(ACTIVE_JOINTS as unknown as string[]).map(jid => {
								const color = JOINT_COLORS[jid as keyof typeof JOINT_COLORS] ?? '#888';
								const label = JOINTS.find(j => j.value === jid)?.label ?? jid;
								return (
									<button key={jid} style={jointBtn(jid === selectedJoint, color)} onClick={() => setSelectedJoint(jid)}>
										<div style={dot(color)} />
										{label}
										<span style={{ marginLeft: 'auto', fontSize: '11px', opacity: .7 }}>
											{(jointAngles[jid] ?? 0).toFixed(1)}°
										</span>
									</button>
								);
							})}
						</div>

						{/* Camera controls */}
						<div>
							<div style={css.sectionLabel}>View</div>
							<button style={ctrlBtn()} onClick={resetCamera}>↺ Reset Camera</button>
							<button style={ctrlBtn(showGrid)} onClick={() => setShowGrid(g => !g)}>
								{showGrid ? '▦ Hide Grid' : '▦ Show Grid'}
							</button>
						</div>

						{/* All-joints readout */}
						<div>
							<div style={css.sectionLabel}>All Joints</div>
							{(ACTIVE_JOINTS as unknown as string[]).map(jid => {
								const color = JOINT_COLORS[jid as keyof typeof JOINT_COLORS] ?? '#888';
								return (
									<div key={jid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--shadow-dark,#f0f0f0)' }}>
										<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
											<div style={dot(color)} />
											<span style={{ fontSize: '11px', color: 'var(--text-secondary,#666)' }}>
												{JOINTS.find(j => j.value === jid)?.label ?? jid}
											</span>
										</div>
										<span style={{ fontSize: '12px', fontWeight: 700, color }}>{(jointAngles[jid] ?? 0).toFixed(1)}°</span>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Footer */}
				<div style={css.footer}>
					<span style={{ fontSize: '11px', color: 'var(--text-secondary,#888)' }}>
						{Object.keys(jointAngles).length} active sensor{Object.keys(jointAngles).length !== 1 ? 's' : ''} · bones driven in real time
					</span>
					<S.Button onClick={onClose}>Close</S.Button>
				</div>

			</div>
		</div>
	);
}
