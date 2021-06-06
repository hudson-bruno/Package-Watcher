/* eslint-disable jsx-a11y/alt-text */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { nanoid } from 'nanoid';
import {
  rastrearEncomendas,
  RastreioEvent,
  RastreioResponse,
} from 'correios-brasil';
import Store from 'electron-store';

import Order from './components/Order';
import OrderHistory from './components/OrderHistory';
import Modal from './components/Modal';

import deliveryCar from './assets/delivery-car.png';
import blackPin from './assets/black-pin.png';

import './App.global.css';

interface History {
  status: string;
  date: Date;
  place: string;
}

interface Orders {
  name: string;
  status: string;
  code: string;
  startDate: Date;
  history: Array<History>;
  origin: string;
}

function parseDate(date: string, hours: string) {
  const splitedDate = date.split('/');

  return new Date(
    `${splitedDate[1]}/${splitedDate[0]}/${splitedDate[2]} ${hours}`
  );
}

function parseOrder(
  name: string,
  code: string,
  rawOrder: Array<RastreioEvent>
): Orders {
  let orderHistories: Array<History> = [];
  const ordersResponse = [...rawOrder];

  ordersResponse.reverse();

  orderHistories = ordersResponse.map((element) => {
    if (element.local) {
      return {
        date: parseDate(element.data, element.hora),
        status: element.status,
        place: element.local === 'País - /' ? 'Exterior' : element.local,
      };
    }

    return {
      date: parseDate(element.data, element.hora),
      status: element.status,
      place: element.origem ? element.origem : 'Desconhecido',
    };
  });

  let status = 'Em trânsito';
  if (ordersResponse[0].status === 'Objeto postado') {
    status = 'Postado';
  } else if (ordersResponse[0].status === 'Objeto entregue ao destinatário') {
    status = 'Entregue';
  } else if (
    ordersResponse[0].status === 'Objeto saiu para entrega ao destinatário'
  ) {
    status = 'Saiu para entrega';
  }

  return {
    name,
    status,
    code,
    history: orderHistories,
    startDate: parseDate(
      ordersResponse[ordersResponse.length - 1].data,
      ordersResponse[ordersResponse.length - 1].hora
    ),
    origin:
      ordersResponse[ordersResponse.length - 1].local === 'País - /'
        ? 'Exterior'
        : (ordersResponse[ordersResponse.length - 1].local as string),
  };
}

const store = new Store();
let updateInterval;

