import { OrderBook, Trade, pro } from "ccxt";

import * as Broker from "./data-broker";
import * as Persister from "./persister";

const { binance } = pro;

const symbols = ["ETH/BUSD"];
const exchnages = [new binance()];

const main = async () => {
  const markets = [];

  for (const sym of symbols) {
    const symbol = new Broker.Symbol(sym);
    for (const exchange of exchnages) {
      const orderbook = await exchange.fetchOrderBook(symbol.symbol);
      markets.push({
        broker: new Broker.DataBroker(orderbook, symbol, exchange),
        trade_persister: new Persister.JSONFilePersister<Trade>(
          symbol.symbol,
          exchange.id,
          "trades"
        ),
        orderbook_persister: new Persister.JSONFilePersister<OrderBook>(
          symbol.symbol,
          exchange.id,
          "orderbook"
        ),
      });
    }
  }

  // start persisting data
  markets.forEach(({ broker, trade_persister, orderbook_persister }) => {
    const handleOrderbook = () =>
      orderbook_persister.persist(
        new Date().getTime().toString(),
        broker.orderbook
      );

    const handleTrades = (t?: Trade) => {
      if (!t) return;
      trade_persister.persist(t.timestamp.toString(), t);
    };

    broker.NewTrade.on(handleTrades);
    setInterval(handleOrderbook.bind(broker), 1000);
  });
};

main();
