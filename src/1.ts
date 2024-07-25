import './style.css'

function fail(msg?: string): never {
  throw (msg ?? "Failure");
}

function App() {
  return `
  <div>
      <h1>Hello</h1>
  </div>
  `
}

// Root render doesn't get any props.
function render(generator: () => string, container: Element) {
  container.innerHTML = generator();
}

render(App, document.querySelector('#app') ?? fail())
