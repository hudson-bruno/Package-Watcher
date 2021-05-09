import React from 'react';

interface ModalProps {
  open: boolean;
}

const Order: React.FC<ModalProps> = ({ open, children }) => {
  return (
    <div className="modal" style={{ display: open ? 'block' : 'none' }}>
      <div className="modal-content">{children}</div>
    </div>
  );
};

export default Order;
