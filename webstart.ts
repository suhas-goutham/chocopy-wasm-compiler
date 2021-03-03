import {BasicREPL} from './repl';
import { Type, Value } from './ast';
import { defaultTypeEnv } from './type-check';
import { NUM, BOOL, NONE, STRING } from './utils';
import { memory } from 'console';

var mem_js: { memory: any; };

function stringify(typ: Type, arg: any) : string {
  switch(typ.tag) {
    case "number":
      return (arg as number).toString();
    case "string":
      const view = new Int32Array(mem_js.memory.buffer);
      let ascii_val = view[arg/4];
      var i=1;
      var full_string = "";
      while(ascii_val!=0){
        var char = String.fromCharCode(ascii_val);
        full_string += char;
        ascii_val = view[(arg/4)+i];
        i+=1;
      }
      console.log("Full "+full_string);
      // return full_string;
      const view1 = new Int32Array(mem_js.memory.buffer);
      var i=0;
      while(i<10){
        console.log("View "+i*4+" Value "+view1[i]);
        i+=1;
      }
      return full_string;
    case "bool":
      return (arg as boolean)? "True" : "False";
    case "none":
      return "None";
    case "class":
      return typ.name;
  }
}

function print(typ: Type, arg : number) : any {
  console.log("Logging from WASM: ", arg);
  const elt = document.createElement("pre");
  document.getElementById("output").appendChild(elt);
  elt.innerText = stringify(typ, arg);
  return arg;
}

function webStart() {
  document.addEventListener("DOMContentLoaded", function() {
    // if(!mem_js.memory){
      const memory = new WebAssembly.Memory({initial:2000, maximum:2000});
      const view = new Int32Array(memory.buffer);
      view[0] = 4;
      var memory_js = { memory: memory };
    // }
    var importObject = {
      imports: {
        print_num: (arg: number) => print(NUM, arg),
        print_str: (arg: number) => print(STRING, arg),
        print_bool: (arg: number) => print(BOOL, arg),
        print_none: (arg: number) => print(NONE, arg),
        abs: Math.abs,
        min: Math.min,
        max: Math.max,
        pow: Math.pow
      },
      js:memory_js
    };

    mem_js = importObject.js;
    var repl = new BasicREPL(importObject);

    function renderResult(result : Value) : void {
      if(result === undefined) { console.log("skip"); return; }
      if (result.tag === "none") return;
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);
      switch (result.tag) {
        case "num":
          elt.innerText = String(result.value);
          break;
        case "bool":
          elt.innerHTML = (result.value) ? "True" : "False";
          break;
        case "object":
          if(result.name=="String"){
            elt.innerText = stringify(STRING, result.address);
          }
          else{
          // elt.innerHTML = `<${result.name} object at ${result.address}`
            elt.innerText = `<${result.name} object at ${result.address}`
          }
          break
        default: throw new Error(`Could not render value: ${result}`);
      }
    }

    function renderError(result : any) : void {
      const elt = document.createElement("pre");
      document.getElementById("output").appendChild(elt);
      elt.setAttribute("style", "color: red");
      elt.innerText = String(result);
    }

    function setupRepl() {
      document.getElementById("output").innerHTML = "";
      const replCodeElement = document.getElementById("next-code") as HTMLTextAreaElement;
      replCodeElement.addEventListener("keypress", (e) => {

        if(e.shiftKey && e.key === "Enter") {
        } else if (e.key === "Enter") {
          e.preventDefault();
          const output = document.createElement("div");
          const prompt = document.createElement("span");
          prompt.innerText = "»";
          output.appendChild(prompt);
          const elt = document.createElement("textarea");
          // elt.type = "text";
          elt.disabled = true;
          elt.className = "repl-code";
          output.appendChild(elt);
          document.getElementById("output").appendChild(output);
          const source = replCodeElement.value;
          elt.value = source;
          replCodeElement.value = "";
          repl.run(source).then((r) => { renderResult(r); console.log ("run finished") })
              .catch((e) => { renderError(e); console.log("run failed", e) });;
        }
      });
    }

    function resetRepl() {
      document.getElementById("output").innerHTML = "";
    }

    document.getElementById("run").addEventListener("click", function(e) {
      repl = new BasicREPL(importObject);
      const source = document.getElementById("user-code") as HTMLTextAreaElement;
      resetRepl();
      repl.run(source.value).then((r) => { renderResult(r); console.log ("run finished") })
          .catch((e) => { renderError(e); console.log("run failed", e) });;
    });
    setupRepl();
  });
}

webStart();
