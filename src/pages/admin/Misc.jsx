import {useState} from 'react'
import {Download} from 'lucide-react'
import {Page,Card,Kpi,Badge,Table,Modal,Bar,inp,btn2} from '../../components/ui/ui'
import {Donut,Bars,Lines} from '../../components/charts/Charts'
import {useApp} from '../../context/AppContext'
import {DEPTS,CATS} from '../../data/constants'
import {countBy,isDone,techStats,slaState,countdown,fmt,SLA_H} from '../../utils/helpers'
import {pingAI,aiState,chatReply} from '../../services/aiService'
export function Conversations(){
 const {conversations}=useApp(),[sel,setSel]=useState(null),[q,setQ]=useState('');const c=conversations.find(x=>x.id===sel)
 const rows=conversations.filter(x=>(x.empName+x.id+x.ticketId).toLowerCase().includes(q.toLowerCase()))
 return (<Page title="Conversations" sub="Employee conversations with the AI agent"><Card><input className={inp+' mb-3 w-56'} placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/>
  <Table onRow={i=>setSel(rows[i].id)} cols={['Employee','Conversation','Ticket','Date','Sentiment','Category','AI summary']} rows={rows.map(x=>[x.empName,x.id,x.ticketId,fmt(x.date),<Badge v={x.sentiment}/>,x.category,<span className="block max-w-xs truncate">{x.summary}</span>])}/></Card>
  {c&&<Modal wide title={`${c.id} · ${c.empName}`} onClose={()=>setSel(null)}><div className="grid md:grid-cols-2 gap-5 text-sm"><div className="space-y-2">{c.messages.map((m,i)=><div key={i} className={`p-2 rounded-lg max-w-[85%] ${m.from==='user'?'bg-navy text-white ml-auto':'bg-slate-100'}`}>{m.text}</div>)}</div>
   <div className="space-y-2 bg-navy-50 rounded-md p-3"><div className="font-medium text-navy">AI analysis</div><Badge v={c.sentiment}/><p>{c.summary}</p><p><b>Key phrases:</b> {c.keyPhrases.join(', ')}</p><p><b>Recommended:</b> {c.action}</p></div></div></Modal>}</Page>)}
export function Technicians(){
 const {users,tickets}=useApp(),techs=users.filter(u=>u.role==='Technician'),st=techs.map(t=>({t,...techStats(t,tickets)})),[sel,setSel]=useState(null),s=st.find(x=>x.t.id===sel)
 return (<Page title="Technician Management"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="Total technicians" value={techs.length}/><Kpi label="Available" value={st.filter(x=>x.availability==='Available').length}/><Kpi label="Busy" value={st.filter(x=>x.availability==='Busy').length}/><Kpi label="Avg workload" value={(techs.length?st.reduce((a,x)=>a+x.active,0)/techs.length:0).toFixed(1)}/></div>
  <Card><Table onRow={i=>setSel(st[i].t.id)} cols={['Name','ID','Specialization','Active','Resolved','Availability','Performance']} rows={st.map(x=>[x.t.name,x.t.id,x.t.spec,x.active,x.resolved,<Badge v={x.availability}/>,<div className="w-24"><Bar v={x.performance}/></div>])}/></Card>
  {s&&<Modal wide title={s.t.name} onClose={()=>setSel(null)}><div className="grid md:grid-cols-2 gap-4"><Bars data={countBy(tickets.filter(t=>t.tech===s.t.id),t=>t.status)}/><Table cols={['Ticket','Status']} rows={tickets.filter(t=>t.tech===s.t.id).slice(0,8).map(t=>[t.id,<Badge v={t.status}/>])}/></div></Modal>}</Page>)}
