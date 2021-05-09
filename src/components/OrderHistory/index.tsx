/* eslint-disable jsx-a11y/alt-text */
import React from 'react';

import blackCheck from '../../assets/black-circle-check.png';
import deliveryCar from '../../assets/delivery-car.png';
import envelope from '../../assets/envelope.png';
import mapTrifold from '../../assets/map_trifold.png';
import xCircle from '../../assets/x_circle.png';

interface OrderProps {
  date: Date;
  status: string;
  place: string;
}

const Order = ({ date, status, place }: OrderProps) => {
  let icon = blackCheck;
  if (status === 'Objeto saiu para entrega ao destinatário') {
    icon = deliveryCar;
  } else if (status === 'Objeto postado') {
    icon = envelope;
  } else if (status === 'Objeto em trânsito - por favor aguarde') {
    icon = mapTrifold;
  } else if (status === 'Objeto ainda não chegou à unidade') {
    icon = xCircle;
  }

  return (
    <div className="order-history">
      <img className="order-icon" src={icon} />
      <div className="order-history-info">
        <p className="order-history-info-title">{status}</p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <p>{place}</p>
          <p>{`${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
            timeStyle: 'short',
          })}`}</p>
        </div>
      </div>
    </div>
  );
};

export default Order;
