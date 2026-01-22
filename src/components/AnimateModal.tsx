import * as S from '../styles';

interface AnimateModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function AnimateModal({ isOpen, onClose }: AnimateModalProps) {
	if (!isOpen) return null;

	return (
		<S.ModalOverlay onClick={onClose}>
			<S.ModalContent onClick={e => e.stopPropagation()}>
				<S.ModalHeader>
					<S.ModalTitle>Animation Settings</S.ModalTitle>
					<S.CloseButton onClick={onClose}>×</S.CloseButton>
				</S.ModalHeader>
				<S.ModalBody>
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
