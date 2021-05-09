/* eslint-disable jsx-a11y/alt-text */
import React from 'react';

import blackCheck from '../../assets/black-circle-check.png';
import deliveryCar from '../../assets/delivery-car.png';
import envelope from '../../assets/envelope.png';
import mapTrifold from '../../assets/map_trifold.png';
import trash from '../../assets/trash.png';
import penLine from '../../assets/pen_line.png';

interface OrderProps {
  name: string;
  status: string;
  code: string;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const Order = ({
  name,
  status,
  code,
  onClick,
  onEdit,
  onDelete,
}: OrderProps) => {
  let icon = mapTrifold;
  if (status === 'Postado') {
    icon = envelope;
  } else if (status === 'Entregue') {
    icon = blackCheck;
  } else if (status === 'Saiu para entrega') {
    icon = deliveryCar;
  }

  return (
    <div
      className="order"
      role="button"
      onClick={() => onClick()}
      onKeyDown={() => onClick()}
      tabIndex={0}
    >
      <img className="order-icon" src={icon} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div className="order-info">
          <p className="order-name">{name}</p>
          <p className="order-status">{status}</p>
          <p className="order-code">{code}</p>
        </div>
        <div style={{ display: 'flex' }}>
          <div role="button" onClick={onEdit} onKeyDown={onEdit} tabIndex={0}>
            <img
              className="order-icon"
              style={{ cursor: 'pointer' }}
              src={penLine}
            />
          </div>
          <div
            role="button"
            onClick={onDelete}
            onKeyDown={onDelete}
            tabIndex={0}
          >
            <img
              className="order-icon"
              style={{ cursor: 'pointer' }}
              src={trash}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
