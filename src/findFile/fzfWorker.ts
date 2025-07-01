import { Fzf } from "../fzf-for-js/src/lib/main";
import { extendedMatch } from "../fzf-for-js/src/lib/matchers";
import { FzfResultItem, Selector } from "../fzf-for-js/src/lib/types";

export type FzfWorkerInput =
  | { type: "init"; query: string }
  | { type: "items"; items: string[] }
  | { type: "query"; query: string };

export type FzfWorkerOutput = {
  result: FzfResultItem<string>[];
  total: number;
};

let current: { query: string; items: string[] } = { query: "", items: [] };

function byTrimmedLengthAsc(
  a: FzfResultItem<string>,
  b: FzfResultItem<string>,
  selector: Selector<string>,
) {
  return selector(a.item).trim().length - selector(b.item).trim().length;
}

let busy = false;
let again = false;
function doQuery() {
  if (busy) {
    again = true;
  } else {
    busy = true;
    setTimeout(() => {
      while (true) {
        const fzf = new Fzf(current.items, {
          limit: 999,
          match: extendedMatch,
          tiebreakers: [byTrimmedLengthAsc],
        });
        const result = fzf.find(current.query);
        const total = current.items.length;
        output({ result, total });
        if (again) {
          again = false;
        } else {
          break;
        }
      }
      busy = false;
    }, 100);
  }
}

function output(output: FzfWorkerOutput) {
  console.warn(`Fzf worker: output total=${output.total}`);
  postMessage(output);
}

self.onmessage = ({ data: input }: { data: FzfWorkerInput }) => {
  console.warn(`Fzf worker: got input ${input.type}`);
  if (input.type === "init") {
    current = { query: input.query, items: [] };
    again = false;
  } else if (input.type === "items") {
    current.items.push(...input.items);
  } else if (input.type === "query") {
    current.query = input.query;
  }

  doQuery();
};
