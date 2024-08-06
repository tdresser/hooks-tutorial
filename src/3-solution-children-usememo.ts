// Let's make the child component not redo computation all the time!

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


interface UseMemoHookState<T> {
  value: T;
}

let useMemoHookStates: UseMemoHookState<any>[] = [];

export function useMemo<T>(factory: () => T): T {
  let index = useMemoHookIndex++;
  if (useMemoHookStates.length <= index) {
    useMemoHookStates.push({ value: factory() });
  }
  const state = useMemoHookStates[index];
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
  });
  return `
    <p>${props.x} x ${props.y} = ${value}</p>
    `
}

function App(props: { title: string }) {
  return `
  <div>
      <h1>${props.title}</h1>
      ${Multiplier({ x: 5, y: 2 })}
      ${Multiplier({ x: 5, y: 3 })}
  </div>
  `
}

const appProps = {
  title: "Title"
}
render(App, appProps, document.querySelector('#app') ?? fail())

document.addEventListener("click", () => {
  appProps.title = "Title " + Math.random();
  requestRerender();
})
