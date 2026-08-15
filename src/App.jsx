import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {useAuth} from './lib/auth.jsx';
import {supabase} from './lib/supabase.js';
import {deleteExpense,insertExpense,updateExpense,listUserData,subscribeToChanges} from './lib/data.js';
import Login from './components/Login.jsx';
import ExpenseModal from './components/ExpenseModal.jsx';
import NetWorth from './components/NetWorth.jsx';
import {Budgets,Setup,Planning,Reports} from './components/Management.jsx';

const money=n=>`₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
const monthKey=v=>String(v||'').slice(0,7);
const currentMonth=()=>new Date().toISOString().slice(0,7);
const monthLabel=m=>new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN',{month:'long',year:'numeric'});

function DailyChart({expenses,month}){
  const daysInMonth=new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
  const map=useMemo(()=>expenses.filter(x=>monthKey(x.date)===month).reduce((o,x)=>{o[x.date]=(o[x.date]||0)+Number(x.amount||0);return o},{}),[expenses,month]);
  const values=useMemo(()=>Array.from({length:daysInMonth},(_,i)=>{const day=String(i+1).padStart(2,'0');return {day,date:`${month}-${day}`,value:map[`${month}-${day}`]||0}}),[daysInMonth,map,month]);
  const max=Math.max(...values.map(x=>x.value),0);
  const today=new Date().toISOString().slice(0,10);
  if(!values.some(x=>x.value)) return <div className="chartEmpty">No spending recorded for {monthLabel(month)} yet.</div>;
  return <div className="chart" aria-label={`Daily spending for ${monthLabel(month)}`}>
    {values.map(x=>{const height=max?Math.max(x.value?4:0,x.value/max*100):0;return <div className={`barCol ${x.date===today?'isToday':''}`} key={x.date} title={`${x.date} • ${money(x.value)}`}><div className="bar" style={{height:`${height}%`}}/><span>{x.day}</span>{x.value>0&&<em>{money(x.value)}</em>}</div>})}
  </div>;
}

function CategoryBreakdown({cats,total}){
  const rows=cats.slice(0,7),max=rows[0]?.[1]||1;
  return rows.length?<div className="cats">{rows.map(([name,value])=><div className="cat" key={name}><div>{name}<div className="line"><div className="fill" style={{width:`${value/max*100}%`}}/></div></div><b>{money(value)}</b></div>)}</div>:<div className="empty">No categories in this view.</div>;
}

function RecentExpenses({rows,onEdit,onDelete,onAdd}){
  return <section className="card tableCard"><div className="tableHead"><div><h3 style={{margin:0}}>Recent expenses</h3><small className="sub">Showing {rows.length} of the selected view</small></div><div className="actions"><button className="btn primary" onClick={onAdd}>＋ Add expense</button></div></div><div className="tableWrap"><table><thead><tr><th>Date</th><th>Expense</th><th>Category</th><th>Amount</th><th>Paid via</th><th>Paid by</th><th>Actions</th></tr></thead><tbody>{rows.length?rows.slice(0,100).map(x=><tr key={x.id}><td>{x.date}</td><td><b>{x.detail}</b>{x.notes&&<small>{x.notes}</small>}</td><td><span className="pill">{x.type}</span></td><td className="amount">{money(x.amount)}</td><td>{x.paid_via||x.paidvia||'—'}</td><td>{x.paid_by||x.paidby||'—'}</td><td><button className="rowbtn" onClick={()=>onEdit(x)}>Edit</button><button className="rowbtn del" onClick={()=>onDelete(x.id)}>Delete</button></td></tr>):<tr><td colSpan="7" className="empty">No expenses in this view.<br/><button className="btn primary" style={{marginTop:10}} onClick={onAdd}>＋ Add expense</button></td></tr>}</tbody></table></div></section>;
}

function Dashboard({data,onAdd,onDelete,onEdit}){
  const [view,setView]=useState('home');
  const [month,setMonth]=useState(currentMonth());
  const [cat,setCat]=useState('All');
  const [pay,setPay]=useState('All');
  const [search,setSearch]=useState('');
  const months=useMemo(()=>Array.from(new Set(data.expenses.map(x=>monthKey(x.date)).filter(Boolean))).sort().reverse(),[data.expenses]);
  useEffect(()=>{if(months.length&&!months.includes(month))setMonth(months[0])},[months,month]);
  const filtered=useMemo(()=>data.expenses.filter(x=>monthKey(x.date)===month&&(cat==='All'||x.type===cat)&&(pay==='All'||(x.paid_via||x.paidvia)===pay)&&(!search||[x.detail,x.type,x.paid_via,x.paidvia,x.paid_by,x.paidby,x.notes].join(' ').toLowerCase().includes(search.toLowerCase()))),[data.expenses,month,cat,pay,search]);
  const total=filtered.reduce((s,x)=>s+Number(x.amount||0),0);
  const cats=Object.entries(filtered.reduce((o,x)=>(o[x.type]=(o[x.type]||0)+Number(x.amount||0),o),{})).sort((a,b)=>b[1]-a[1]);
  const largest=Math.max(0,...filtered.map(x=>Number(x.amount||0)));
  const overall=data.budgets.find(b=>monthKey(b.month)===month&&!b.category_id);
  const monthSpent=data.expenses.filter(x=>monthKey(x.date)===month).reduce((s,x)=>s+Number(x.amount||0),0);
  const budgetPct=overall?Math.min(100,monthSpent/Math.max(Number(overall.amount),1)*100):0;
  const lastMonth=useMemo(()=>{const d=new Date(`${month}-01T00:00:00`);d.setMonth(d.getMonth()-1);return d.toISOString().slice(0,7)},[month]);
  const lastTotal=data.expenses.filter(x=>monthKey(x.date)===lastMonth).reduce((s,x)=>s+Number(x.amount||0),0);
  const change=lastTotal?((monthSpent-lastTotal)/lastTotal*100):null;
  const reset=()=>{setMonth(currentMonth());setCat('All');setPay('All');setSearch('')};
  const nav=[['home','⌂','Home'],['expenses','▤','Expenses'],['budgets','◫','Budgets'],['wealth','◈','Wealth'],['planning','◎','Planning'],['reports','▥','Reports'],['setup','⚙','Setup']];
  return <div className="app"><header className="top"><div className="brand"><div className="logo">✦</div><div><h1>Pulse</h1><p>Private money command center</p></div></div><div className="actions"><span className="badge">● Live sync</span><button className="btn primary" onClick={onAdd}>＋ Add expense</button><button className="btn" onClick={()=>supabase.auth.signOut()}>Sign out</button></div></header>
    <div className="navTabs">{nav.map(([id,icon,label])=><button key={id} className={`tab ${view===id?'active':''}`} onClick={()=>setView(id)}>{icon} {label}</button>)}</div>
    {view==='home'&&<><section className="hero"><div className="heroGrid"><div><div className="eyebrow">PULSE OVERVIEW</div><h2>Track today.<br/>Understand this month.</h2><p>Track today. Understand this month. Stay in control.</p><div className="quick"><button onClick={onAdd}>＋ Quick expense</button><button onClick={()=>{setSearch('Bike petrol');setView('expenses')}}>• Bike petrol</button><button onClick={()=>{setSearch('Car petrol');setView('expenses')}}>• Car petrol</button><button onClick={()=>{setSearch('EB Bill');setView('expenses')}}>• EB Bill</button></div></div><div><div className="label">This month</div><div className="heroTotal">{money(total)}</div><div className="delta">{filtered.length} transaction{filtered.length===1?'':'s'} in selected view</div></div></div><div className="filters"><select className="control" value={month} onChange={e=>setMonth(e.target.value)}>{months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}</select><select className="control" value={cat} onChange={e=>setCat(e.target.value)}><option>All categories</option>{data.categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select><select className="control" value={pay} onChange={e=>setPay(e.target.value)}><option>All payment methods</option>{data.payments.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select><input className="control" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search expenses..."/><button className="btn" onClick={reset}>Reset</button></div></section>
      <div className="stats"><Stat label="Transactions" value={filtered.length} sub="selected view"/><Stat label="Average" value={money(filtered.length?total/filtered.length:0)} sub="per transaction"/><Stat label="Largest" value={money(largest)} sub="single expense"/><Stat label="Top category" value={cats[0]?.[0]||'—'} sub={money(cats[0]?.[1]||0)}/></div>
      <div className="grid2"><section className="card cardPad"><h3>Spending pulse</h3><DailyChart expenses={filtered} month={month}/></section><section className="card cardPad"><h3>Category breakdown</h3><CategoryBreakdown cats={cats} total={total}/></section></div>
      <div className="grid2"><section className="card cardPad"><h3>Budget health</h3>{overall?<><div className="budgetTop"><strong>{money(monthSpent)} spent</strong><strong>{money(overall.amount)}</strong></div><div className="progress"><div style={{width:`${budgetPct}%`}}/></div><p className="sub">{money(Math.max(0,Number(overall.amount)-monthSpent))} remaining • {budgetPct.toFixed(0)}% used</p></>:<div className="empty">No overall budget for {monthLabel(month)}.<br/><button className="btn primary" style={{marginTop:10}} onClick={()=>setView('budgets')}>Set one</button></div>}</section><section className="card cardPad"><h3>Pulse insights</h3><div className="insight"><strong>{change===null?'✨ Build your first baseline':`${change>=0?'📈':'📉'} ${Math.abs(change).toFixed(1)}% ${change>=0?'higher':'lower'} than last month`}</strong><small>{change===null?'Keep logging expenses and Pulse will compare your spending over time.':`${money(monthSpent)} this month vs ${money(lastTotal)} last month.`}</small></div>{cats[0]&&<div className="insight"><strong>🎯 {cats[0][0]} is your top category</strong><small>{money(cats[0][1])} in the selected view.</small></div>}</section></div>
      <RecentExpenses rows={[...filtered].sort((a,b)=>String(b.date).localeCompare(String(a.date)))} onEdit={onEdit} onDelete={onDelete} onAdd={onAdd}/></>}
    {view==='expenses'&&<section className="card tableCard"><div className="tableHead"><div><h3>Expenses</h3><small>{filtered.length} shown · {data.expenses.length} total</small></div><div className="actions"><input className="control" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search expenses…"/><select className="control" value={cat} onChange={e=>setCat(e.target.value)}><option value="All">All categories</option>{data.categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div></div><div className="tableWrap"><table><thead><tr><th>Date</th><th>Expense</th><th>Category</th><th>Amount</th><th>Paid via</th><th>Paid by</th><th>Actions</th></tr></thead><tbody>{[...filtered].sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(x=><tr key={x.id}><td>{x.date}</td><td>{x.detail}<small>{x.notes||''}</small></td><td><span className="pill">{x.type}</span></td><td className="amount">{money(x.amount)}</td><td>{x.paid_via||x.paidvia||'—'}</td><td>{x.paid_by||x.paidby||'—'}</td><td><button className="rowbtn" onClick={()=>onEdit(x)}>Edit</button><button className="rowbtn del" onClick={()=>onDelete(x.id)}>Delete</button></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty">No matching expenses.</div>}</div></section>}
    {view==='budgets'&&<Budgets data={data} userId={data.userId} onReload={data.reload}/>} {view==='wealth'&&<NetWorth data={data} userId={data.userId} onReload={data.reload}/>} {view==='planning'&&<Planning data={data} userId={data.userId} onReload={data.reload}/>} {view==='reports'&&<Reports data={data}/>} {view==='setup'&&<Setup data={data} userId={data.userId} onReload={data.reload}/>}<nav className="bottomNav">{nav.slice(0,5).map(([id,icon,label])=><button className={view===id?'active':''} key={id} onClick={()=>setView(id)}>{icon}<br/>{label}</button>)}</nav></div>;
}
function Stat({label,value,sub}){return <div className="card stat"><div className="label">{label}</div><div className="num">{value}</div><div className="sub">{sub}</div></div>}

export default function App(){const {session,loading}=useAuth();const [data,setData]=useState({expenses:[],categories:[],payments:[],payers:[],budgets:[],goals:[],networth:[],recurring:[],reminders:[]});const [modal,setModal]=useState(false),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false);const load=useCallback(async()=>{if(!session)return;setBusy(true);try{const next=await listUserData(session.user.id);setData({...next,userId:session.user.id,reload:load})}catch(e){alert(`Pulse could not load cloud data: ${e.message}`)}finally{setBusy(false)}},[session]);useEffect(()=>{load()},[load]);useEffect(()=>{if(!session)return subscribeToChanges(session.user.id,load)},[session,load]);if(loading)return <div className="loading">Loading Pulse…</div>;if(!session)return <Login/>;async function save(form){try{if(editing)await updateExpense(session.user.id,editing.id,form);else await insertExpense(session.user.id,form);setModal(false);setEditing(null);await load()}catch(e){alert(`Could not save expense: ${e.message}`)}}async function del(id){if(!confirm('Delete this expense?'))return;try{await deleteExpense(session.user.id,id);await load()}catch(e){alert(`Could not delete expense: ${e.message}`)}}return <><Dashboard data={data} onAdd={()=>{setEditing(null);setModal(true)}} onEdit={x=>{setEditing(x);setModal(true)}} onDelete={del}/><ExpenseModal open={modal} initial={editing} onClose={()=>{setModal(false);setEditing(null)}} onSave={save} categories={data.categories} payments={data.payments} payers={data.payers}/>{busy&&<div className="syncing">Syncing…</div>}</>}
