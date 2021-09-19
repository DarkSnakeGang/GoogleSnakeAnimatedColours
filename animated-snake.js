/*initiate some globals*/
let animateSnakeGlobals = {
  startPlayback: false,
  startingTime: 0,
  framesPerSecond: 60,
  frameDoneSoFar: 0,
  currentColourArray: ["#FFFFFF","#000000"],
  cacheMode: false,
  cache: [],
};

window.snake.animate = function(pattern, backgroundPattern){
  /*pattern is a string which contains the name of a function that takes a frame number (60fps) and returns an array with all the hex colours along the snake's body*/
  if(pattern === undefined) {
    pattern = "defaultPattern";
  }

  /*Can we cache the images for snake's head?*/
  animateSnakeGlobals.cacheMode = ["temporalRainbow", "rollingRainbow", "rollingRainbowRev"].includes(pattern);
  if(pattern.startsWith('singleColourFunctionCreator')) {
    animateSnakeGlobals.cacheMode = true;
  }

  const scripts = document.body.getElementsByTagName('script');
    for(let script of scripts) {
      const req = new XMLHttpRequest();
      req.open('GET', script.src);
      req.onload = function() {
        if(this.responseText.indexOf('"#A2') !== -1)
          processCode(this.responseText, pattern, backgroundPattern);
      };
      req.send();
    }
};

