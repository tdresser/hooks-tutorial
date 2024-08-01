// Rerender manually after a state change.

import './style.css'

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

    rootRenderingParams.container.innerHTML = rootRenderingParams.generator(rootRenderingParams.props);
}

function render<Props>(generator: (props: Props) => string, props: Props, container: Element) {
    rootRenderingParams = {
        generator,
        container,
        props
    };
    rerenderRoot();
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
    console.log(appProps.title);
    requestRerender();
})
