import { readDirFilesAndDirs } from "../common/remote";
import { stripSlash } from "../common/stripSlash";
import { byLengthAsc, byStartAsc, Fzf } from "../fzf-for-js/src/lib/main";
import { FzfResultItem } from "../fzf-for-js/src/lib/types";
import { FzfGetResponse, FzfProcess } from "./fzfProcess";

type FindFileItems<T> = {
  items: T[];
  render: (item: T) => FzfResultItem<string>;
  filtered: number;
  total: number;
};

export type FindFileData =
  | ({ mode: "ls" } & FindFileItems<FzfResultItem<string>>)
  | ({ mode: "fzf"; reading: boolean } & FindFileItems<string>);

export function getFileFromDataIdx(data: FindFileData, idx: number) {
  if (data.mode === "ls") {
    return data.items[idx].item;
  } else if (data.mode === "fzf") {
    return data.items[idx];
  }
  const _: never = data;
  throw new Error(`Invalid FindFileData: ${JSON.stringify(data)}`);
}

async function ls(dir: string, dirOnly: boolean) {
  const filesAndDirs = await readDirFilesAndDirs(dir);
  let dirs = filesAndDirs.dirs;
  const dotAndDotDot = ["./", ...(dir.length > 1 ? ["../"] : [])];
  dirs = [...dotAndDotDot, ...dirs.map((dir) => dir + "/")];
  if (dirOnly) return dirs;
  return [...dirs, ...filesAndDirs.files];
}

export function dummyFzfResultItem(item: string): FzfResultItem {
  return {
    item,
    positions: new Set(),
    start: 0,
    end: 0,
    score: 0,
  };
}

export class FindFileDataProvider {
  private cwd: string;
  private curResults: FindFileData | undefined = undefined;
  private onResults: (r: FindFileData | undefined) => void;

  private lsPromise: Promise<void>;
  private lsResult: string[] | undefined = undefined;
  private fzf: FzfProcess | undefined = undefined;

  private mode: "ls-dir-only" | "ls-and-fzf";

  private firstResult: Promise<FindFileData>;
  private setFirstResult!: (data: FindFileData) => void;

  constructor(
    cwd: string,
    mode: "ls-dir-only" | "ls-and-fzf",
    onResults: (r: FindFileData | undefined) => void,
  ) {
    this.cwd = cwd;
    this.mode = mode;
    this.onResults = onResults;

    this.firstResult = new Promise((set) => (this.setFirstResult = set));

    this.lsPromise = (async () => {
      this.lsResult = await ls(cwd, mode === "ls-dir-only");
      return this.lsResult;
    })().then(() => {});

    this.query = undefined!;
    this.setQuery("");
  }

  private query: string;

  public async setQuery(query: string) {
    this.query = query;
    if (this.mode === "ls-and-fzf" && query.includes(" ")) {
      // fzf mode
      if (this.fzf === undefined) {
        this.fzf = new FzfProcess(this.cwd, query, (r) => this.onFzfResult(r));
      }
      this.fzf.setQuery(query);
    } else {
      // ls mode
      if (this.lsResult === undefined) {
        await this.lsPromise;
        if (this.query !== query) return;
      }
      this.filterLsResults();
    }
  }

  private setResults(results: FindFileData) {
    if (this.curResults === undefined) this.setFirstResult(results);
    this.curResults = results;
    this.onResults(this.curResults);
  }

  public getCurResults() {
    return this.curResults;
  }

  public async waitOne() {
    if (this.curResults) return this.curResults;
    return await this.firstResult;
  }

  private onFzfResult(r: FzfGetResponse) {
    if (this.query === undefined || this.query !== this.fzf?.getQuery()) return;
    const queries = this.query.split(" ").filter((q) => q.length > 0);
    const render = (item: string): FzfResultItem<string> => {
      const fzf = new Fzf([item]);
      const positionss = queries.map((query) => fzf.find(query)[0]?.positions ?? []);
      const positions = new Set(positionss.flatMap((p) => [...p]));
      return { item, positions, start: 0, end: 0, score: 0 };
    };
    this.setResults({
      mode: "fzf",
      reading: r.reading,
      items: r.matches.map((m) => m.text),
      render,
      filtered: r.matchCount,
      total: r.totalCount,
    });
  }

  private filterLsResults() {
    if (this.lsResult === undefined || this.query === undefined) {
      // unexpected, but silently ignore
      return;
    }
    let results: FzfResultItem<string>[];
    if (this.query === "") {
      results = this.lsResult.map(dummyFzfResultItem);
    } else {
      const dirs = new Set(this.lsResult.filter((f) => f.endsWith("/")).map(stripSlash));
      results = new Fzf(this.lsResult.map(stripSlash), {
        tiebreakers: [byStartAsc, byLengthAsc],
      })
        .find(this.query)
        .map((r) => (dirs.has(r.item) ? { ...r, item: r.item + "/" } : r));
    }
    this.setResults({
      mode: "ls",
      items: results,
      render: (item: FzfResultItem<string>) => item,
      filtered: results.length,
      total: this.lsResult.length,
    });
  }

  public quit() {
    this.fzf?.quit();
  }
}
