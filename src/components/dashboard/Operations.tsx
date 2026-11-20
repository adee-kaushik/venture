'use client';
import { useEffect,useState,type FormEvent } from 'react';
import { CalendarDays, MessageSquare, Send, RefreshCw, Check, ArrowUpRight } from 'lucide-react';
import { BookingCalendar } from './BookingCalendar';
type Booking={id:string;requestedTime:string;status:string;leadId?:string;updatedAt?:string;details:Record<string,string>};
type Lead={id:string;name:string;phone:string};
type Conversation={id:string;status:string;channel:string;messageCount:number;lastMessage?:{text:string}};
type Message={id:string;role:string;text:string;createdAt:string};
type FollowUp={id:string;leadId:string;status:string;dueAt:string;text:string};
async function request(path:string,data?:unknown,method='POST'){
 const options = data ? {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)} : undefined;
 // Retry once only for interrupted read requests; never retry writes that may already have succeeded.
 for (let attempt = 0; attempt < (data === undefined ? 2 : 1); attempt++) {
  try {
   const response = await fetch(path,options);
   const result = await response.json();
   if (!response.ok) throw new Error(result.error || 'Request failed ('+response.status+')');
   return result;
  } catch(error) {
   if (error instanceof TypeError && data === undefined && attempt === 0) continue;
   if (error instanceof TypeError) throw new Error('The connection was interrupted. Please retry.');
   throw error;
  }
 }
 throw new Error('Unable to load the requested data. Please retry.');
}
export function BookingDesk({businessId}:{businessId:string}){
 const [items,setItems]=useState<Booking[]>([]);const [leads,setLeads]=useState<Lead[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState('');
 async function load(){try{const [b,l]=await Promise.all([request('/api/bookings?businessId='+businessId),request('/api/leads?businessId='+businessId)]);setItems(b.bookings);setLeads(l.leads);}catch(e){setError(String(e));}}
 useEffect(()=>{setItems([]);setError('');void load();},[businessId]);
 async function update(e:FormEvent<HTMLFormElement>,b:Booking){e.preventDefault();setBusy(b.id);setError('');const f=new FormData(e.currentTarget);try{await request('/api/bookings',{businessId,bookingId:b.id,status:f.get('status'),requestedTime:f.get('time')?new Date(String(f.get('time'))+':00+05:30').toISOString():b.requestedTime,durationMinutes:Number(f.get('duration')),resource:f.get('resource')},'PATCH');await load();}catch(e){setError(e instanceof Error?e.message:'Unable to save');}finally{setBusy('');}}
 return <section className="ops"><div className="ops-title"><div><p className="eyebrow">MAKE ROOM FOR WHAT’S NEXT</p><h2>Booking desk</h2><p>Review requests and reserve time with the right team member. All times are India Standard Time.</p></div><button onClick={load} className="ops-button"><RefreshCw size={15}/>Refresh</button></div>{error&&<p className="ops-error" role="alert">{error}</p>}<BookingCalendar bookings={items}/>{!items.length&&<div className="ops-empty"><CalendarDays/><h3>Your next booking starts here</h3><p>Requests from your customer assistant will appear here for review.</p></div>}{items.map(b=><form className="booking-card" key={b.id+b.updatedAt} onSubmit={e=>update(e,b)}><div className="booking-head"><div><strong>{leads.find(l=>l.id===b.leadId)?.name||'Customer request'}</strong><p>{leads.find(l=>l.id===b.leadId)?.phone}</p><p>Requested: {b.requestedTime}</p></div><span className={'status '+b.status}>{b.status}</span></div>{b.details.requestText&&<p className="request-text">{b.details.requestText}</p>}<div className="booking-fields"><label>Date & time (IST)<input name="time" type="datetime-local" defaultValue={Number.isFinite(Date.parse(b.requestedTime))?new Date(Date.parse(b.requestedTime)+19800000).toISOString().slice(0,16):''}/></label><label>Duration<select name="duration" defaultValue={b.details.durationMinutes||'30'}>{[15,30,45,60,90,120,180].map(n=><option key={n} value={n}>{n} minutes</option>)}</select></label><label>Staff / room / table<input name="resource" defaultValue={b.details.resource||'Front desk'} required maxLength={80}/></label><label>Status<select name="status" defaultValue={b.status}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="declined">Declined / cancelled</option></select></label></div><button className="ops-button filled" disabled={busy===b.id}><Check size={14}/>{busy===b.id?'Saving…':'Save booking'}</button></form>)}</section>;
}
export function Inbox({businessId}:{businessId:string}){
 const [list,setList]=useState<Conversation[]>([]);const [active,setActive]=useState<Conversation|null>(null);const [messages,setMessages]=useState<Message[]>([]);const [text,setText]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function load(){try{const d=await request('/api/conversations?businessId='+businessId);setList(d.conversations);}catch(e){setError(String(e));}}
 useEffect(()=>{setActive(null);setMessages([]);setList([]);void load();const timer=setInterval(load,10000);return()=>clearInterval(timer);},[businessId]);
 useEffect(()=>{if(!active)return;let live=true;async function poll(){try{const d=await request(`/api/conversations?businessId=${businessId}&conversationId=${active!.id}`);if(live)setMessages(d.messages);}catch(e){if(live)setError(String(e));}}void poll();const timer=setInterval(poll,5000);return()=>{live=false;clearInterval(timer);};},[active?.id,businessId]);
 async function act(data:unknown){setBusy(true);setError('');try{await request('/api/conversations',{businessId,conversationId:active?.id,...data as object},'PATCH');setText('');await load();const d=await request(`/api/conversations?businessId=${businessId}&conversationId=${active!.id}`);setMessages(d.messages);}catch(e){setError(e instanceof Error?e.message:'Unable to update');}finally{setBusy(false);}}
 const current=list.find(c=>c.id===active?.id);
 return <section className="ops"><div className="ops-title"><div><p className="eyebrow">EVERY CONVERSATION, TOGETHER</p><h2>Customer inbox</h2><p>Read the full thread, take over from the assistant or hand it back.</p></div></div>{error&&<p role="alert" className="ops-error">{error}</p>}<div className="inbox-grid"><aside>{list.map(c=><button key={c.id} onClick={()=>{setActive(c);setMessages([]);}} className={active?.id===c.id?'selected':''}><strong>{c.channel==='web'?'Website visitor':'WhatsApp customer'}<span className="status">{c.status==='human'?'Needs team':c.status}</span></strong><p>{c.lastMessage?.text||'New conversation'}</p><small>{c.messageCount} messages</small></button>)}{!list.length&&<p className="ops-empty">No conversations yet. Share your customer link to begin.</p>}</aside><div className="thread">{active?<><div className="thread-toolbar"><span className="status">{current?.status==='human'?'Team is replying':'Assistant mode'}</span><button disabled={busy} onClick={()=>act({status:current?.status==='human'?'active':'human'})} className="ops-button">{current?.status==='human'?'Resume assistant':'Take over'}</button><button disabled={busy} onClick={()=>act({status:'closed'})} className="ops-button">Close</button></div><div className="thread-messages">{messages.map(m=><div key={m.id} className={'thread-message '+m.role}><small>{m.role==='owner'?'Your team':m.role==='ai'?'Assistant':'Customer'} · {new Date(m.createdAt).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit'})}</small><p>{m.text}</p></div>)}</div><form onSubmit={e=>{e.preventDefault();void act({text});}} className="reply-form"><input aria-label="Reply to customer" value={text} onChange={e=>setText(e.target.value)} maxLength={2000} required placeholder="Write a personal reply…"/><button className="ops-button filled" disabled={busy||!text.trim()}><Send size={15}/>Send</button></form></>:<div className="ops-empty"><MessageSquare/><h3>A conversation is a beginning.</h3><p>Select a thread to see the full story.</p></div>}</div></div></section>;
}
export function FollowUps({businessId}:{businessId:string}){
 const [list,setList]=useState<FollowUp[]>([]);const [leads,setLeads]=useState<Lead[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function load(){try{const [f,l]=await Promise.all([request('/api/followups?businessId='+businessId),request('/api/leads?businessId='+businessId)]);setList(f.followups);setLeads(l.leads);}catch(e){setError(String(e));}}
 useEffect(()=>{setList([]);void load();},[businessId]);
 async function save(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=e.currentTarget;const f=new FormData(form);try{await request('/api/followups',{businessId,leadId:f.get('leadId'),text:f.get('text'),dueAt:new Date(String(f.get('date'))+':00+05:30').toISOString()});form.reset();await load();}catch(e){setError(String(e));}finally{setBusy(false);}}
 return <section className="ops"><div className="ops-title"><div><p className="eyebrow">A LITTLE FOLLOW-UP GOES A LONG WAY</p><h2>Follow-up planner</h2><p>Plan a personal message, then open WhatsApp to review and send it yourself. Nothing is sent automatically.</p></div></div>{error&&<p className="ops-error" role="alert">{error}</p>}<form onSubmit={save} className="booking-card"><div className="booking-fields"><label>Customer<select name="leadId" required><option value="">Choose a lead</option>{leads.map(l=><option key={l.id} value={l.id}>{l.name} · {l.phone}</option>)}</select></label><label>Due date (IST)<input name="date" type="datetime-local" required/></label></div><label className="ops-label">Personal message<textarea name="text" required maxLength={2000} rows={3} placeholder="Hi! Following up on your enquiry. How can we help?"/></label><button disabled={busy||!leads.length} className="ops-button filled">{busy?'Saving…':'Schedule follow-up'}</button>{!leads.length&&<p className="small">Capture a lead through your customer assistant first.</p>}</form>{list.map(f=>{const l=leads.find(l=>l.id===f.leadId);const digits=l?.phone.replace(/\D/g,'')||'';return <article className="booking-card" key={f.id}><div className="booking-head"><strong>{l?.name||'Customer'}</strong><span className="status">{f.status==='done'?'Completed':new Date(f.dueAt)<new Date()?'Due now':'Scheduled'}</span></div><p className="request-text">{f.text}</p><p className="small">{new Date(f.dueAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST</p><div className="ops-actions"><a target="_blank" rel="noreferrer" className="ops-button filled" href={`https://wa.me/${digits.length===10?'91'+digits:digits}?text=${encodeURIComponent(f.text)}`}>Review in WhatsApp <ArrowUpRight size={14}/></a><button className="ops-button" onClick={async()=>{try{await request('/api/followups',{businessId,id:f.id,status:f.status==='done'?'pending':'done'},'PATCH');await load();}catch(e){setError(String(e));}}}>{f.status==='done'?'Reopen':'Mark completed'}</button></div></article>;})}</section>;
}
type BusinessSettingsData = { id:string; name:string; city?:string; timings?:string; contact?:string; address?:string };

export function BusinessSettings({businessId,initialBusiness,onSaved}:{businessId:string;initialBusiness?:BusinessSettingsData;onSaved?:()=>void|Promise<void>}){
 const [business,setBusiness]=useState<BusinessSettingsData|null>(initialBusiness?.id===businessId ? initialBusiness : null);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);

 async function reload(){
  setError('');
  try {
   const result=await request('/api/business');
   const found=(result.businesses as BusinessSettingsData[]).find(b=>b.id===businessId);
   if (!found) throw new Error('This business is not available in your workspace.');
   setBusiness(found);
  } catch {
   setError('Business settings could not be loaded. Check your connection and try again.');
  }
 }

 useEffect(()=>{
  if(initialBusiness?.id===businessId){
   setBusiness(initialBusiness);
   setError('');
   return;
  }
  // Only fetch when the parent dashboard does not already have the selected business.
  void reload();
 },[businessId,initialBusiness]);

 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setNotice('');setBusy(true);
  try {
   const result=await request('/api/business',{businessId,...Object.fromEntries(new FormData(e.currentTarget))},'PATCH');
   setBusiness(result.business);
   setNotice('Business details saved. Your customer assistant now uses these details.');
   void onSaved?.();
  }catch(e){setError(e instanceof Error?e.message:'Unable to save business details.');}
  finally{setBusy(false);}
 }

 return <section className="ops">
  <div className="ops-title"><div><p className="eyebrow">THE DETAILS MAKE IT YOURS</p><h2>Business settings</h2><p>Keep the information your customers see accurate and up to date.</p></div></div>
  {error&&<div className="ops-error" role="alert"><p>{error}</p><button className="ops-button" type="button" onClick={()=>void reload()}>Retry loading</button></div>}
  {notice&&<p role="status" className="request-text">{notice}</p>}
  {business?<form key={business.id} onSubmit={save} className="booking-card">
   <div className="booking-fields">{([
    ['name','Business name'],
    ['city','City'],
    ['timings','Opening hours'],
    ['contact','Business phone'],
    ['address','Business address (optional)']
   ] as const).map(([key,label])=><label key={key}>{label}<input name={key} defaultValue={business[key]??''} maxLength={250} required={key!=='address'}/></label>)}</div>
   <button className="ops-button filled" disabled={busy}>{busy?'Saving…':'Save details'}</button>
  </form>:!error&&<p className="request-text">Loading business settings…</p>}
 </section>;
}
