import {useState} from 'react'
import {Sparkles,Send} from 'lucide-react'
import {Page,Card,Kpi,Badge,Table,Modal,Bar,PriorityScore,inp,btn} from '../../components/ui/ui'
import {Donut,Lines} from '../../components/charts/Charts'
import {useApp} from '../../context/AppContext'
import {askData} from '../../services/aiService'
import {useTicketSummary} from '../../hooks'
import {countBy,isDone,slaState,countdown,fmt} from '../../utils/helpers'
const SENT=['Positive','Neutral','Negative','Frustrated']
export default function AIIntelligence(){
 const {tickets,users,conversations}=useApp(),[sel,setSel]=useState(null),[tid,setTid]=useState(null),[q,setQ]=useState(''),[a,setA]=useState(''),[asking,setAsking]=useState(false)
 const top=[...tickets].filter(t=>!isDone(t)).sort((x,y)=>y.score-x.score),ticket=tickets.find(t=>t.id===tid)||top[0],sm=useTicketSummary(ticket),ai=sm.data
 const doAsk=async()=>{if(!q.trim()||asking)return;setAsking(true);setA('');try{const r=await askData(q,{tickets,users,conversations});setA(r.answer+(r.src==='local'?' (offline rules)':''))}catch(e){setA('Could not answer: '+e.message)}finally{setAsking(false)}}
 const trend=[3,2,1,0].map(w=>({name:w?`${w}w ago`:'This week',...Object.fromEntries(SENT.map(s=>[s,conversations.filter(c=>Math.floor(c.daysAgo/7)===w&&c.sentiment===s).length]))}))
 const esc=top.filter(t=>['Breached','At Risk'].includes(slaState(t))||t.score>=80).slice(0,8)
 const net=tickets.filter(t=>t.category==='Network').length,dept=countBy(tickets,t=>t.dept).sort((x,y)=>y.value-x.value)[0]||{name:'No department',value:0}
 const ins=[`${net} network tickets logged; the largest category cluster to monitor.`,`${tickets.filter(t=>t.category==='Account Access'&&!isDone(t)).length} employees have unresolved login or access problems.`,`${dept.name} has the highest ticket volume (${dept.value}).`,`${top.filter(t=>t.priority==='Critical').length} critical tickets require immediate attention.`,`${tickets.filter(t=>t.category==='Hardware').length} hardware tickets suggest ageing devices.`]
 const c=sel&&conversations.find(x=>x.id===sel)
 return (<Page title="AI Intelligence Center" sub="Sentiment, summaries, priority scoring and escalation risk.">
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{SENT.map(s=><Kpi key={s} label={`${s} conversations`} value={conversations.filter(x=>x.sentiment===s).length}/>)}</div>
  <div className="grid lg:grid-cols-3 gap-4"><Card title="Sentiment distribution"><Donut data={countBy(conversations,x=>x.sentiment)}/></Card><Card title="Sentiment trend" className="lg:col-span-2"><Lines data={trend} keys={SENT}/></Card></div>
  <Card title="AI insights"><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{ins.map(i=><div key={i} className="flex gap-2 text-sm bg-navy-50 rounded-md p-3"><Sparkles size={15} className="text-navy shrink-0 mt-0.5"/>{i}</div>)}
   <div className="bg-white border rounded-md p-3 text-sm space-y-2"><div className="font-medium">Ask your IT data</div><div className="flex gap-2"><input className={inp+' flex-1 min-w-0'} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doAsk()} placeholder="Which department is busiest?"/><button className={btn} disabled={asking} onClick={doAsk}><Send size={14}/></button></div>{asking&&<p className="text-slate-500">Thinking…</p>}{a&&<p className="text-slate-600">{a}</p>}</div></div></Card>
  <Card title="Conversation analysis"><Table cols={['Employee','Ticket','Department','Sentiment','Frustration','Date','AI summary','']} onRow={i=>setSel(conversations[i].id)}
   rows={conversations.slice(0,12).map(x=>[x.empName,x.ticketId,x.dept,<Badge v={x.sentiment}/>,<div className="w-20"><Bar v={x.frustration} color={x.frustration>60?'bg-red-500':'bg-blue-500'}/></div>,fmt(x.date),<span className="block max-w-xs truncate">{x.summary}</span>,<span className="text-blue-600">View</span>])}/></Card>
  <div className="grid lg:grid-cols-2 gap-4">
   <Card title="Ticket intelligence" right={ticket&&<select className={inp} value={ticket.id} onChange={e=>setTid(e.target.value)}>{top.slice(0,10).map(t=><option key={t.id} value={t.id}>{t.id} · {t.title}</option>)}</select>}>
    {!ticket?<p className="text-sm text-slate-500">No unresolved tickets.</p>:<div className="text-sm space-y-2"><p><b>Original issue:</b> {ticket.desc}</p>
     {sm.loading||!ai?<p className="text-slate-500">Generating AI summary…</p>:<><p><b>AI summary{ai.src==='gemini'?' (Gemini)':' (offline rules)'}:</b> {ai.summary}</p><p><b>Key findings:</b> {ai.findings.join('; ')}</p><p><b>Tried:</b> {ai.tried.join(', ')}</p><p><b>Impact:</b> {ai.impact}</p><p><b>Next steps:</b> {ai.next.join('; ')}</p></>}</div>}</Card>
   <Card title="Priority score">{ticket?<PriorityScore t={ticket}/>:<p className="text-sm text-slate-500">No unresolved tickets.</p>}</Card></div>
  <Card title="Escalation risk"><Table cols={['Ticket','Employee','Issue','Status','SLA','Risk','Recommended action']} rows={esc.map(t=>[t.id,t.empName,<span className="block max-w-[200px] truncate">{t.title}</span>,<Badge v={t.status}/>,countdown(t),<Badge v={slaState(t)==='Breached'?'Critical':'High'}/>,slaState(t)==='Breached'?'Escalate to Tier 2 now':'Assign senior technician'])}/></Card>
  {c&&<Modal wide title={`${c.id} · ${c.empName}`} onClose={()=>setSel(null)}><div className="grid md:grid-cols-2 gap-5 text-sm"><div className="space-y-2">{c.messages.map((m,i)=><div key={i} className={`p-2 rounded-lg max-w-[85%] ${m.from==='user'?'bg-navy text-white ml-auto':'bg-slate-100'}`}>{m.text}</div>)}</div>
   <div className="space-y-3"><div className="flex gap-2"><Badge v={c.sentiment}/><Badge v={c.urgency}/></div><p><b>Summary:</b> {c.summary}</p><p><b>Key phrases:</b> {c.keyPhrases.join(', ')}</p><p><b>Frustration:</b> {c.frustration}%</p><p><b>Recommended action:</b> {c.action}</p></div></div></Modal>}
 </Page>)}
