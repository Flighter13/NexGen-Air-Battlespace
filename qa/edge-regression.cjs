const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const results=[];
 for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:device==='mobile',hasTouch:device==='mobile'});
  const errors=[],failed=[],httpErrors=[],scripts=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
  page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
  page.on('request',r=>{if(r.resourceType()==='script')scripts.push(r.url());});
  const panel=async name=>{if(device==='mobile')await page.getByRole('button',{name,exact:true}).click();};
  const mapReady=async()=>{
   await page.locator('.maplibregl-canvas').waitFor({state:'visible'});
   await page.locator('.map[aria-busy="false"]').waitFor({state:'visible'});
   await page.waitForLoadState('networkidle');
   await page.waitForFunction(()=>!document.querySelector('.visualization-loading'));
   assert.equal(await page.locator('.map-error').count(),0,'Map reported an error');
  };
  try {
   const response=await page.goto(process.env.NEXGEN_TEST_URL || 'https://flighter13.github.io/NexGen-Air-Battlespace/research/',{waitUntil:'networkidle',timeout:60000});
   assert.equal(response.status(),200);
   await mapReady();
   assert(!scripts.some(s=>/NetworkView-.*\.js/.test(s)),'Network downloaded before it was selected');
   const scenarios=await page.locator('#scenario option').evaluateAll(options=>options.map(o=>o.value));
   for(const scenario of scenarios){
    await panel('Scenario');
    await page.locator('#scenario').selectOption(scenario);
    await panel('Explore');
    await mapReady();
    await page.getByRole('button',{name:'Network',exact:true}).click();
    await page.locator('svg.network .network-node').first().waitFor({state:'visible'});
    assert.equal(await page.getByRole('button',{name:'Network',exact:true}).getAttribute('aria-pressed'),'true');
    await page.locator('svg.network .network-node').first().click();
    await page.locator('#compare-phase').selectOption({index:1});
    await page.locator('.phase-diff').waitFor({state:'visible'});
    const phases=page.getByRole('tab');
    for(let i=0;i<await phases.count();i++){
     await phases.nth(i).click();
     assert.equal(await phases.nth(i).getAttribute('aria-selected'),'true');
    }
    await page.getByRole('button',{name:'Reset timeline'}).click();
    await page.getByRole('button',{name:/^Play/}).click();
    await page.waitForFunction(()=>Number(document.querySelector('input[aria-label="Presentation time"]').value)>0);
    await page.getByRole('button',{name:/^Pause/}).click();
    await page.getByRole('button',{name:'Geographic',exact:true}).click();
    await mapReady();
    await page.getByRole('button',{name:'Network',exact:true}).click();
    await page.locator('svg.network').waitFor({state:'visible'});
   }
   await panel('Library');
   const count=await page.locator('.entity-row').count();
   assert(count>0,'Empty entity library');
   await page.getByRole('textbox',{name:'Search entities'}).fill('NO_MATCH_REGRESSION_CHECK');
   assert.equal(await page.locator('.entity-row').count(),0);
   await page.getByRole('textbox',{name:'Search entities'}).fill('');
   assert.equal(await page.locator('.entity-row').count(),count);
   await page.locator('.entity-row').first().click();
   assert(await page.locator('.profile-sidebar').isVisible());
   await panel('Explore');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert(overflow<=1,'Horizontal page overflow: '+overflow);
   assert.equal(errors.length,0,JSON.stringify(errors));
   assert.equal(httpErrors.length,0,JSON.stringify(httpErrors));
   assert.equal(failed.length,0,JSON.stringify(failed));
   await page.screenshot({path:'nexgen-edge-'+device+'.png'});
   results.push({device,status:response.status(),scenarios:scenarios.length,libraryRecords:count,overflow,errors,httpErrors,failed,scripts});
  }catch(e){results.push({device,error:String(e),errors,httpErrors,failed});}
  await page.close();
 }
 await browser.close();
 console.log(JSON.stringify(results,null,2));
 if(results.some(x=>x.error))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
