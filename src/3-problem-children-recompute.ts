// Add a couple child components.
// They're redoing all of their work (multiplying) every rerender.

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

function performTopLevelRerender() {
  pendingRerender = false;
  rerenderRoot?.();
}

function render<Props>(generator: (props: Props) => string, props: Props, container: Element) {
  rerenderRoot = () => {
    container.innerHTML = generator(props);
  }
  performTopLevelRerender();
}

interface MultiplierProps {
  x: number,
  y: number
}

function Multiplier(props: MultiplierProps) {
  console.log("Recomputing value");
  let value = props.x * props.y;
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
