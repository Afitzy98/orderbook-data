import fs from "fs";

export class CSVFilePersister<T> {
  private file_path: string;
  private persist_queue: T[] = [];

  constructor(
    private _symbol: string,
    private _exchange_id: string,
    private _name: string,
    private converter: (v: T) => string
  ) {
    this.file_path = `data/${this._name}_${this._exchange_id}_${this._symbol
      .split("/")
      .join("_")}.csv`;
    setInterval(this.writeToFile.bind(this), 5000); // write to file every 5 seconds
  }

  public persist(data: T) {
    this.persist_queue.push(data);
  }

  private writeToFile() {
    const data = this.persist_queue.map((v) => this.converter(v)).join("\r\n");
    fs.appendFileSync(this.file_path, data + "\r\n");
    this.persist_queue = [];
  }
}
