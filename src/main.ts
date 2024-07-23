import './style.css'

// Why do hooks use indices instead of closures?

let hookStates: any[] = [];

let currentIndex = 0;

function getHookState(index: number) {
  if (hookStates.length <= index) {
    hookStates.push({});
  }
  return hookStates[index];
}

function useMemo<T>(factory: () => T) {
  let state = getHookState(currentIndex++)
  console.log(state);
  if (!state["value"]) {
    state.value = factory();
  }
  return state.value;
}

function Multiplier(x: number, y: number) {
  let value = useMemo(() => {
    console.log("Computing value");
    return x * y;
  });

  //let value = x * y;

  return `
  <p>Component 1: ${x} x ${y} = ${value}</p>
  `
}

function App() {
  return `
  <div>
    ${Multiplier(3, 2)}
    ${Multiplier(4, 2)}
  </div>
`
}

function fail(msg?: string): never {
  throw (msg ?? "Failure");
}

function renderRoot(generator: () => string, container: Element) {
  currentIndex = 0;
  container.innerHTML = generator();
}

renderRoot(App, document.querySelector('#app') ?? fail())

document.body.addEventListener("click", () => {
  renderRoot(App, document.querySelector('#app') ?? fail())
})