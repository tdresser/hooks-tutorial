import './style.css'

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

let useMemoHookIndex = 0;
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

// Every render runs on a single state which is unmodified for the duration of the render.
// We cache all pending state updates here.
let pendingStateUpdates: (() => void)[] = [];

function useState<T>(initialValue: T): [T, ((f: (x: T) => T) => void)] {
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
function useEffect(f: (root: HTMLElement) => void) {
  pendingEffects.push(new PendingEffect(divId, f));
}

class Ref {
  current: HTMLElement | null = null;
}

function useRef(f: (root: HTMLElement) => HTMLElement | null) {
  const ref = new Ref();
  useEffect((root) => {
    ref.current = f(root);
  })
  return ref;
}

let divId = 0;
function r<Props>(generator: (props: Props) => string, props: Props) {
  let div = document.createElement("div");
  div.id = "div" + (++divId);
  div.innerHTML = generator(props);
  return div.outerHTML;
}


function fail(msg?: string): never {
  throw (msg ?? "Failure");
}

interface RootRenderingParams<T> {
  generator: (props: T) => string;
  container: Element;
  props: T;
}

let rootRenderingParams: RootRenderingParams<any> | null = null;
let pendingRerender: boolean = false;

function requestRerender() {
  if (pendingRerender) {
    return;
  }
  pendingRerender = true;
  window.requestAnimationFrame(rerenderRoot);
}

function rerenderRoot() {
  if (!rootRenderingParams) {
    throw ("Missing rootRenderingParams");
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

  rootRenderingParams.container.innerHTML = r(rootRenderingParams.generator, rootRenderingParams.props);

  for (const effect of pendingEffects) {
    effect.effect(document.getElementById("div" + effect.divId) ?? fail("Missing root"));
  }
}

// Root render doesn't get any props.
function render<Props>(generator: (props: Props) => string, props: Props, container: Element) {
  rootRenderingParams = {
    generator,
    container,
    props
  };
  rerenderRoot();
}


interface MultiplierProps {
  x: number,
  y: number
}

function Multiplier(props: MultiplierProps) {
  let value = useMemo(() => {
    console.log("Computing value: " + props.y);
    return props.x * props.y;
  }, [props.x, props.y]);

  return `
  <p>${props.x} x ${props.y} = ${value}</p>
  `
}

function Counter() {
  let [counter, setCounter] = useState(0);

  let incrementEl = useRef((root: HTMLElement) => {
    return root.querySelector(".increment");
  })

  useEffect(() => {
    incrementEl.current?.addEventListener("click", () => {
      console.log("CLICK");
      setCounter((counter) => {
        console.log("Setting counter to " + (counter + 1))
        return counter + 1
      });
    });
  })

  return `
    <div class="increment">Increment</div>
    ${r(Multiplier, { x: counter, y: 2 })}
    ${r(Multiplier, { x: counter, y: 3 })}
`;
}

function App(props: { title: string }) {
  return `
  <h1>${props.title}</h1>
  <div>
      ${r(Counter, {})}
      ${r(Counter, {})}
  </div>
  `
}
render(App, { title: "Title" }, document.querySelector('#app') ?? fail())
