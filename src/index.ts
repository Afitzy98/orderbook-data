import { Exchange, OrderBook, Trade, pro } from "ccxt";

import * as Persister from "./persister";
import * as Utils from "./utils";

const { binance } = pro;

const symbols = ["ETH/BUSD"];
const exchnages = [new binance()];

class Symbol {
  base: string;
  quote: string;

  constructor(public symbol: string) {
    const [base, quote] = symbol.split("/");
    this.base = base;
    this.quote = quote;
  }
}

class DataBroker {
  public NewTrade = new Utils.Evt<Trade>();

  constructor(
    public orderbook: OrderBook,
    private _sym: Symbol,
    private _exchange: Exchange
  ) {
    this.watchData();
  }

  private watchData() {
    return Promise.all([this.warchOrderbook(), this.watchTrades()]);
  }

  private async warchOrderbook() {
    while (true) {
      try {
        const market = await this._exchange.watchOrderBook(
          this._sym.symbol,
          10
        );
        this.orderbook = market;
      } catch (err) {
        console.log("Error watching orderbook", err);
      }
    }
  }

  private async watchTrades() {
    while (true) {
      try {
        const trades = await this._exchange.watchTrades(this._sym.symbol);
        trades.forEach((t) => this.NewTrade.trigger(t));
      } catch (err) {
        console.log("Error watching trades", err);
      }
    }
  }
}

const main = async () => {
  const markets = [];

  for (const sym of symbols) {
    const symbol = new Symbol(sym);
    for (const exchange of exchnages) {
      const orderbook = await exchange.fetchOrderBook(symbol.symbol);
      markets.push({
        broker: new DataBroker(orderbook, symbol, exchange),
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
