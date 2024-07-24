import './style.css'

// https://github.com/preactjs/preact/blob/f5738915a0d67c87f54f0ccd5b946e7a4ce0d5c1/hooks/src/index.js#L281

interface UninitializedHookState { }

type HookState = UseMemoHookState<any> | UseStateHookState<any> | UninitializedHookState;
let hookStates: HookState[] = [];

let currentIndex = 0;

interface UseMemoHookState<T> {
  value: T;
  lastArgs: any[];
}

interface UseStateHookState<T> {
  value: T;
  setter: ((f: (x: T) => T) => void);
}


function getHookState<T extends HookState>(): T {
  let index = currentIndex;
  currentIndex++;
  if (hookStates.length <= index) {
    hookStates.push({});
  }
  // This is a bit ugly, but is a convenient way to instantiate empty states.
  return hookStates[index] as T;
}

// Inspired by https://github.com/preactjs/preact/blob/f5738915a0d67c87f54f0ccd5b946e7a4ce0d5c1/hooks/src/index.js#L535
function argsEqual(a: any[] | undefined, b: any[] | undefined): boolean {
  return !(!a || !b ||
    (a.length !== b.length) ||
    a.some((arg, index) => arg !== b[index]));
}

function useMemo<T>(factory: () => T, args: any[]): T {
  let state = getHookState<UseMemoHookState<T>>()

  if (!argsEqual(args, state.lastArgs)) {
    state.value = factory();
    state.lastArgs = args;
  } else {
    console.log("Cached");
  }
  return state.value;
}

let pendingStateUpdates: (() => void)[] = [];

function useState<T>(initialValue: T): [T, ((f: (x: T) => T) => void)] {
  let state = getHookState<UseStateHookState<T>>()
  if (state.value == undefined) {
    state.value = initialValue;
    state.setter = (f: (x: T) => T) => {
      pendingStateUpdates.push(() => {
        state.value = f(state.value);
      })
      requestRerender();
    }
  }
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

interface MultiplierProps {
  x: number,
  y: number
}

function Multiplier(props: MultiplierProps) {
  let value = useMemo(() => {
    console.log("Computing value: " + props.y);
    return props.x * props.y;
  }, [props.x, props.y]);

  //let value = x * y;

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

function App() {
  return `
  <div>
      ${r(Counter, {})}
      ${r(Counter, {})}
  </div>
  `
}

function fail(msg?: string): never {
  throw (msg ?? "Failure");
}

interface RootRenderingParams {
  generator: () => string;
  container: Element;
}

let rootRenderingParams: RootRenderingParams | null = null;
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
  currentIndex = 0;
  divId = 0;
  pendingEffects.length = 0;

  rootRenderingParams.container.innerHTML = r(rootRenderingParams.generator, {});

  for (const effect of pendingEffects) {
    effect.effect(document.getElementById("div" + effect.divId) ?? fail("Missing root"));
  }

  for (const stateUpdate of pendingStateUpdates) {
    stateUpdate();
  }

  if (pendingStateUpdates.length > 0) {
    requestRerender();
  }
  pendingStateUpdates = [];
}

// Root render doesn't get any props.
function render(generator: () => string, container: Element) {
  rootRenderingParams = {
    generator,
    container
  };
  rerenderRoot();
}

render(App, document.querySelector('#app') ?? fail())
