import './style.css'

class HookStates<T> {
  index: number = 0;
  states: T[] = [];

  reset() {
    this.index = 0;
  }
}

function getHookState<T>(hookStates: HookStates<T>, factory: () => T): T {
  let index = hookStates.index;
  hookStates.index++;
  if (hookStates.states.length <= index) {
    hookStates.states.push(factory());
  }
  return hookStates.states[index] as T;
}

// Every time we tick we want to be in a consistent state, so we resolve all of these at once.
let useStateHookStates = new HookStates<UseStateHookState<any>>();

class UseStateHookState<T> {
  value: T;
  setter: ((f: (x: T) => T) => void);

  constructor(value: T, setter: (f: (x: T) => T) => void) {
    this.value = value;
    this.setter = setter;
  }
}

// Inspired by https://github.com/preactjs/preact/blob/f5738915a0d67c87f54f0ccd5b946e7a4ce0d5c1/hooks/src/index.js#L535
function argsEqual(a: any[] | undefined, b: any[] | undefined): boolean {
  return !(!a || !b ||
    (a.length !== b.length) ||
    a.some((arg, index) => arg !== b[index]));
}

class UseMemoHookState<T> {
  value: T | null = null;
  lastArgs: any[] = [];
}

let useMemoHookStates = new HookStates<UseMemoHookState<any>>();

function useMemo<T>(factory: () => T, args: any[]): T {
  let state = getHookState<UseMemoHookState<T>>(useMemoHookStates, () => new UseMemoHookState());

  if (!argsEqual(args, state.lastArgs)) {
    state.value = factory();
    state.lastArgs = args;
  }

  return state.value ?? fail("Missing state value");
}

let pendingStateUpdates: (() => void)[] = [];

function useState<T>(initialValue: T): [T, ((f: (x: T) => T) => void)] {
  let state = getHookState<UseStateHookState<T>>(useStateHookStates, () => new UseStateHookState(initialValue, (f: (x: T) => T) => {
    pendingStateUpdates.push(() => {
      state.value = f(state.value);
    })
    requestRerender();
  }))
  return [state.value, state.setter ?? fail("missing setter")];
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

let divId = 0;
function r<Props>(generator: (props: Props) => string, props: Props) {
  let div = document.createElement("div");
  div.id = "div" + (++divId);
  div.innerHTML = generator(props);
  return div.outerHTML;
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
  window.setTimeout(rerenderRoot, 0);
}

function rerenderRoot() {
  if (!rootRenderingParams) {
    throw ("Missing rootRenderingParams");
  }
  console.log("Render");
  pendingRerender = false;
  useStateHookStates.reset();
  useMemoHookStates.reset();
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
function render<Props>(generator: (props: Props) => string, container: Element, props: Props) {
  rootRenderingParams = {
    generator,
    container,
    props
  };
  rerenderRoot();
}

render(App, document.querySelector('#app') ?? fail(), { title: "Title" })
