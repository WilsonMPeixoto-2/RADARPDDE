const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const repo = path.resolve(process.argv[2]);
const esbuild = require(path.join(path.resolve(process.argv[3] || repo), 'node_modules/esbuild'));
(async () => {
  const domain = await import(pathToFileURL(path.join(repo, 'supabase/functions/_shared/team-account-domain.mjs')).href);
  const source = fs.readFileSync(path.join(repo, 'supabase/functions/team-account-management/index.ts'), 'utf8').replace(/^import[\s\S]*?;\r?\n/gm, '');
  const code = esbuild.transformSync(source, {loader:'ts', target:'es2022'}).code;
  const ctx = { ...domain, console, Date, Set, JSON, Deno:{serve(){},env:{get(){return undefined;}}}, Response };
  vm.createContext(ctx);
  vm.runInContext(code + '\nglobalThis.auditProbe={saveMember,deactivateMember};',ctx);
  const normal = domain.normalizeTeamCommand({operation:'save_controller', controller:{id:'ctrl-a',name:'Novo',email:'novo@example.test',rowVersion:7}, previousController:{id:'ctrl-a',rowVersion:7}, administrativeLog:{id:'log-a'}});
  assert.equal('rowVersion' in normal.entity, false);
  assert.equal('row_version' in normal.entity, false);
  const actor={id:'00000000-0000-4000-8000-000000000001'};
  function query(existing) {return {select(){return this;},eq(){return this;},order(){return this;},limit(){return Promise.resolve({data:[],error:null});},maybeSingle(){return Promise.resolve({data:existing,error:null});}};}
  const state={auth:null,directory:null,profiles:null,log:false}; const events=[];
  const admin={
    from(table){return query(table==='controllers'?state.directory:null);},
    auth:{admin:{
      async inviteUserByEmail(email){events.push('auth-invite');state.auth={id:'00000000-0000-4000-8000-000000000011',email};return {data:{user:state.auth},error:null};},
      async deleteUser(){events.push('auth-delete-compensation');state.auth=null;if(state.directory)state.directory.user_id=null;state.profiles=null;return {error:null};}
    }},
    async rpc(name,args){if(name==='resolve_team_auth_user_id_by_email')return {data:null,error:null};
      assert.equal(name,'upsert_team_member_account');
      events.push('database-commit-response-lost');
      state.directory={...args.p_member,user_id:args.p_user_id,active:true};state.profiles={user_id:args.p_user_id,active:true};state.log=true;
      return {data:null,error:new Error('synthetic transport failure after committed transaction')};}
  };
  await assert.rejects(ctx.auditProbe.saveMember(admin,actor,normal), /synthetic transport/);
  assert.equal(state.auth,null);assert.equal(state.directory.active,true);assert.equal(state.directory.user_id,null);assert.equal(state.log,true);
  console.log(JSON.stringify({scope:'Real Edge functions; simulated RPC acknowledgement loss and FK deletion behavior; no live database', normalizedEntity:normal.entity, events, finalState:state},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
