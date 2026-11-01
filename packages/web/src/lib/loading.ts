import NProgress from "nprogress";

export interface Bar {
  start(): void;
  done(): void;
}

export function createLoading(bar: Bar, delay = 200) {
  let pending = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let shown = false;

  return function begin(): () => void {
    pending++;
    if (pending === 1) {
      timer = setTimeout(() => {
        if (pending > 0) {
          bar.start();
          shown = true;
        }
      }, delay);
    }
    let ended = false;
    return () => {
      if (ended) return;
      ended = true;
      pending--;
      if (pending > 0) return;
      clearTimeout(timer);
      if (shown) {
        bar.done();
        shown = false;
      }
    };
  };
}

NProgress.configure({ showSpinner: false, trickleSpeed: 300, minimum: 0.1 });

export const beginLoading = createLoading(NProgress);
