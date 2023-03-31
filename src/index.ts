import { OrderBook, Trade, pro } from "ccxt";

import * as Broker from "./data-broker";
import * as Persister from "./persister";

const { binance } = pro;

const symbols = ["ETH/BUSD"];
const exchnages = [new binance()];
const book_depth = 25;

const main = async () => {
  const markets = [];

  for (const sym of symbols) {
    const symbol = new Broker.Symbol(sym);
    for (const exchange of exchnages) {
      const orderbook = await exchange.fetchOrderBook(symbol.symbol);
      markets.push({
        broker: new Broker.DataBroker(orderbook, symbol, exchange),
        trade_persister: new Persister.CSVFilePersister<Trade>(
          symbol.symbol,
          exchange.id,
          "trades",
          (t) => `${t.timestamp},${t.price},${t.amount}`
        ),
        orderbook_persister: new Persister.CSVFilePersister<OrderBook>(
          symbol.symbol,
          exchange.id,
          "orderbook",
          (o) =>
            `${o.timestamp},${o.bids.slice(0, book_depth)},${o.asks.slice(
              0,
              book_depth
            )}`
        ),
      });
    }
  }

  // start persisting data
  markets.forEach(({ broker, trade_persister, orderbook_persister }) => {
    const handleOrderbook = () =>
      orderbook_persister.persist({
        ...broker.orderbook,
        timestamp: Math.round(+new Date() / 1000),
      });

    const handleTrades = (t?: Trade) => {
      if (!t) return;
      trade_persister.persist(t);
    };

    broker.NewTrade.on(handleTrades);
    setInterval(handleOrderbook.bind(broker), 1000);
  });
};

main();
