// We can check if the args to useMemo changed, and if they did, recompute.

import './style.css'

function fail(msg?: string): never {
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

let useMemoHookIndex = 0;
function performTopLevelRerender() {
  pendingRerender = false;
  useMemoHookIndex = 0;
  rerenderRoot?.();
}

function render<Props>(generator: (props: Props) => string, props: Props, container: Element) {
  rerenderRoot = () => {
    container.innerHTML = generator(props);
  }
  performTopLevelRerender();
}

// Inspired by https://github.com/preactjs/preact/blob/f5738915a0d67c87f54f0ccd5b946e7a4ce0d5c1/hooks/src/index.js#L535
function argsEqual(a: any[] | undefined, b: any[] | undefined): boolean {
  return !(!a || !b ||
    (a.length !== b.length) ||
    a.some((arg, index) => arg !== b[index]));
}

class UseMemoHookState<T> {
  value: T | null = null;
  lastArgs?: any[];
}

let useMemoHookStates: UseMemoHookState<any>[] = [];

function useMemo<T>(factory: () => T, args: any[]): T {
  let index = useMemoHookIndex++;
  if (useMemoHookStates.length <= index) {
    useMemoHookStates.push({ value: factory() });
  }
  const state = useMemoHookStates[index];
  if (!argsEqual(args, state.lastArgs)) {
    state.value = factory();
    state.lastArgs = args;
  }

  return state.value;
}

interface MultiplierProps {
  x: number,
  y: number
}

function Multiplier(props: MultiplierProps) {
  let value = useMemo(() => {
    console.log("Recomputing value");
    return props.x * props.y;
  }, [props.x, props.y]);
  return `
    <p>${props.x} x ${props.y} = ${value}</p>
    `
}

let xValue = 5;
function App(props: { title: string }) {
  return `
  <div>
      <h1>${props.title}</h1>
      ${Multiplier({ x: xValue, y: 2 })}
      ${Multiplier({ x: xValue, y: 3 })}
  </div>
  `
}

const appProps = {
  title: "Title"
}
render(App, appProps, document.querySelector('#app') ?? fail())

document.addEventListener("click", () => {
  appProps.title = "Title " + Math.random();
  xValue += 1;
  requestRerender();
})
