import React,{useState} from 'react';
import {supabase} from '../lib/supabase.js';
const money=n=>`₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
const fields=['bank','investments','gold','property','other_assets','loans','other_liabilities'];
const assets=['bank','investments','gold','property','other_assets'];
export default function NetWorth({data,userId,onReload}){
 const latest=data.networth[0]||{};const [month,setMonth]=useState(latest.month||new Date().toISOString().slice(0,7));
 const [form,setForm]=useState(()=>Object.fromEntries(fields.map(k=>[k,latest[k]??''])));
 const set=(k,v)=>setForm(x=>({...x,[k]:v}));
 const totalAssets=assets.reduce((s,k)=>s+Number(form[k]||0),0);const liabilities=Number(form.loans||0)+Number(form.other_liabilities||0);
 async function save(){const payload={user_id:userId,month,...Object.fromEntries(fields.map(k=>[k,Number(form[k]||0)]))};const {error}=await supabase.from('pulse_net_worth').upsert(payload,{onConflict:'user_id,month'});if(error)return alert(error.message);await onReload()}
 async function del(id){if(!confirm('Delete this net worth snapshot?'))return;const {error}=await supabase.from('pulse_net_worth').delete().eq('id',id).eq('user_id',userId);if(error)return alert(error.message);await onReload()}
 return <section className="card cardPad"><div className="sectionHead"><div><h3>Net worth</h3><small>Monthly assets and liabilities snapshots</small></div></div><div className="form"><label>Month<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label>{fields.map(k=><label key={k}>{k.replaceAll('_',' ')}<input type="number" min="0" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder="0"/></label>)}</div><div className="stats"><div className="card stat"><div className="label">Assets</div><div className="num">{money(totalAssets)}</div></div><div className="card stat"><div className="label">Liabilities</div><div className="num">{money(liabilities)}</div></div><div className="card stat"><div className="label">Net worth</div><div className="num">{money(totalAssets-liabilities)}</div></div></div><button className="btn primary" onClick={save}>Save {month} snapshot</button><div className="list">{data.networth.map(x=><div className="listRow" key={x.id}><div><b>{x.month}</b><small>Net worth {money(Number(x.bank||0)+Number(x.investments||0)+Number(x.gold||0)+Number(x.property||0)+Number(x.other_assets||0)-Number(x.loans||0)-Number(x.other_liabilities||0))}</small></div><button className="rowbtn del" onClick={()=>del(x.id)}>Delete</button></div>)}</div></section>}
