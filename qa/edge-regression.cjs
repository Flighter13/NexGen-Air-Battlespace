const { chromium } = require('playwright');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 const results=[];
 for(const [device,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:device==='mobile',hasTouch:device==='mobile'});
  const errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push(r.url()));
  try {
   const response=await page.goto('https://flighter13.github.io/NexGen-Air-Battlespace/research/',{waitUntil:'networkidle',timeout:30000});
   await page.waitForTimeout(900);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   await page.locator('#scenario').selectOption({index:1});
   const scenario=await page.locator('#scenario').inputValue();
   await page.getByRole('button',{name:'Network',exact:true}).click();
   const networkSelected=await page.getByRole('button',{name:'Network',exact:true}).getAttribute('aria-pressed');
   await page.getByRole('button',{name:'Geographic',exact:true}).click();
   let tabs=false;
   if(device==='mobile'){
    await page.getByRole('button',{name:'Library',exact:true}).click();
    tabs=await page.locator('.library-panel.mobile-visible').isVisible();
    await page.getByRole('button',{name:'Explore',exact:true}).click();
   }
   await page.screenshot({path:'nexgen-edge-'+device+'.png'});
   results.push({device,status:response.status(),overflow,scenario,networkSelected,tabs,errors,failed});
  }catch(e){results.push({device,error:String(e),errors,failed})}
  await page.close();
 }
 await browser.close();
 console.log(JSON.stringify(results,null,2));
 if(results.some(x=>x.error||x.status!==200||x.overflow>1||x.errors.length||x.failed.length||x.networkSelected!=='true'||(x.device==='mobile'&&!x.tabs)))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});