const Home = () => {
  const [orders, setOrders] = useState<Array<Orders>>([]);
  const [selectedOrder, setSelectedOrder] = useState(0);
  const [modal, setModal] = useState({
    open: false,
    status: 'create',
    title: '',
    code: '',
    editIndex: 0,
  });

  useEffect(() => {
    let savedOrders = store.get('orders') as Array<Orders>;
    if (savedOrders) {
      savedOrders = savedOrders.map((order) => {
        const startDate = new Date(order.startDate);
        const history = order.history.map((entry) => ({
          ...entry,
          date: new Date(entry.date),
        }));

        return {
          ...order,
          startDate,
          history,
        };
      });

      setOrders(savedOrders);
    }
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const updatedOrders = [...orders];

      const ordersCode = updatedOrders.map((order) => order.code);

      rastrearEncomendas(ordersCode)
        .then((response) => {
          try {
            for (let i = 0; i < updatedOrders.length; i += 1) {
              updatedOrders[i] = parseOrder(
                updatedOrders[i].name,
                updatedOrders[i].code,
                response[i]
              );
            }

            return setOrders(updatedOrders);
          } catch (err) {
            // eslint-disable-next-line no-console
            return console.log(err);
          }
        })
        // eslint-disable-next-line no-console
        .catch((err) => console.log(err));
    }
  }, [orders]);

  return (
    <>
      <div id="orders-list">
        {orders.length === 0 ? (
          <p id="empty-text">
            Clique no botão + logo abaixo para adicionar um novo rastreio.
          </p>
        ) : (
          orders.map((order, index) => (
            <Order
              key={nanoid()}
              name={order.name}
              status={order.status}
              code={order.code}
              onClick={() => setSelectedOrder(index)}
              onEdit={() => {
                setModal({
                  open: true,
                  status: 'edit',
                  title: order.name,
                  code: order.code,
                  editIndex: index,
                });
              }}
              onDelete={() => {
                const newOrders = [...orders].splice(index + 1, 1);

                store.set('orders', newOrders);

                setOrders(newOrders);
              }}
            />
          ))
        )}

        <button
          id="add-order-button"
          type="button"
          onClick={() => {
            setModal({ ...modal, open: true, status: 'create' });
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 1000 1000"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d=" M 512 150C 512 150 512 487 512 487C 512 487 850 487 850 487C 850 487 850 512 850 512C 850 512 512 512 512 512C 512 512 512 850 512 850C 512 850 487 850 487 850C 487 850 487 512 487 512C 487 512 150 512 150 512C 150 512 150 487 150 487C 150 487 487 487 487 487C 487 487 487 150 487 150C 487 150 512 150 512 150" />
          </svg>
        </button>
      </div>
      {orders.length > 0 && (
        <div id="order-details">
          <div id="order-details-header">
            <div
              className="order-detail-info"
              style={{ borderRight: '2px solid rgb(240, 240, 240)' }}
            >
              <img className="order-icon" src={deliveryCar} />
              <p>
                {orders[selectedOrder].status === 'Entregue'
                  ? `Recebido em ${Math.floor(
                      Math.abs(
                        orders[selectedOrder].history[0].date.getTime() -
                          orders[selectedOrder].startDate.getTime()
                      ) /
                        (1000 * 60 * 60 * 24)
                    )} dias`
                  : `Enviado a ${Math.floor(
                      Math.abs(
                        new Date().getTime() -
                          orders[selectedOrder].startDate.getTime()
                      ) /
                        (1000 * 60 * 60 * 24)
                    )} dias`}
              </p>
            </div>

            <div className="order-detail-info">
              <img className="order-icon" src={blackPin} />
              <p>Enviado de {orders[selectedOrder].origin}</p>
            </div>
          </div>
          <div className="order-history-collection">
            {orders[selectedOrder].history.map((orderHistory) => (
              <OrderHistory
                key={nanoid()}
                date={orderHistory.date}
                status={orderHistory.status}
                place={orderHistory.place}
              />
            ))}
          </div>
        </div>
      )}
      <Modal open={modal.open}>
        <div style={{ height: '80%' }}>
          <div className="modal-content-input">
            <p>Título</p>
            <input
              type="text"
              value={modal.title}
              onChange={(event) =>
                setModal({ ...modal, title: event.target.value })
              }
            />
          </div>

          <div className="modal-content-input">
            <p>Código</p>
            <input
              type="text"
              value={modal.code}
              onChange={(event) =>
                setModal({ ...modal, code: event.target.value })
              }
            />
          </div>
        </div>

        <div
          style={{ height: 50, display: 'flex', justifyContent: 'flex-end' }}
        >
          <button
            className="modal-button"
            type="button"
            onClick={() => {
              if (modal.status === 'create') {
                return rastrearEncomendas([modal.code])
                  .then((response) => {
                    try {
                      let orderHistories: Array<History> = [];
                      let ordersResponse: RastreioResponse = [];

                      if (response) {
                        ordersResponse = (response[0] as unknown) as Array<
                          RastreioEvent
                        >;
                        ordersResponse.reverse();

                        orderHistories = ordersResponse.map((element) => {
                          if (element.local) {
                            return {
                              date: parseDate(element.data, element.hora),
                              status: element.status,
                              place:
                                element.local === 'País - /'
                                  ? 'Exterior'
                                  : element.local,
                            };
                          }

                          return {
                            date: parseDate(element.data, element.hora),
                            status: element.status,
                            place: element.origem
                              ? element.origem
                              : 'Desconhecido',
                          };
                        });
                      }

                      const newOrders = [...orders];
                      let status = 'Em trânsito';
                      if (ordersResponse[0].status === 'Objeto postado') {
                        status = 'Postado';
                      } else if (
                        ordersResponse[0].status ===
                        'Objeto entregue ao destinatário'
                      ) {
                        status = 'Entregue';
                      } else if (
                        ordersResponse[0].status ===
                        'Objeto saiu para entrega ao destinatário'
                      ) {
                        status = 'Saiu para entrega';
                      }

                      newOrders.push({
                        name: modal.title,
                        status,
                        code: modal.code,
                        history: orderHistories,
                        startDate: parseDate(
                          ordersResponse[ordersResponse.length - 1].data,
                          ordersResponse[ordersResponse.length - 1].hora
                        ),
                        origin:
                          ordersResponse[ordersResponse.length - 1].local ===
                          'País - /'
                            ? 'Exterior'
                            : (ordersResponse[ordersResponse.length - 1]
                                .local as string),
                      });

                      setModal({ ...modal, open: false, title: '', code: '' });

                      store.set('orders', newOrders);

                      return setOrders(newOrders);
                    } catch (err) {
                      return setModal({ ...modal, open: false });
                    }
                  })
                  .catch(() => setModal({ ...modal, open: false }));
              }
              const newOrders = [...orders];
              newOrders[modal.editIndex] = {
                ...newOrders[modal.editIndex],
                name: modal.title,
                code: modal.code,
              };
              setOrders(newOrders);

              return setModal({ ...modal, open: false, title: '', code: '' });
            }}
          >
            Salvar
          </button>
          <button
            className="modal-button"
            type="button"
            onClick={() =>
              setModal({ ...modal, open: false, title: '', code: '' })
            }
          >
            Cancelar
          </button>
        </div>
      </Modal>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Home} />
      </Switch>
    </Router>
  );
}
