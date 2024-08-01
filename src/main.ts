import { fail, r, render, useEffect, useMemo, useRef, useState } from './lib';
import './style.css'



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
