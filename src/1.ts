import './style.css'

function fail(msg?: string): never {
  throw (msg ?? "Failure");
}

function render<Props>(generator: (props: Props) => string, props: Props, container: Element) {
  container.innerHTML = generator(props);
}

function App(props: { title: string }) {
  return `
  <div>
      <h1>${props.title}</h1>
  </div>
  `
}

render(App, { title: "Title" }, document.querySelector('#app') ?? fail(),)
