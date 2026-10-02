import { test } from 'node:test';
import assert from 'node:assert/strict';
import login from '../src/pages/api/login';
import logout from '../src/pages/api/logout';
import { customerSession } from '../src/edoctor/auth-server';

test('login keeps tokens in HttpOnly cookies, rejects cross-origin and clears logout', async () => {
  process.env.SITE_URL = 'https://shop.example';
  process.env.GRAPHQL_URL = 'https://wordpress.example/graphql';
  const original = global.fetch;
  let calls = 0;
  global.fetch = (async () => { calls++; return Response.json({data:{login:{authToken:'private-token',refreshToken:'private-refresh'}}}); }) as typeof fetch;
  const headers: Record<string, any> = {}; let status = 200; let body: any;
  const res: any = {setHeader(k:string,v:any){headers[k]=v;}, status(n:number){status=n;return this;}, json(data:any){body=data;}};
  try {
    await login({method:'POST',headers:{origin:'https://evil.example'},body:{username:'client',password:'test'}} as any,res);
    assert.equal(status,403); assert.equal(calls,0);
    await login({method:'POST',headers:{origin:'https://shop.example'},body:{username:'client',password:'test'}} as any,res);
    assert.equal(status,200); assert.deepEqual(body,{ok:true});
    assert.equal(headers['Cache-Control'],'private, no-store');
    for(const cookie of headers['Set-Cookie']) {assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=Lax/);}
    logout({method:'POST',headers:{origin:'https://shop.example'}} as any,res);
    assert.ok(headers['Set-Cookie'].every((c:string)=>c.includes('Max-Age=0')));
    global.fetch = (async()=>Response.json({errors:[{message:'sensitive upstream detail'}]})) as typeof fetch;
    await login({method:'POST',headers:{origin:'https://shop.example'},body:{username:'client',password:'wrong'}} as any,res);
    assert.equal(status,401); assert.doesNotMatch(JSON.stringify(body),/sensitive|private-token/);
  } finally {global.fetch=original;}
});

test('expired session refreshes on server and validates viewer before returning identity', async () => {
  process.env.GRAPHQL_URL='https://wordpress.example/graphql';
  const original=global.fetch; const headers: Record<string,any>={};
  global.fetch=(async (_url,options)=>{
    const request=JSON.parse(String(options?.body));
    if(request.query.includes('RefreshSession')) return Response.json({data:{refreshToken:{success:true,authToken:'renewed'}}});
    if((options?.headers as any).Authorization==='Bearer renewed') return Response.json({data:{viewer:{databaseId:7,name:'Client',email:'client@example.test'}}});
    return Response.json({errors:[{message:'expired'}]});
  }) as typeof fetch;
  try {
    const customer=await customerSession({ed_auth:'expired',ed_refresh:'refresh'},{setHeader(k:string,v:any){headers[k]=v;}} as any);
    assert.equal(customer?.databaseId,7); assert.match(headers['Set-Cookie'],/ed_auth=renewed/);
  } finally {global.fetch=original;}
});
