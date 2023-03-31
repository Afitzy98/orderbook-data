import { Exchange, OrderBook, Trade } from "ccxt";

import * as Utils from "./utils";

export class Symbol {
  base: string;
  quote: string;

  constructor(public symbol: string) {
    const [base, quote] = symbol.split("/");
    this.base = base;
    this.quote = quote;
  }
}

export class DataBroker {
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