export const Departments=()=>{const {tickets,users}=useApp();return (<Page title="Departments"><Card><Table cols={['Department','Employees','Tickets','Open','Critical']} rows={DEPTS.map(d=>[d,users.filter(u=>u.dept===d).length,tickets.filter(t=>t.dept===d).length,tickets.filter(t=>t.dept===d&&!isDone(t)).length,tickets.filter(t=>t.dept===d&&t.priority==='Critical').length])}/></Card></Page>)}
export const SLA=()=>{const {tickets}=useApp(),live=tickets.filter(t=>!isDone(t)),done=tickets.filter(isDone)
 const risk=live.filter(t=>slaState(t)==='At Risk').sort((a,b)=>SLA_H[a.priority]-SLA_H[b.priority])
 return (<Page title="SLA Monitoring" sub="Targets: Critical 4h · High 8h · Medium 24h · Low 72h"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="Within SLA" value={live.filter(t=>slaState(t)==='Within SLA').length}/><Kpi label="Approaching deadline" value={risk.length}/><Kpi label="Breached" value={live.filter(t=>slaState(t)==='Breached').length}/><Kpi label="Resolved tickets" value={done.length}/></div>
  <Card title="Approaching deadline"><Table cols={['Ticket','Issue','Priority','Countdown']} rows={risk.map(t=>[t.id,t.title,<Badge v={t.priority}/>,<span className="text-amber-700 font-medium">{countdown(t)}</span>])} empty="No tickets near deadline"/></Card></Page>)}
const ART=CATS.flatMap(c=>[`Troubleshooting ${c.toLowerCase()} problems`,`${c}: first steps before you raise a ticket`].map(t=>({t,c,b:`Step-by-step guidance for ${c.toLowerCase()} issues: verify basics, restart, check status page, then contact IT.`})))
export function KnowledgeBase(){const [q,setQ]=useState(''),[c,setC]=useState(''),[a,setA]=useState(null)
 const rows=ART.filter(x=>x.t.toLowerCase().includes(q.toLowerCase())&&(!c||x.c===c))
 return (<Page title="Knowledge Base"><div className="flex gap-2"><input className={inp+' w-64'} placeholder="Search articles" value={q} onChange={e=>setQ(e.target.value)}/><select className={inp} value={c} onChange={e=>setC(e.target.value)}><option value="">All categories</option>{CATS.map(x=><option key={x}>{x}</option>)}</select></div>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{rows.map(x=><button key={x.t} onClick={()=>setA(x)} className="text-left bg-white border rounded-lg p-4 hover:border-navy"><div className="text-xs text-blue-600">{x.c}</div><div className="font-medium text-sm mt-1">{x.t}</div></button>)}</div>
  {a&&<Modal title={a.t} onClose={()=>setA(null)}><p className="text-sm">{a.b}</p></Modal>}</Page>)}
