const code = `
function setup() {
  console.log("windowWidth is", windowWidth);
  console.log("mouseX is", mouseX);
}
`;

function runP5Simulator() {
  const p = { windowWidth: 400, mouseX: 10 };
  
  const userFunction = new Function('p', `
    with (p) {
      ${code}
      return { setup };
    }
  `);
  
  const callbacks = userFunction(p);
  callbacks.setup();
  
  p.windowWidth = 800;
  p.mouseX = 20;
  
  callbacks.setup(); // should reflect new values
}

runP5Simulator();
