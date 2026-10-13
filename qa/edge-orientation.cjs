const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let browser;
(async()=>{
 browser=await chromium.launch({channel:'msedge',headless:true});
 const results=[];
 for(const [device,width,height] of [['desktop',900,700],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:device==='mobile',hasTouch:device==='mobile',deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.NEXGEN_QA_URL||'http://127.0.0.1:4191')+'/orientation-qa.html');
  await page.waitForFunction(()=>window.orientationQA,{timeout:30000});
  let checks=0,maxAngle=0,maxPivot=0;
  async function verify(options){
   const expected=await page.evaluate(o=>window.orientationQA.render(o),options);
   const delta=[expected.to[0]-expected.from[0],expected.to[1]-expected.from[1]];
   if(Math.hypot(...delta)<1e-5)return;
   const png=await page.screenshot();
   const centers=await page.evaluate(async data=>{
    const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
    const {data:rgba}=ctx.getImageData(0,0,canvas.width,canvas.height);
    const sums={red:[0,0,0],blue:[0,0,0],green:[0,0,0]};
    for(let i=0;i<rgba.length;i+=4){
     const [r,g,b]=[rgba[i],rgba[i+1],rgba[i+2]];
     const key=r>200&&g<60&&b<60?'red':b>200&&r<60&&g<60?'blue':g>200&&r<60&&b<60?'green':null;
     if(key){sums[key][0]+=(i/4)%canvas.width;sums[key][1]+=Math.floor(i/4/canvas.width);sums[key][2]++;}
    }
    return Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,v[2]?[v[0]/v[2],v[1]/v[2]]:null]));
   },png.toString('base64'));
   assert(centers.red&&centers.blue&&centers.green,'Missing rendered calibration pixels: '+JSON.stringify({device,options,centers,errors}));
   const nose=[centers.red[0]-centers.blue[0],centers.red[1]-centers.blue[1]];
   const cosine=(nose[0]*delta[0]+nose[1]*delta[1])/(Math.hypot(...nose)*Math.hypot(...delta));
   const angle=Math.acos(Math.max(-1,Math.min(1,cosine)))*180/Math.PI;
   const pivot=Math.hypot(centers.green[0]-expected.from[0],centers.green[1]-expected.from[1]);
   maxAngle=Math.max(maxAngle,angle);maxPivot=Math.max(maxPivot,pivot);checks++;
   assert(angle<2,'Nose/path mismatch: '+JSON.stringify({device,options,angle,expected}));
   assert(pivot<2,'Pivot drift: '+JSON.stringify({device,options,pivot}));
  }
  for(const diagonal of [false,true])for(const heading of [0,90,180,270])for(const [bearing,pitch] of [[0,0],[65,0],[-35,45]]){
   await verify({heading,bearing,pitch,diagonal});
  }
  const scenarios=await page.evaluate(()=>window.orientationQA.scenarios);
  for(let scenarioIndex=0;scenarioIndex<scenarios.length;scenarioIndex++){
   const time=scenarios[scenarioIndex].duration*0.43;
   const actors=await page.evaluate(({scenarioIndex,time})=>window.orientationQA.actors(scenarioIndex,time),{scenarioIndex,time});
   for(const actor of actors.filter(a=>a.path)){
    await verify({scenarioIndex,time,actorIndex:actor.index,bearing:65,pitch:35,diagonal:true});
   }
  }
  await page.evaluate(()=>window.orientationQA.render({actual:true,heading:90,bearing:0,pitch:0}));
  await page.screenshot({path:'nexgen-orientation-'+device+'.png'});
  assert.deepEqual(errors,[]);
  results.push({device,checks,maxAngleDegrees:maxAngle,maxPivotPixels:maxPivot,errors});
  await page.close();
 }
 await browser.close();
 fs.writeFileSync('nexgen-orientation-results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
