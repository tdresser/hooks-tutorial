
// Inspired by https://github.com/preactjs/preact/blob/f5738915a0d67c87f54f0ccd5b946e7a4ce0d5c1/hooks/src/index.js#L535
function argsEqual(a: any[] | undefined, b: any[] | undefined): boolean {
  return !(
    !a || !b ||
    (a.length !== b.length) ||
    a.some((arg, index) => arg !== b[index])
  );
}

interface UseMemoHookState<T> {
  value: T;
  lastArgs: any[];
}

let useMemoHookIndex = 0;
let useMemoHookStates: UseMemoHookState<any>[] = [];

export function useMemo<T>(factory: () => T, args: any[]): T {
  let index = useMemoHookIndex++;
  if (useMemoHookStates.length <= index) {
    useMemoHookStates.push({
      value: factory(),
      lastArgs: args,
    });
  }
  const state = useMemoHookStates[index];
  if (!argsEqual(args, state.lastArgs)) {
    state.value = factory();
    state.lastArgs = args;
  }

  return state.value;
}

// Every render runs on a single state which is unmodified for the duration of the render.
// We cache all pending state updates here.
let pendingStateUpdates: (() => void)[] = [];

export function useState<T>(initialValue: T): [T, ((f: (x: T) => T) => void)] {
  let state = useMemo(() => {
    return {
      value: initialValue,
      setter: (f: (x: T) => T) => {
        pendingStateUpdates.push(() => {
          state.value = f(state.value);
        })
        requestRerender();
      }
    }
  }, [])

  return [state.value, state.setter];
}

class PendingEffect {
  divId: number;
  effect: (root: HTMLElement) => void;
  constructor(divId: number, effect: (root: HTMLElement) => void) {
    this.divId = divId;
    this.effect = effect;
  }
}

let pendingEffects: PendingEffect[] = [];
export function useEffect(f: (root: HTMLElement) => void) {
  pendingEffects.push(new PendingEffect(divId, f));
}

export class Ref {
  current: HTMLElement | null = null;
}

export function useRef(f: (root: HTMLElement) => HTMLElement | null) {
  const ref = new Ref();
  useEffect((root) => {
    ref.current = f(root);
  })
  return ref;
}

// TODO, try to replace the below with:
function el(innerHTML: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = innerHTML;
  if (el.children.length != 1) {
    throw ("innerHTML passed to el must have a single element");
  }
  return el.children.item(0) as HTMLElement;
}

let divId = 0;
export function r(generator: () => string) {
  return `
  <div id=div${++divId} style="display: contents">
    ${generator()}
  </div>
  `;
}


export function fail(msg?: string): never {
  throw (msg ?? "Failure");
}

let rerenderRoot: (() => void) | null = null;
let pendingRerender: boolean = false;

function requestRerender() {
  if (pendingRerender) {
    return;
  }
  pendingRerender = true;
  window.requestAnimationFrame(performTopLevelRerender);
}

function performTopLevelRerender() {
  if (!rerenderRoot) {
    throw ("Missing rerenderRoot");
  }
  console.log("Render");
  pendingRerender = false;
  useMemoHookIndex = 0;
  divId = 0;
  pendingEffects = [];

  for (const stateUpdate of pendingStateUpdates) {
    stateUpdate();
  }

  pendingStateUpdates = [];
  rerenderRoot();

  for (const effect of pendingEffects) {
    effect.effect(document.getElementById("div" + effect.divId) ?? fail("Missing root"));
  }
}

export function render<Props>(generator: (props: Props) => string, props: Props, container: Element) {
  rerenderRoot = () => {
    container.innerHTML = generator(props);
  }
  performTopLevelRerender();
}