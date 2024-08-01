// Rerender manually after a state change.

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

function App(props: { title: string }) {
  return `
  <div>
      <h1>${props.title}</h1>
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
