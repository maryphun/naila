import { expect,request,test } from '@playwright/test';

test('feedback is one thread per submission, shared with admins, and private to its owner',async({page})=>{
  const customer=await request.newContext({baseURL:'http://127.0.0.1:5173'});
  const merchant=await request.newContext({baseURL:'http://127.0.0.1:5173'});
  const admin=await request.newContext({baseURL:'http://127.0.0.1:5173'});
  try{
    await customer.post('/api/demo/login',{data:{role:'customer'}});
    await merchant.post('/api/demo/login',{data:{role:'merchant'}});
    await admin.post('/api/demo/login',{data:{role:'admin'}});
    const subject=`Map search ${crypto.randomUUID()}`;
    const requestKey=crypto.randomUUID();
    const payload={subject,body:'Please add a map to discovery.',category:'feature_request',requestKey};
    const created=await customer.post('/api/conversations/feedback',{data:payload});
    expect(created.status()).toBe(201);
    const {id}=await created.json();
    expect((await customer.post('/api/conversations/feedback',{data:payload})).status()).toBe(200);
    const second=await customer.post('/api/conversations/feedback',{data:{...payload,requestKey:crypto.randomUUID()}});
    expect(second.status()).toBe(201);
    expect((await second.json()).id).not.toBe(id);
    const customerThread=await (await customer.get(`/api/conversations/${id}`)).json();
    expect(customerThread.conversation).toMatchObject({type:'app_feedback',subject,category:'feature_request',owner_id:'demo-customer'});
    expect(customerThread.messages[0].body).toBe(payload.body);
    expect((await merchant.get(`/api/conversations/${id}`)).status()).toBe(404);
    expect((await merchant.post(`/api/conversations/${id}/messages`,{data:{body:'No access'}})).status()).toBe(404);
    expect((await customer.get('/api/conversations/not-an-id')).status()).toBe(404);
    const adminInbox=await (await admin.get('/api/conversations')).json();
    expect(adminInbox.conversations.find((item:{id:string})=>item.id===id)).toMatchObject({unread:1,subject});
    expect((await admin.get(`/api/conversations/${id}`)).status()).toBe(200);
    expect((await admin.post(`/api/conversations/${id}/read`,{data:{}})).status()).toBe(200);
    const adminAfterRead=await (await admin.get('/api/conversations')).json();
    expect(adminAfterRead.conversations.find((item:{id:string})=>item.id===id).unread).toBe(0);
    expect((await admin.post(`/api/conversations/${id}/messages`,{data:{body:'Thank you for the suggestion.'}})).status()).toBe(201);
    const customerInbox=await (await customer.get('/api/conversations')).json();
    expect(customerInbox.conversations.find((item:{id:string})=>item.id===id).unread).toBe(1);
    expect(await (await customer.get(`/api/conversations/${id}`)).json()).toMatchObject({messages:expect.arrayContaining([expect.objectContaining({sender_name:'Hotlah Support',body:'Thank you for the suggestion.'})])});
    await customer.post(`/api/conversations/${id}/read`,{data:{}});
    expect(await (await customer.get('/api/conversations')).json()).toMatchObject({conversations:expect.arrayContaining([expect.objectContaining({id,unread:0})])});

    const merchantFeedback=await merchant.post('/api/conversations/feedback',{data:{subject:'Merchant calendar',body:'Please add a week view.',category:'merchant_tools',requestKey:crypto.randomUUID()}});
    expect(merchantFeedback.status()).toBe(201);
    const merchantId=(await merchantFeedback.json()).id;
    expect((await customer.get(`/api/conversations/${merchantId}`)).status()).toBe(404);
    expect((await admin.get(`/api/conversations/${merchantId}`)).status()).toBe(200);
    await page.request.post('/api/demo/login',{data:{role:'customer'}});
    await page.goto('/account');
    await expect(page.getByRole('button',{name:'Send feedback to Hotlah'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Hotlah Customer Service'})).toBeVisible();
  }finally{await customer.dispose();await merchant.dispose();await admin.dispose();}
});

test('Customer Service creation is unique under concurrency and supports two-way unread replies',async()=>{
  const customer=await request.newContext({baseURL:'http://127.0.0.1:5173'});
  const merchant=await request.newContext({baseURL:'http://127.0.0.1:5173'});
  const admin=await request.newContext({baseURL:'http://127.0.0.1:5173'});
  try{
    await customer.post('/api/demo/login',{data:{role:'customer'}});
    await merchant.post('/api/demo/login',{data:{role:'merchant'}});
    await admin.post('/api/demo/login',{data:{role:'admin'}});
    const responses=await Promise.all(Array.from({length:6},()=>customer.post('/api/conversations/customer-service',{data:{}})));
    expect(responses.every(response=>response.ok())).toBe(true);
    const ids=await Promise.all(responses.map(async response=>(await response.json()).id));
    expect(new Set(ids).size).toBe(1);
    const id=ids[0];
    expect((await (await customer.post('/api/conversations/customer-service',{data:{}})).json()).id).toBe(id);
    expect((await merchant.get(`/api/conversations/${id}`)).status()).toBe(404);
    expect((await customer.get(`/api/conversations/${id}`)).status()).toBe(200);
    expect((await customer.post(`/api/conversations/${id}/messages`,{data:{body:'I need help with my account.'}})).status()).toBe(201);
    expect((await (await admin.get('/api/conversations')).json()).conversations.find((item:{id:string})=>item.id===id).unread).toBeGreaterThan(0);
    expect((await admin.post(`/api/conversations/${id}/messages`,{data:{body:'We can help.'}})).status()).toBe(201);
    expect((await (await customer.get('/api/conversations')).json()).conversations.find((item:{id:string})=>item.id===id).unread).toBeGreaterThan(0);
    const merchantSupport=await merchant.post('/api/conversations/customer-service',{data:{}});
    expect(merchantSupport.ok()).toBe(true);
    expect((await merchantSupport.json()).id).not.toBe(id);
  }finally{await customer.dispose();await merchant.dispose();await admin.dispose();}
});

test('Account composer and Messages use the same support thread',async({page})=>{
  await page.request.post('/api/demo/login',{data:{role:'customer'}});
  await page.goto('/account');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.getByRole('button',{name:'Send feedback to Hotlah'}).click();
  const dialog=page.getByRole('dialog',{name:'Send feedback to Hotlah'});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox',{name:'Subject'}).fill(`App feedback ${crypto.randomUUID()}`);
  await dialog.getByRole('textbox',{name:'Message'}).fill('The booking page could be clearer.');
  await dialog.getByRole('button',{name:'Send feedback'}).click();
  await expect(page).toHaveURL(/\/messages\/[a-f0-9-]{36}$/);
  await expect(page.getByText('The booking page could be clearer.')).toBeVisible();
  await page.goto('/messages');
  await expect(page.getByText('Feedback',{exact:true}).first()).toBeVisible();
  await page.goto('/account');
  await page.getByRole('button',{name:'Hotlah Customer Service'}).click();
  await expect(page).toHaveURL(/\/messages\/[a-f0-9-]{36}$/);
  await expect(page.getByRole('heading',{name:'Hotlah Customer Service'})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Message'})).toBeEnabled();
});
