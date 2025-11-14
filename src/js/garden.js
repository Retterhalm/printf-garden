document.addEventListener("DOMContentLoaded", () => {
  const gridSize = 10;
  let cells = [];
  let row = 0, col = 0;

  const flowers = ["🌸","🌼","🌻","🌹","🌺","🌷","💐","🌾","🍀","🌵"];
  const trees   = ["🌳","🌴","🌲","🎄","🌱","🌿","🍁"];
  const animalsMap = { cat:"🐱", dog:"🐶", fox:"🦊", bear:"🐻", panda:"🐼", lion:"🦁", tiger:"🐯", rabbit:"🐰", frog:"🐸" };

  const createGrid = () => {
    const table = document.getElementById("grid");
    table.innerHTML = "";
    cells = [];
    row = 0; col = 0;
    for(let r=0;r<gridSize;r++){
      const tr = table.insertRow();
      const rowCells = [];
      for(let c=0;c<gridSize;c++){
        const td = tr.insertCell();
        td.textContent = "";
        rowCells.push(td);
      }
      cells.push(rowCells);
    }
  };

  const clearGrid = () => {
    for(let r=0;r<gridSize;r++)
      for(let c=0;c<gridSize;c++)
        cells[r][c].textContent = "";
    row = 0; col = 0;
  };

  const mapValue = (type, value) => {
    if(type === "%d") return flowers[(parseInt(value)-1) % flowers.length];
    if(type === "%c") return trees[(value.toLowerCase().charCodeAt(0)-97) % trees.length];
    if(type === "%s") return animalsMap[value.toLowerCase()] || "🐾";
  };

  const applyPadding = (emoji, width=0, flag) => {
    let arr = [emoji];
    if(width > 1){
      let pad = Array(width - 1).fill("🟩");
      if(flag === "-") arr.push(...pad);
      else arr.unshift(...pad);
    }
    return arr;
  };

  // parse a single printf format string and arguments
  const parsePrintf = (format, args) => {
    format = format.replace(/\\n/g,"\n").replace(/\\t/g,"\t");
    const regex = /%([-0]?)(\d+)?([dsc])/g;
    let result = [];
    let lastIndex = 0, argIndex = 0, match;
    while((match = regex.exec(format))!==null){
      // add normal characters
      for(const ch of format.slice(lastIndex, match.index)) result.push(ch);
      lastIndex = regex.lastIndex;

      const flag = match[1], width = match[2]?parseInt(match[2]):0, type = match[3];
      const value = args[argIndex++];
      const emoji = mapValue("%"+type, value);
      result.push(...applyPadding(emoji, width, flag));
    }
    // remaining text
    for(const ch of format.slice(lastIndex)) result.push(ch);
    return result;
  };

  // parse argument values (variables or direct literals)
  const getValue = (arg, vars) => {
    arg = arg.trim().replace(/^(int|char|string)\s+/,"");
    if(vars.hasOwnProperty(arg)) return vars[arg];
    if(/^'.'$/.test(arg)) return arg[1];
    if(/^".*"$/.test(arg)) return arg.slice(1,-1);
    if(/^\d+$/.test(arg)) return parseInt(arg);
    return arg;
  };

  // safely print array to grid
  const printArrayToGrid = (arr) => {
  for(const ch of arr){
    if(ch === "\n") { 
      row++; 
      col = 0; 
      if(row >= gridSize) throw new Error("Grid overflow!"); 
      continue; // не вставляем "\n" в сетку
    }
    if(ch === "\t") { 
      col = Math.min(Math.ceil((col+1)/4)*4, gridSize); 
      continue; // не вставляем "\t" в сетку
    }
    if(col >= gridSize) throw new Error("Row overflow!");
    cells[row][col].textContent = ch;
    col++;
  }
};

  const runProgram = () => {
  createGrid();
  const code = document.getElementById("code").value.trim();
  const variables = {};

  // 1. parse variable declarations (with or without initialization)
  const varRegex = /(int|char|string)\s+(\w+)(\s*=\s*(.+?))?;/g;
  let match;
  while((match = varRegex.exec(code)) !== null){
    const type = match[1];
    const name = match[2];
    const valuePart = match[4]; // might be undefined

    if(valuePart !== undefined){
      // declaration with initialization
      const value = getValue(valuePart, variables);
      variables[name] = value;
    } else {
      // declaration without initialization
      variables[name] = undefined;
    }
  }

  // 2. parse standalone assignments like flower = 5;
  const assignRegex = /(\w+)\s*=\s*(.+?);/g;
  while((match = assignRegex.exec(code)) !== null){
    const name = match[1];
    const value = getValue(match[2], variables);

    if(variables.hasOwnProperty(name)){
      variables[name] = value; // update existing variable
    } else {
      throw new Error(`Variable "${name}" is not declared`);
    }
  }

  // 3. parse printf statements
  const printfRegex = /printf\("(.*)"\s*(?:,\s*(.+?))?\);/g;
  try {
    let pfMatch;
    while((pfMatch = printfRegex.exec(code))!==null){
      const fmt = pfMatch[1];
      let args = [];
      if(pfMatch[2]){
        args = pfMatch[2].split(",").map(a=>getValue(a, variables));
      }
      const arr = parsePrintf(fmt, args);
      printArrayToGrid(arr);
    }
  } catch(err){ 
    alert(err.message); 
  }
};

  document.getElementById("runBtn").addEventListener("click", runProgram);
  document.getElementById("clearBtn").addEventListener("click", clearGrid);

  createGrid();
});
