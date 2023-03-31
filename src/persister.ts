import fs from "fs";

export class JSONFilePersister<T> {
  private file_path: string;
  private persist_queue: [string, T][] = [];

  constructor(
    private _symbol: string,
    private _exchange_id: string,
    private _name: string
  ) {
    this.file_path = `data/${this._name}_${this._exchange_id}_${this._symbol
      .split("/")
      .join("_")}.json`;
    setInterval(this.writeToFile.bind(this), 5000); // write to file every 5 seconds
  }

  public persist(ts: string, data: T) {
    this.persist_queue.push([ts, data]);
  }

  private getCurrentFile() {
    try {
      if (fs.existsSync(this.file_path)) {
        //file exists
        return JSON.parse(fs.readFileSync(this.file_path).toString());
      }
      return {};
    } catch (err) {
      return {};
    }
  }

  private writeToFile() {
    const reduced = this.persist_queue.reduce(
      (acc: Record<string, T[]>, curr) => {
        if (acc[curr[0]]) {
          acc[curr[0]] = [...acc[curr[0]], curr[1]];
        } else {
          acc[curr[0]] = [curr[1]];
        }
        return acc;
      },
      {}
    );

    const current: Record<string, T[]> = this.getCurrentFile();

    // combine with current file
    const combined = [
      ...Object.entries(reduced),
      ...Object.entries(current),
    ].reduce((acc: Record<string, T[]>, curr: [string, T[]]) => {
      if (acc[curr[0]]) {
        acc[curr[0]] = [...acc[curr[0]], ...curr[1]];
      } else {
        acc[curr[0]] = [...curr[1]];
      }
      return acc;
    }, {});

    fs.writeFileSync(this.file_path, JSON.stringify(combined));
  }
}
