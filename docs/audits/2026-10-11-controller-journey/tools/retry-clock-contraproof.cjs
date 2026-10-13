const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = process.cwd();
const api = require(root + '/src/integration/operational-realtime-invalidation.js');
const source = fs.readFileSync(root + '/tests/unit/operational-realtime-invalidation.test.js', 'utf8');
const definition = source.slice(source.indexOf('function createHarness('), source.indexOf("\ntest('"));
const harnessFactory = new Function('createController','TOPIC','EVENT','assert',definition+'; return createHarness;')(api.createController, api.TOPIC, api.EVENT, assert);
(async () => {
 const h = harnessFactory(); let attempts = 0;
 const c = api.createController(h.root,{ client:h.client,debounceMs:0,refreshController:{async refresh(){attempts++;return attempts===1?{ok:false,error:new Error('network')}:{stale:false};}}});
 await c.start(); h.emitStatus('SUBSCRIBED'); h.emitBroadcast({entity:'verifications'});
 const testDeadline = new Promise(resolve => setTimeout(resolve,15));
 const until = performance.now()+50; while(performance.now()<until) { /* simulates a busy runner, not product work */ }
 await testDeadline; const atAssertion = attempts;
 await new Promise(resolve=>setTimeout(resolve,20));
 console.log(JSON.stringify({atOriginalTestDeadline:atAssertion,afterTimerDrain:attempts,interpretation:'real clock deadline may precede nested retry callback on a busy event loop'}));
 assert.equal(atAssertion,1); assert.equal(attempts,2); await c.stop();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
