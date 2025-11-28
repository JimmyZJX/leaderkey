import { RipGrepSearchMode } from "./rg";
import { Query, RgMatchState } from "./rgPanel";

type LastQuery =
  | (Query & {
      matchState: RgMatchState | undefined;
    })
  | undefined;

let lastQuery: LastQuery = undefined;

export function getSearchMode(): RipGrepSearchMode {
  if (lastQuery) {
    return { case: lastQuery.case, regex: lastQuery.regex, word: lastQuery.word };
  }
  return { case: "smart", regex: "on", word: "off" };
}

class QueryStringHistory {
  history: string[] = [];
  index: number = 0;
  current: string | undefined = undefined;

  #pushCurrent() {
    if (this.current) {
      this.history.push(this.current);
      this.current = undefined;
      this.index = this.history.length - 1;
    } else if (this.current === "") {
      this.current = undefined;
      this.index = this.history.length;
    }
  }

  quit() {
    this.#pushCurrent();
  }

  up(): string {
    this.#pushCurrent();
    if (this.index - 1 >= 0) {
      this.index--;
    }
    return this.history[this.index];
  }

  down(): string {
    this.#pushCurrent();
    if (this.index + 1 < this.history.length) {
      this.index++;
      return this.history[this.index];
    } else {
      this.index = this.history.length;
      this.current = "";
      return "";
    }
  }

  onChange(q: string) {
    if (this.history[this.index] === q) return;
    this.current = q;
  }
}

const history: QueryStringHistory = new QueryStringHistory();

export function onHistoryUp() {
  return history.up();
}
export function onHistoryDown() {
  return history.down();
}
export function onQuit() {
  history.quit();
}
export function onQueryChange(q: Query) {
  history.onChange(q.query);
  if (q.query) {
    lastQuery = { ...q, matchState: undefined };
  }
}
export function onQueryDone(q: Query, match: RgMatchState) {
  history.onChange(q.query);
  if (q.query) {
    lastQuery = { ...q, matchState: match };
  }
}
export function getLast() {
  return lastQuery;
}
