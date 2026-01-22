import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as S from '../styles';

export type JointType = 'hip' | 'knee' | 'ankle' | 'shoulder' | 'elbow' | 'wrist';
export type TargetJoint = 'leftHip' | 'rightHip' | 'leftKnee' | 'rightKnee' | 'leftAnkle' | 'rightAnkle' | 'leftShoulder' | 'rightShoulder' | 'leftElbow' | 'rightElbow' | 'leftWrist' | 'rightWrist';

interface AnimateModalProps {
	isOpen: boolean;
	onClose: () => void;
	targetJoint?: TargetJoint;
}

// Map target joints to bone name patterns
const JOINT_BONE_PATTERNS: Record<TargetJoint, string[]> = {
	leftHip: ['lefthip', 'l_hip'],
	rightHip: ['righthip', 'r_hip'],
	leftKnee: ['leftleg', 'leftthigh', 'l_leg', 'l_thigh'],
	rightKnee: ['rightleg', 'rightthigh', 'r_leg', 'r_thigh'],
	leftAnkle: ['leftfoot', 'l_foot'],
	rightAnkle: ['rightfoot', 'r_foot'],
	leftShoulder: ['leftshoulder', 'l_shoulder'],
	rightShoulder: ['rightshoulder', 'r_shoulder'],
	leftElbow: ['leftarm', 'leftforearm', 'l_arm', 'l_forearm'],
	rightElbow: ['rightarm', 'rightforearm', 'r_arm', 'r_forearm'],
	leftWrist: ['lefthand', 'l_hand'],
	rightWrist: ['righthand', 'r_hand'],
};

// Camera positioning parameters for each joint
const CAMERA_CONFIGS: Record<TargetJoint, { distanceMultiplierX: number; distanceMultiplierY: number; distanceMultiplierZ: number }> = {
	leftHip: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	rightHip: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	leftKnee: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	rightKnee: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	leftAnkle: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	rightAnkle: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	leftShoulder: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	rightShoulder: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	leftElbow: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	rightElbow: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	leftWrist: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
	rightWrist: { distanceMultiplierX: 0.1, distanceMultiplierY: 0.1, distanceMultiplierZ: 0.1 },
};

export function AnimateModal({ isOpen, onClose, targetJoint = 'rightElbow' }: AnimateModalProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const sceneRef = useRef<THREE.Scene | null>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isOpen || !containerRef.current) return;

		// Scene setup
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf5f5f5);
		sceneRef.current = scene;

		// Camera setup
		const camera = new THREE.PerspectiveCamera(
			75,
			containerRef.current.clientWidth / containerRef.current.clientHeight,
			0.1,
			1000
		);
		camera.position.z = 5;

		// Renderer setup
		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
		renderer.setPixelRatio(window.devicePixelRatio);
		containerRef.current.appendChild(renderer.domElement);
		rendererRef.current = renderer;

		// Lighting
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(5, 5, 5);
		scene.add(directionalLight);

		// Load character model
		const loader = new GLTFLoader();
		loader.load('/src/assets/character/scene.gltf', (gltf) => {
			const model = gltf.scene;
			scene.add(model);

			// Find the target joint bone
			let targetBone: THREE.Bone | null = null;
			const bonePatterns = JOINT_BONE_PATTERNS[targetJoint];
			
			model.traverse((node) => {
				if (node instanceof THREE.Bone && !targetBone) {
					const name = node.name.toLowerCase();
					if (bonePatterns.some(pattern => name.includes(pattern))) {
						targetBone = node;
					}
				}
			});

			// Calculate camera position based on bounding box
			const box = new THREE.Box3().setFromObject(model);
			const size = box.getSize(new THREE.Vector3());
			const maxDim = Math.max(size.x, size.y, size.z);
			const fov = camera.fov * (Math.PI / 180);
			let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
			cameraDistance *= 1.5; // Add padding

			const cameraConfig = CAMERA_CONFIGS[targetJoint];

			if (targetBone) {
				// Focus camera on the target joint bone
				const jointWorldPos = new THREE.Vector3();
				targetBone.getWorldPosition(jointWorldPos);
				
				// Position camera to view the joint from a good angle, zoomed in
				camera.position.copy(jointWorldPos);
				camera.position.x += cameraDistance * cameraConfig.distanceMultiplierX;
				camera.position.y += cameraDistance * cameraConfig.distanceMultiplierY;
				camera.position.z += cameraDistance * cameraConfig.distanceMultiplierZ;
				camera.lookAt(jointWorldPos);
			} else {
				// Fallback: frame the entire model if bone not found
				const center = box.getCenter(new THREE.Vector3());
				model.position.sub(center);
				camera.position.set(center.x + cameraDistance * 0.5, center.y + cameraDistance * 0.3, cameraDistance);
				camera.lookAt(center);
				console.warn(`Target joint "${targetJoint}" bone not found, framing entire model instead`);
			}
		});

		// Animation loop
		const animate = () => {
			animationFrameRef.current = requestAnimationFrame(animate);
			renderer.render(scene, camera);
		};
		animate();

		// Handle window resize
		const handleResize = () => {
			if (!containerRef.current) return;
			const width = containerRef.current.clientWidth;
			const height = containerRef.current.clientHeight;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.setSize(width, height);
		};
		window.addEventListener('resize', handleResize);

		// Cleanup
		return () => {
			window.removeEventListener('resize', handleResize);
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
				containerRef.current.removeChild(renderer.domElement);
			}
			renderer.dispose();
		};
	}, [isOpen, targetJoint]);

	if (!isOpen) return null;

	return (
		<S.ModalOverlay onClick={onClose}>
			<S.ModalContent onClick={e => e.stopPropagation()}>
				<S.ModalHeader>
					<S.ModalTitle>Animation Settings</S.ModalTitle>
					<S.CloseButton onClick={onClose}>×</S.CloseButton>
				</S.ModalHeader>
				<S.ModalBody>
					<div ref={containerRef} style={{ width: '100%', height: '400px', marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f5f5f5' }} />
					<div style={{ marginBottom: '16px' }}>
						<label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
							Play Speed
						</label>
						<input type="range" min="0.5" max="2" step="0.5" defaultValue="1" style={{ width: '100%' }} />
					</div>
					<div style={{ marginBottom: '16px' }}>
						<label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
							Loop Animation
						</label>
						<input type="checkbox" defaultChecked />
					</div>
				</S.ModalBody>
				<S.ModalFooter>
					<S.Button className="secondary" onClick={onClose}>
						Cancel
					</S.Button>
					<S.Button onClick={onClose}>Play</S.Button>
				</S.ModalFooter>
			</S.ModalContent>
		</S.ModalOverlay>
	);
}
