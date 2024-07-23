import './style.css'

// https://github.com/preactjs/preact/blob/f5738915a0d67c87f54f0ccd5b946e7a4ce0d5c1/hooks/src/index.js#L281

interface UninitializedHookState { }

type HookState = ValueHookState<any> | UseStateHookState<any> | UninitializedHookState;
let hookStates: HookState[] = [];

let currentIndex = 0;

interface ValueHookState<T> {
  value: T;
}

interface UseStateHookState<T> {
  value: T;
  setter: ((t: T) => void);
}


function getHookState<T extends HookState>(index: number): T {
  if (hookStates.length <= index) {
    hookStates.push({});
  }
  // This is a bit ugly, but is a convenient way to instantiate empty states.
  return hookStates[index] as T;
}

function useMemo<T>(factory: () => T): T {
  let state = getHookState<ValueHookState<T>>(currentIndex++)
  if (!state.value) {
    state.value = factory();
  }
  return state.value;
}

function useState<T>(initialValue: T): [T, (t: T) => void] {
  let state = getHookState<UseStateHookState<T>>(currentIndex++)
  if (!state.value) {
    state.value = initialValue;
    state.setter = (t: T) => {
      state.value = t;
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
    console.log("Computing value");
    return props.x * props.y;
  });

  //let value = x * y;

  return `
  <p>Component 1: ${props.x} x ${props.y} = ${value}</p>
  `
}

function Counter() {
  let [counter, setCounter] = useState(0);

  let incrementEl = useRef((root: HTMLElement) => {
    console.log(root);
    return root.querySelector(".increment");
  })

  useEffect(() => {
    console.log("current: " + incrementEl.current);
    incrementEl.current?.addEventListener("click", () => {
      setCounter(counter + 1);
    });
  })

  return `
    <div class="increment">Increment</div>
    ${r(Multiplier, { x: counter, y: 2 })}
    ${r(Multiplier, { x: counter, y: 3 })}
`;
}

// Writing a function which takes some params and returns a string.
// I just want to postprocess it's output each time it's called.

let divId = 0;
// let refs = [];
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

function renderRoot<Props>(generator: () => string, props: Props, container: Element) {
  currentIndex = 0;
  divId = 0;
  pendingEffects.length = 0;
  container.innerHTML = r(generator, props);

  for (const effect of pendingEffects) {
    effect.effect(document.getElementById("div" + effect.divId) ?? fail("Missing root"));
  }
}

renderRoot(App, {}, document.querySelector('#app') ?? fail())

document.body.addEventListener("click", () => {
  renderRoot(App, {}, document.querySelector('#app') ?? fail())
})