const csvCell=v=>`"${String(v??'').replace(/"/g,'""')}"`
const hoursToDone=t=>{const h=[...t.history].reverse().find(x=>['Resolved','Closed'].includes(x.s));return h?(new Date(h.t)-new Date(t.created))/36e5:null}
export const Reports=()=>{const {tickets,conversations,users}=useApp(),[range,setRange]=useState('30')
 const inRange=range==='all'?tickets:tickets.filter(t=>Date.now()-new Date(t.created)<+range*864e5)
 const convs=range==='all'?conversations:conversations.filter(c=>c.daysAgo<+range)
 const now=new Date(),month=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);return {name:d.toLocaleDateString('en-IN',{month:'short',year:'2-digit'}),value:tickets.filter(t=>{const c=new Date(t.created);return c.getFullYear()===d.getFullYear()&&c.getMonth()===d.getMonth()}).length}})
 const resolution=['Critical','High','Medium','Low'].map(p=>{const hs=inRange.filter(t=>t.priority===p).map(hoursToDone).filter(h=>h!=null);return {name:p,value:hs.length?+(hs.reduce((a,b)=>a+b,0)/hs.length).toFixed(1):0}})
 const exportCsv=()=>{const head=['ID','Title','Employee','Department','Category','Priority','AI score','Status','Technician','Sentiment','SLA','Created']
  const rows=inRange.map(t=>[t.id,t.title,t.empName,t.dept,t.category,t.priority,t.score,t.status,users.find(u=>u.id===t.tech)?.name||'Unassigned',t.sentiment,slaState(t),new Date(t.created).toISOString()])
  const blob=new Blob([[head,...rows].map(r=>r.map(csvCell).join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a')
  a.href=URL.createObjectURL(blob);a.download=`helpdesk-tickets-${range==='all'?'all':range+'d'}.csv`;a.click();URL.revokeObjectURL(a.href)}
 return (<Page title="Reports & Analytics" sub={`${inRange.length} tickets in range`} right={<div className="flex gap-2"><select className={inp} value={range} onChange={e=>setRange(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select><button className={btn2} onClick={exportCsv} disabled={!inRange.length}><Download size={14}/>Export CSV</button></div>}>
  <div className="grid lg:grid-cols-3 gap-4"><Card title="Tickets per month"><Lines data={month}/></Card><Card title="Issues by department"><Bars horizontal data={countBy(inRange,t=>t.dept)}/></Card><Card title="Sentiment"><Donut data={countBy(convs,c=>c.sentiment)}/></Card>
  <Card title="Priority distribution"><Donut data={countBy(inRange,t=>t.priority)}/></Card><Card title="SLA compliance"><Donut data={countBy(inRange,t=>slaState(t))}/></Card><Card title="Avg. resolution time (hours)"><Bars data={resolution}/></Card></div></Page>)}
const Row=({k,children})=><div className="flex flex-wrap items-start gap-2 py-2 border-b border-black/15 last:border-0 text-sm"><div className="w-44 font-bold shrink-0">{k}</div><div className="min-w-0 break-words">{children}</div></div>
export const SettingsPage=()=>{const {tickets,users,conversations,me,refresh}=useApp(),[ping,setPing]=useState(null),[live,setLive]=useState(null),[busy,setBusy]=useState(false)
 const host=(()=>{try{return new URL(import.meta.env.VITE_SUPABASE_URL).host}catch{return 'not set'}})()
 const test=async()=>{setBusy(true);setLive(null);const p=await pingAI();setPing(p)
  const r=await chatReply({message:'Reply with the single word: ready',history:[],user:me,tickets:[]});setLive({src:r.src,text:r.text,error:aiState.error});setBusy(false)}
 return (<Page title="Settings" sub="Connection status for Supabase and Gemini"><Card title="Connections">
  <Row k="Supabase project">{host}</Row><Row k="Data loaded">{tickets.length} tickets · {users.length} users · {conversations.length} conversations <button className="text-blue-600 ml-2" onClick={refresh}>Reload</button></Row>
  <Row k="Gemini (Edge Function)">{!ping?<span className="text-slate-500">Not tested yet</span>:ping.ok?<span>Function deployed · API key {ping.keyConfigured?'is set':<b className="text-red-700">is NOT set (run: supabase secrets set GEMINI_API_KEY=...)</b>} · models: {ping.models.join(', ')}</span>:<span className="text-red-700">Function not reachable: {ping.error}</span>}</Row>
  <Row k="Live Gemini test">{!live?<span className="text-slate-500">Press the button to send a real request</span>:live.src==='gemini'?<span className="text-emerald-700 font-bold">Working. Gemini replied: “{live.text}”</span>:<span className="text-red-700">Gemini not used, the app is running in offline mode. Reason: {live.error}</span>}</Row>
  <div className="pt-3"><button className={btn2} onClick={test} disabled={busy}>{busy?'Testing…':'Test AI connection'}</button></div></Card>
  <Card title="If the test fails"><ol className="list-decimal ml-5 text-sm space-y-1"><li>Deploy the function: <code>npx supabase functions deploy ai --no-verify-jwt</code></li><li>Store the key on the server: <code>npx supabase secrets set GEMINI_API_KEY=your_key</code></li><li>Run <code>db/patch_attachments.sql</code> once in the Supabase SQL editor if screenshot uploads fail.</li></ol><p className="text-xs text-black/60 mt-2">The Gemini key is never placed in this app or in any .env file that the browser can read.</p></Card></Page>)}
