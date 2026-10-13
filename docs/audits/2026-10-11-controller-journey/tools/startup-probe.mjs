import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
const { chromium } = createRequire(path.resolve('package.json'))('playwright');
if (!process.env.RADAR_AUDIT_ACCOUNTS_FILE) throw new Error('Provide private RADAR_AUDIT_ACCOUNTS_FILE; never commit credentials.');
const credentials=JSON.parse(fs.readFileSync(process.env.RADAR_AUDIT_ACCOUNTS_FILE,'utf8'));
const output=process.env.RADAR_AUDIT_OUTPUT || path.join(fs.mkdtempSync(path.join(os.tmpdir(),'radar-startup-')),'probe.json');
// Exclusive creation refuses existing files/symlinks; retain the descriptor for checkpoints.
const outputFd=fs.openSync(output,'wx',0o600);
const result={environment:'cloud local HTTP/no network throttle; disposable Supabase migration61; same account/data; read-only UI',baseline:'113841bda52ce3bbda228524daf9a7464f12b462',candidate:'53f2fe991f0c4460576346cbca3a2375bf8c9890',samples:[]};
const browser=await chromium.launch({headless:true,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}:undefined});
const apis=['RadarTask9PendencyPage','RadarTask9FocusBridge','RadarTask9CrossView','RadarTask1011PendencyActions','RadarOperationalReadinessBridge','RadarCycleBDashboard','RadarCycleBCarteira','RadarTask10Alerts','RadarModalAccessibility','__radarNavigationHistoryInstalled'];
async function setup(){
 const context=await browser.newContext({viewport:{width:1440,height:900}}); const page=await context.newPage();page.setDefaultTimeout(15000);
 const net=[],errors=[];
 page.on('response',async r=>{const u=new URL(r.url());if(!u.pathname.startsWith('/rest/'))return;const q={path:u.pathname,status:r.status(),at:Date.now()};net.push(q);try{q.bytes=(await r.body()).length;}catch{q.bodyUnavailable=true;}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.__startupProbe={events:[],longTasks:[],lcp:[],paint:[]};
  for(const e of ['radar:auth-resolved','radar:application-services-ready','radar:navigation-committed','radar:pendency-page-ready'])window.addEventListener(e,()=>__startupProbe.events.push({name:e,start:performance.now()}));
  document.addEventListener('DOMContentLoaded',()=>__startupProbe.events.push({name:'DOMContentLoaded',start:performance.now()}));
  for(const [type,key] of [['longtask','longTasks'],['largest-contentful-paint','lcp'],['paint','paint']]){
   try{new PerformanceObserver(list=>{for(const e of list.getEntries())__startupProbe[key].push({name:e.name,start:e.startTime,duration:e.duration,size:e.size});}).observe({type,buffered:true});}catch{}
  }
 });
 const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
 return {context,page,net,errors,cdp};
}
async function ready(page){await page.waitForFunction(()=>window.RadarDataContext?.ready===true&&window.RadarAuthContext?.authorization?.role==='controller');await page.locator('#app-layout').waitFor({state:'visible'});await page.locator('#main-container h1').waitFor({state:'visible'});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function snapshot(h,label,extra={}){
 const state=await h.page.evaluate(names=>({now:performance.now(),url:location.pathname+location.search,heading:document.querySelector('#main-container h1')?.textContent,history:history.state,route:window.RadarNavigationHistory?.currentRoute?.(window),filter:document.querySelector('#pendency-filter-school')?.value,apis:Object.fromEntries(names.map(n=>[n,!!window[n]])),probe:window.__startupProbe,navigation:performance.getEntriesByType('navigation').map(e=>({domInteractive:e.domInteractive,domContentLoaded:e.domContentLoadedEventEnd,load:e.loadEventEnd,transferSize:e.transferSize})),resources:performance.getEntriesByType('resource').map(e=>({path:new URL(e.name).pathname,type:e.initiatorType,start:e.startTime,duration:e.duration,transferBytes:e.transferSize,decodedBytes:e.decodedBodySize}))}),apis);
 const perf=await h.cdp.send('Performance.getMetrics'); const cpu=Object.fromEntries(perf.metrics.filter(m=>['ScriptDuration','TaskDuration','LayoutDuration','RecalcStyleDuration','JSHeapUsedSize','Nodes'].includes(m.name)).map(m=>[m.name,m.value]));
 const row={label,...extra,state,cpu,network:[...h.net],errors:[...h.errors]};result.samples.push(row);const json=Buffer.from(JSON.stringify(result,null,2));fs.writeSync(outputFd,json,0,json.length,0);fs.ftruncateSync(outputFd,json.length);console.log(JSON.stringify({label,elapsed:extra.elapsedMs,heading:state.heading,filter:state.filter,route:state.route,apis:state.apis,requests:h.net.length,errors:h.errors}));
}
for(let round=0;round<3;round++)for(const [variant,base] of [['baseline','http://127.0.0.1:4177'],['candidate','http://127.0.0.1:4176']]){
 const h=await setup();let t=performance.now();await h.page.goto(base);await h.page.locator('#radar-auth-form button[type=submit]').waitFor({state:'visible'});const loginVisibleMs=performance.now()-t;
 await h.page.locator('#radar-auth-email').fill(credentials.controllerEmail);await h.page.locator('#radar-auth-password').fill(credentials.password);t=performance.now();await h.page.locator('#radar-auth-form button[type=submit]').click();try{await ready(h.page)}catch(e){await snapshot(h,variant+'-auth-failure',{reason:e.message});await browser.close();throw e;}const usableMs=performance.now()-t;await h.page.waitForTimeout(500);await snapshot(h,variant+'-cold-'+round,{loginVisibleMs,elapsedMs:usableMs,measurement:'click login -> authenticated UI + two frames; 500ms observation buffer excluded'});
 h.net.length=0;t=performance.now();await h.page.reload();await ready(h.page);const reloadMs=performance.now()-t;await h.page.waitForTimeout(500);await snapshot(h,variant+'-warm-'+round,{elapsedMs:reloadMs,measurement:'reload -> authenticated UI + two frames; 500ms observation buffer excluded'});
 if(round===0){
  h.net.length=0;await h.page.goto(base+'/pendencias?escola=ESC-LOCAL');await ready(h.page);await h.page.getByRole('button',{name:'Limpar filtro de unidade'}).waitFor();await snapshot(h,variant+'-route-initial');
  await h.page.getByRole('button',{name:'Limpar filtro de unidade'}).click();await h.page.waitForTimeout(300);await snapshot(h,variant+'-route-clear');
  await h.page.goBack();await h.page.waitForTimeout(300);await snapshot(h,variant+'-route-back');
  await h.page.goForward();await h.page.waitForTimeout(300);await snapshot(h,variant+'-route-forward');
 }
 await h.context.close();
}
for(const [variant,base] of [['baseline','http://127.0.0.1:4177'],['candidate','http://127.0.0.1:4176']]){
 const h=await setup();let release;const barrier=new Promise(r=>release=r);await h.page.route('**/app.js',async r=>{await barrier;await r.continue()});const extension=h.page.waitForResponse(r=>r.url().endsWith('/src/integration/task-9-pendencias-page.js'));const nav=h.page.goto(base);try{await extension;await h.page.waitForTimeout(11000);}finally{release();}await nav;await h.page.locator('#radar-auth-email').fill(credentials.controllerEmail);await h.page.locator('#radar-auth-password').fill(credentials.password);await h.page.locator('#radar-auth-form button[type=submit]').click();await ready(h.page);await h.page.waitForTimeout(500);await snapshot(h,variant+'-slow-app',{artificialAppDelayMs:11000});await h.context.close();
}
await browser.close();
fs.closeSync(outputFd);