function processCode(code, pattern, backgroundPattern) {
  /*find the name of the variable representing how many turns the snake has been alive for*/
  let lifetime = "a.ticks";
  console.log(lifetime);

  /*find names of variables with snake eyes/tongue etc*/

  let [, headColour, blinkImg, eatImg, dieImg] = code.match(/([$a-zA-Z0-9_]{0,6})=b\[0\],\n?this\.[$a-zA-Z0-9_]{0,6}=b\[1\],\n?[$a-zA-Z0-9_]{0,6}\(this\.([$a-zA-Z0-9_]{0,6}),"#5282F2",this\.[$a-zA-Z0-9_]{0,6}\),\n?[$a-zA-Z0-9_]{0,6}\(this\.([$a-zA-Z0-9_]{0,6}),"#5282F2",this\.[$a-zA-Z0-9_]{0,6}\),\n?[$a-zA-Z0-9_]{0,6}\(this.([$a-zA-Z0-9_]{0,6}),"#5282F2",this.[$a-zA-Z0-9_]{0,6}\)/);
  let [, colourChangeFunc, snakeTongue, func2, func3] = code.match(/([$a-zA-Z0-9_]{0,6})\(this\.([$a-zA-Z0-9_]{0,6}),"#C73104",([$a-zA-Z0-9_]{0,6})\(([$a-zA-Z0-9_]{0,6})\(/);
  let hueFunc = code.match(/([$a-zA-Z0-9_]{0,6})\("#C73104"\)\,[$a-zA-Z0-9_]{0,6}\[0\]=\([$a-zA-Z0-9_]{0,6}\[0\]\+180/)[1];

  console.log(`${headColour},${blinkImg},${eatImg},${dieImg},${colourChangeFunc},${snakeTongue}`);
  /*grab code for the function we need to hijack*/
  let snakeColourFunction = findFunctionInCode(code,
    /[$a-zA-Z0-9_]{0,6}=function\(a,b,c,d,e\)$/,
    /a\.[$a-zA-Z0-9_]{0,6}&&10!==a\.[$a-zA-Z0-9_]{0,6}/,
    true);
  
  let updateHeadCode = `function updateHeadColour(a, headColour) {
    a.${headColour} = headColour;
    ${colourChangeFunc}(a.${blinkImg}, "#5282F2", headColour);/*Set blink image colours*/
    ${colourChangeFunc}(a.${eatImg}, "#5282F2", headColour);/*Set Eat image colours*/
    ${colourChangeFunc}(a.${dieImg}, "#5282F2", headColour);/*Set Die image colours*/
    var hue = ${hueFunc}(headColour);
    var b = ${hueFunc}("#C73104");
    b[0] = (hue[0] + 180) % 360;
    ${colourChangeFunc}(a.${snakeTongue}, "#C73104", ${func2}(${func3}(b[0], b[1], b[2])))/*Hue rotate to get tongue colour*/
  }`;

  eval(updateHeadCode);
  
  /*need to change a bit of code so that the head can change colour even for the rainbow snake*/
  let regex1 = /0===this\.[$a-zA-Z0-9_]{0,6}\|\|10===this\.[$a-zA-Z0-9_]{0,6}/;
  let func1 = findFunctionInCode(code,/[$a-zA-Z0-9_]{0,6}\.prototype\.[$a-zA-Z0-9_]{0,6}=function\(\)$/,regex1,true);
  func1 = func1.replace(/\|\|10===this\.[$a-zA-Z0-9_]{0,6}/,"|| false");
  eval(func1);

  /* Enable caching */
  setupCaching(code);

  /* Background colour stuff */
  let [,rectangle,miniCanvas,tileLength] = code.match(/([$a-zA-Z0-9_]{0,6})\.height;d\+\+\)0!==\n?\(c\+d\)%2&&\(a\.([$a-zA-Z0-9_]{0,6})\.fillStyle="#A2D149",a\.[$a-zA-Z0-9_]{0,6}\.fillRect\(c\*a\.([$a-zA-Z0-9_]{0,6})/);

  let updateBackgroundFunc = `function updateBackground(a, frameNum) {
    for (c = 0; c < a.${rectangle}.width; c++) {
      for (d = 0; d < a.${rectangle}.height; d++) {
        a.${miniCanvas}.fillStyle = ${backgroundPattern}(a, frameNum, c, d);
        a.${miniCanvas}.fillRect(c * a.${tileLength}, d * a.${tileLength}, a.${tileLength}, a.${tileLength});
      }
    }
  }`;
  console.log(updateBackgroundFunc);
  (backgroundPattern !== undefined) ? eval(updateBackgroundFunc):eval("function updateBackground(){return;}");

  /* Use a safer shadow colour */
  eval(
    code.match(
      /[a-zA-Z0-9_$]{1,6}=function\(a\){a\.[a-zA-Z0-9_$]{1,6}\.globalCompositeOperation[^}]*"source-over"}/
    )[0].replace(
      /#94BD46/g,
      "#555555"
    )
  );

  let resetAnimationCode = `if(${lifetime} == 0) {
    animateSnakeGlobals.startPlayback = true;
    animateSnakeGlobals.startingTime = performance.now();
  }`;

  snakeColourFunction = snakeColourFunction.replace("{", "{" + resetAnimationCode);

  /*$& has a special meaning in replace()*/
  let hijackArrayCode = `if(animateSnakeGlobals.startPlayback) {
    var frameNum = Math.floor((performance.now() + ${0.5*1000/animateSnakeGlobals.framesPerSecond}
     - animateSnakeGlobals.startingTime)/${1000/animateSnakeGlobals.framesPerSecond});
    
    if(frameNum !== animateSnakeGlobals.frameDoneSoFar) {
      animateSnakeGlobals.currentColourArray = ${pattern}(frameNum);
      animateSnakeGlobals.frameDoneSoFar = frameNum;

      updateHeadColour(a, animateSnakeGlobals.currentColourArray[0]);
      updateBackground(a, frameNum);
    }
    var f = animateSnakeGlobals.currentColourArray;
    
  }
  else {
    $&
  }`;
  snakeColourFunction = snakeColourFunction.replace(/var f=e\?[$a-zA-Z0-9_]{0,6}:[$a-zA-Z0-9_]{0,6};/, hijackArrayCode);
  
  console.log(snakeColourFunction);
  eval(snakeColourFunction);
}

function setupCaching(code) {
  let recolourImageFunction = findFunctionInCode(code,
    /[$a-zA-Z0-9_]{0,6}=function\(a,b,\n?c\)$/,
    /putImageData/,
    true);
  let canvasContext = recolourImageFunction.match(/a\.([$a-zA-Z0-9_]{0,6})\.putImageData/)[1];

  recolourImageFunction = recolourImageFunction.replace(/a\.([$a-zA-Z0-9_]{0,6})\.putImageData\(([$a-zA-Z0-9_]{0,6}),0,0\)/,
  `if(animateSnakeGlobals.cacheMode) animateSnakeGlobals.cache[a.path + hex] = d;
    a.$1.putImageData($2, 0, 0);
  }`);
  
  /*Order is important, as the previous bit needs to match on the correct putImageData*/
  recolourImageFunction = recolourImageFunction.replace("if(a.loaded){",
  `var hex = c;
  if(a.loaded){
    if(animateSnakeGlobals.cacheMode && (a.path + hex) in animateSnakeGlobals.cache) {
      a.${canvasContext}.putImageData(animateSnakeGlobals.cache[a.path + hex], 0, 0)
    }
    else {`);
  console.log(recolourImageFunction);
  eval(recolourImageFunction);
}

/*
This function will search for a function/method in some code and return this function as a string

code will usually be the snake source code

functionSignature will be regex matching the beginning of the function/method (must end in $),
for example if we are trying to find a function like s_xD = function(a, b, c, d, e) {......}
then put functionSignature = /[$a-zA-Z0-9_]{0,6}=function(a,b,c,d,e)$/

somethingInsideFunction will be regex matching something in the function
for example if we are trying to find a function like s_xD = function(a, b, c, d, e) {...a.Xa&&10!==a.Qb...}
then put somethingInsideFunction = /a\.[$a-zA-Z0-9_]{0,6}&&10!==a\.[$a-zA-Z0-9_]{0,6}/

levelsToGoUp tells us how many "layers" of curly brackets we need to go up before we get to our function

*/
function findFunctionInCode(code, functionSignature, somethingInsideFunction, logging = false) {
  /*Check functionSignature ends in $*/
  if(functionSignature.toString()[functionSignature.toString().length-2] !== "$") {
    throw new Error("functionSignature regex should end in $");
  }

  /*get the position of somethingInsideFunction*/
  let indexWithinFunction = code.search(somethingInsideFunction);
  if(indexWithinFunction == -1) {
    throw new Error("couldn't find a match for somethingInsideFunction");
  }

  /*expand outwards from somethingInsideFunction until we get to the function signature, then count brackets
  to find the end of the function*/
  startIndex = 0;
  for(let i = indexWithinFunction; i >= 0; i--) {
    let startOfCode = code.substring(0,i);
    startIndex = startOfCode.search(functionSignature);
    if(startIndex !== -1) {
      break;
    }
    if(i == 0) {
      throw new Error("Couldn't find function signature");
    }
  }

  let bracketCount = 0;
  let foundFirstBracket = false;
  let endIndex = 0;
  /*Use bracket counting to find the whole function*/
  let codeLength = code.length;
  for(let i = startIndex; i<=codeLength; i++){
    if(!foundFirstBracket && code[i] == "{") {
      foundFirstBracket = true;
    }

    if(code[i] == "{") {
      bracketCount++;
    }
    if(code[i] == "}") {
      bracketCount--;
    }
    if(foundFirstBracket && bracketCount == 0) {
      endIndex = i;
      break;
    }

    if(i == codeLength) {
      throw new Error("Couldn't pair up brackets");
    }
  }
  
  let fullFunction = code.substring(startIndex,endIndex + 1);
  if(logging) {
    console.log(fullFunction);
  }

  return fullFunction;
}

/*below are custom patterns*/
function defaultPattern(frameNum) {
  let colourArray = [];

  let randColour = "#";
    randColour += Math.floor(Math.random()*10);
    randColour += Math.floor(Math.random()*10);
    randColour += Math.floor(Math.random()*10);
    randColour += Math.floor(Math.random()*10);
    randColour += Math.floor(Math.random()*10);
    randColour += Math.floor(Math.random()*10);
  for(let i = 0; i<504; i++) {
    colourArray[i] = randColour;
  }
  return colourArray;
}

function seizure(frameNum) {
  let colourArray = [];
  let randr = Math.floor(256*Math.random());
  let randg = Math.floor(256*Math.random());
  let randb = Math.floor(256*Math.random());
  let randColour = rgbToHex(randr,randg,randb);
  for(let i = 0; i<10; i++) {
    colourArray[i] = randColour;
  }
  return colourArray;
} 

function temporalRainbow(frameNum) {
  let colourArray = [];
  let hue = (frameNum % 60)/60;
  let randColour = hsvToRgb(hue,1,1);
  randColour = [Math.floor(randColour[0]),Math.floor(randColour[1]),Math.floor(randColour[2])];
  randColour = rgbToHex(...randColour);
  for(let i = 0; i<10; i++) {
    colourArray[i] = randColour;
  }
  return colourArray;
}

function rollingRainbow(frameNum) {
  let colourArray = [];  
  for(let i = 0; i<30; i++) {
    let hue = ((frameNum + i*2) % 60)/60;
    let randColour = hsvToRgb(hue,1,1);
    randColour = [Math.floor(randColour[0]),Math.floor(randColour[1]),Math.floor(randColour[2])];
    randColour = rgbToHex(...randColour);
    colourArray[i] = randColour;
  }
  return colourArray;
}

function rollingRainbowRev(frameNum) {
  let colourArray = [];  
  for(let i = 0; i<30; i++) {
    let hue = ((frameNum - i*2 + 60) % 60)/60;
    let randColour = hsvToRgb(hue,1,1);
    randColour = [Math.floor(randColour[0]),Math.floor(randColour[1]),Math.floor(randColour[2])];
    randColour = rgbToHex(...randColour);
    colourArray[i] = randColour;
  }
  return colourArray;
}

/*note works best on lower fps*/
let strobeRainbow = (function() {
  let colorsSplashes = [];
  function strobeRainbow(frameNum) {
    /*add new splashes of colour at random*/
    if(Math.random() < 0.2) {
      let splashColour = hsvToRgb(Math.random(),1,1);
      splashColour = [Math.floor(splashColour[0]),Math.floor(splashColour[1]),Math.floor(splashColour[2])];
      colorsSplashes.push({rgb: splashColour, position: 50, spread: 3});
    }

    /*calculate colours along snake*/
    let colourArray = [];
    for(let i = 0; i<50; i++) {
      let colourTotal = [0,0,0]; /*base colour is black*/
      let weight = 0.1;
      for(let splash of colorsSplashes) {
        if(Math.abs(splash.position - i) <= splash.spread) {
          let splashWeight = 1/(Math.abs(splash.position - i) + 1); 
          colourTotal = [colourTotal[0] + splashWeight*splash.rgb[0],colourTotal[1] + splashWeight*splash.rgb[1],colourTotal[2] + splashWeight*splash.rgb[2]];
          weight += splashWeight;
        }
      }
      colourArray[i] = rgbToHex(Math.floor(colourTotal[0]/weight),Math.floor(colourTotal[1]/weight),Math.floor(colourTotal[2]/weight));
    }

    /* Move splashes along body. Increase spread if they hit 0 */
    for(let i = 0; i < colorsSplashes.length; i++) {
      if(colorsSplashes[i].position > 0) {
        colorsSplashes[i].position--;
      } else {
        colorsSplashes[i].spread++;
        if(colorsSplashes[i].spread > 5 + Math.floor(4*Math.random())) {
          colorsSplashes.splice(i,1);
        }
      }
    }
    return colourArray;
  }
  return strobeRainbow;
})();

let variation = (function() {
  /*specify all colours in hsv*/
  let colorsSplashes = [];
  let baseColour = [0.3,1,1];
  let patternLength = 50;
  function variation(frameNum) {
    /*add new splashes of colour at random*/
    /*if(Math.random() < 0.6) {*/
      let splashColour = [(baseColour[0]+Math.random()*0.4-0.4+1)%1,1,1];
      colorsSplashes.push({hsv: splashColour, position: Math.floor((patternLength-1)*Math.random()), spread: 4, aliveTime: 0, weightMultiplier: 0.2});
      splashColour = [(baseColour[0]+Math.random()*0.4-0.4+1)%1,1,1];
      colorsSplashes.push({hsv: splashColour, position: Math.floor((patternLength-1)*Math.random()), spread: 4, aliveTime: 0, weightMultiplier: 0.2});
      splashColour = [(baseColour[0]+Math.random()*0.4-0.4+1)%1,1,1];
      colorsSplashes.push({hsv: splashColour, position: Math.floor((patternLength-1)*Math.random()), spread: 4, aliveTime: 0, weightMultiplier: 0.2});
      splashColour = [(baseColour[0]+Math.random()*0.4-0.4+1)%1,1,1];
      colorsSplashes.push({hsv: splashColour, position: Math.floor((patternLength-1)*Math.random()), spread: 4, aliveTime: 0, weightMultiplier: 0.2});
    /*}*/

    /*calculate colours along snake*/
    let colourArray = [];
    for(let i = 0; i<patternLength; i++) {
      let weight = 0.1;
      let hsvTotal = [baseColour[0]*weight,baseColour[1]*weight,baseColour[2]*weight];
      for(let splash of colorsSplashes) {
        if(Math.abs(splash.position - i) <= splash.spread) {
          let splashWeight = splash.weightMultiplier*(1/(Math.abs(splash.position - i) + 1)); 
          hsvTotal = [hsvTotal[0] + splashWeight*splash.hsv[0],hsvTotal[1] + splashWeight*splash.hsv[1],hsvTotal[2] + splashWeight*splash.hsv[2]];
          weight += splashWeight;
        }
      }
      
      /*Adjust vibrance to fade in/out*/
      
      hsvColour = [hsvTotal[0]/weight,hsvTotal[1]/weight,hsvTotal[2]/weight];
      hsvColour[2] = 0.85+0.15*Math.sin(2*Math.PI*frameNum/120);

      let segmentColour = hsvToRgb(...hsvColour);
      colourArray[i] = rgbToHex(Math.floor(segmentColour[0]),Math.floor(segmentColour[1]),Math.floor(segmentColour[2]));
    }

    /* Move splashes around. Increase spread at random */
    for(let i = 0; i < colorsSplashes.length; i++) {
      
        colorsSplashes[i].position += Math.random() - 0.5;
        colorsSplashes[i].position = Math.min(colorsSplashes[i].position, patternLength - 1);
        colorsSplashes[i].position = Math.max(colorsSplashes[i].position, 0);

        if(colorsSplashes[i].aliveTime < 15) {
          colorsSplashes[i].weightMultiplier += 0.08;
        } else {
          colorsSplashes[i].weightMultiplier -= 0.08;
        }

        colorsSplashes[i].spread += Math.random() - 0.5;
        colorsSplashes[i].spread = Math.max(colorsSplashes[i].spread, 1);

        colorsSplashes[i].aliveTime++;
        if(colorsSplashes[i].aliveTime > 30) {
          colorsSplashes.splice(i,1);
        }
    }
    return colourArray;
  }
  return variation;
})();

let variationV2 = (function() {
  /*specify all colours in hsv*/
  let baseColour = [0,1,1];
  const patternLength = 50;
  const totalWaveCount = 10;
  let waves = [];

  for(let i = 0; i < totalWaveCount; i++) {
    waves.push({weight: 0.15*Math.random(),
      bias: patternLength*Math.random(),
      wavelength: i + 1,
      period: 240*Math.random() + 1,
      timeBias: 240*Math.random()})
  }

  function variationV2(frameNum) {

    /*calculate colours along snake*/
    let colourArray = [];
    for(let i = 0; i<patternLength; i++) {
      let hue = baseColour[0];
      for(let j = 0; j<totalWaveCount;j++) {
        hue += waves[j].weight*Math.sin(2*Math.PI*(1/waves[j].wavelength)*(i+waves[j].bias))
        * Math.sin(2*Math.PI*(1/waves[j].period)*(frameNum+waves[j].timeBias));
      }
      hue = hue % 1 + 1;
      let saturation = 1;
      let vibrance = 0.85+0.15*Math.sin(2*Math.PI*frameNum/120);
      let colour = hsvToRgb(hue,saturation,vibrance);
      colour = [Math.floor(colour[0]),Math.floor(colour[1]),Math.floor(colour[2])];
      let hexColour = rgbToHex(...colour);
      colourArray[i] = hexColour;
    }
    return colourArray;
  }
  return variationV2;
})();

function singleColourFunctionCreator(hexcode) {
  if(!/^#[0-9a-f]{6}$/i.test(hexcode)) {
    hexcode = '#ffffff';
  }
  function singleColour() {
    let colourArray = [];
    for(let i = 0; i<10; i++) {
      colourArray[i] = hexcode;
    }
    return colourArray;
  }
  
  return singleColour;
}

/* Below are custom backgrounds */
function randomHexBg(a, frameNum, x, y) {
  let randColour = "#";
  randColour += Math.floor(Math.random()*10);
  randColour += Math.floor(Math.random()*10);
  randColour += Math.floor(Math.random()*10);
  randColour += Math.floor(Math.random()*10);
  randColour += Math.floor(Math.random()*10);
  randColour += Math.floor(Math.random()*10);
  return randColour;
}

let randomHexSameBg = (function() {
  let currentFrameNum = 0;
  let currentColour = "#FFFFFF";
  return function (a, frameNum, x, y) {
    if(frameNum !== currentFrameNum) {
      currentFrameNum = frameNum;
      currentColour = "#";
      currentColour += Math.floor(Math.random()*10);
      currentColour += Math.floor(Math.random()*10);
      currentColour += Math.floor(Math.random()*10);
      currentColour += Math.floor(Math.random()*10);
      currentColour += Math.floor(Math.random()*10);
      currentColour += Math.floor(Math.random()*10);
    }
    return currentColour;
  };
})();

function temporalBg(a, frameNum, x, y) {
  let hue = (frameNum % 60)/60;
  let randColour = hsvToRgb(hue,1,1);
  randColour = [Math.floor(randColour[0]),Math.floor(randColour[1]),Math.floor(randColour[2])];
  randColour = rgbToHex(...randColour);
  return randColour;
}

function rollingRainbowBg(a, frameNum, x, y) { 
    let hue = ((frameNum + (x+y)*2) % 60)/60;
    let saturation = 0.62;
    let vibrance = 0.84;
    if((x + y) % 2 === 1) {
      saturation += 0.13;
      vibrance -= 0.13;
    }
    let randColour = hsvToRgb(hue,saturation,vibrance);
    randColour = [Math.floor(randColour[0]),Math.floor(randColour[1]),Math.floor(randColour[2])];
    randColour = rgbToHex(...randColour);
  return randColour;
}

function rollingRainbowBgOld(a, frameNum, x, y) { 
  let hue = ((frameNum + (x+y)*2) % 60)/60;
  let randColour = hsvToRgb(hue,1,1);
  randColour = [Math.floor(randColour[0]),Math.floor(randColour[1]),Math.floor(randColour[2])];
  randColour = rgbToHex(...randColour);
return randColour;
}

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
 function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; /* achromatic */
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, v ];
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [ r * 255, g * 255, b * 255 ];
}