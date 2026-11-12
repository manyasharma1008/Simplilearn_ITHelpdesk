import {useState,useRef,useEffect} from 'react'
import {Send,Bot,CheckCircle2,Paperclip,RotateCcw} from 'lucide-react'
import {Page,Card,Kpi,Badge,Table,inp,btn,btn2} from '../../components/ui/ui'
import {useApp} from '../../context/AppContext'
import {CATS,DEPTS,PRIORITIES} from '../../data/constants'
import {guessCategory} from '../../services/mockAIService'
import {chatReply} from '../../services/aiService'
import {isDone,fmt} from '../../utils/helpers'
export function EmployeeDashboard(){const {tickets,me}=useApp(),mine=tickets.filter(t=>t.empId===me.id)
 return (<Page title={`Welcome, ${me.name.split(' ')[0]}`} sub="Your IT support at a glance"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="My tickets" value={mine.length}/><Kpi label="Open" value={mine.filter(t=>['Open','Assigned','Reopened'].includes(t.status)).length}/><Kpi label="In progress" value={mine.filter(t=>t.status==='In Progress').length}/><Kpi label="Resolved" value={mine.filter(isDone).length}/></div>
  <Card title="Recent tickets"><Table cols={['ID','Issue','Status','Created']} rows={mine.slice(0,6).map(t=>[t.id,t.title,<Badge v={t.status}/>,fmt(t.created)])}/></Card></Page>)}
const SUG=['My laptop is not working.','I cannot connect to Wi-Fi.','Help me reset my password.','Check my ticket status.','Create a support ticket.']
export function AIChat(){
 const {tickets,me,addTicket,endChat}=useApp(),first=me.name.split(' ')[0]
 const greet=()=>({from:'ai',text:`Hi ${first}, I am the HelpDesk AI assistant. How can I help today?`})
 const [msgs,setMsgs]=useState([greet()]),[v,setV]=useState(''),[typing,setTyping]=useState(false),[src,setSrc]=useState(null),issue=useRef(''),saved=useRef(1),end=useRef()
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'})},[msgs,typing])
 const send=async text=>{if(!text.trim()||typing)return
  const next=[...msgs,{from:'user',text}];setMsgs(next);setV('');setTyping(true)
  try{const mine=tickets.filter(t=>t.empId===me.id)
   const r=await chatReply({message:text,history:msgs,user:me,tickets:mine});setSrc(r.src)
   let card=null,out=r.text
   if(r.intent==='help')issue.current=text
   if(r.intent==='status')card=mine[0]?{type:'status',t:mine[0]}:null
   if(r.intent==='create'){
    const tk=r.ticket||{title:issue.current||'Issue reported via AI assistant'}
    const transcript=[...next,{from:'ai',text:r.text}].slice(saved.current)
    try{const t=await addTicket({title:tk.title,desc:tk.description||tk.title,category:tk.category||guessCategory(tk.title),priority:'Auto'},{messages:transcript})
     card={type:'created',t};saved.current=next.length+1}
    catch(e){out='Sorry, I could not save the ticket just now. Please try again in a moment.'}}
   setMsgs(m=>[...m,{from:'ai',text:out,card}])
  }catch(e){setMsgs(m=>[...m,{from:'ai',text:'Something went wrong on my side. Please try again.'}])}
  finally{setTyping(false)}}
 const reset=async()=>{const rest=msgs.slice(saved.current);if(rest.some(m=>m.from==='user'))endChat(rest);setMsgs([greet()]);saved.current=1;issue.current=''}
 return (<Page title="AI Helpdesk Assistant" sub={src==='gemini'?'Powered by Gemini':src==='local'?'Offline mode: AI service not reachable, using built-in answers':''} right={msgs.length>1&&<button className={btn2} onClick={reset} disabled={typing}><RotateCcw size={14}/>End &amp; start new chat</button>}><Card className="max-w-3xl"><div className="h-[55vh] overflow-auto space-y-3">{msgs.map((m,i)=><div key={i} className={`flex gap-2 ${m.from==='user'?'justify-end':''}`}>{m.from==='ai'&&<Bot size={20} className="text-navy mt-1 shrink-0"/>}
   <div className={`max-w-[80%] text-sm rounded-lg px-3 py-2 ${m.from==='user'?'bg-navy text-white':'bg-slate-100'}`}><div className="whitespace-pre-line">{m.text}</div>
    {m.card&&<div className="mt-2 bg-white text-slate-800 border rounded-md p-3">{m.card.type==='created'&&<div className="flex items-center gap-1 text-emerald-700 text-xs mb-1"><CheckCircle2 size={14}/>Ticket created</div>}<div className="font-medium">{m.card.t.id} · {m.card.t.title}</div><div className="mt-1 flex gap-1"><Badge v={m.card.t.status}/><Badge v={m.card.t.priority}/></div></div>}</div></div>)}
   {typing&&<div className="text-slate-400 text-sm pl-7">Assistant is typing…</div>}<div ref={end}/></div>
  <div className="flex flex-wrap gap-2 my-3">{SUG.map(s=><button key={s} onClick={()=>send(s)} disabled={typing} className="text-xs border rounded-full px-3 py-1 hover:bg-slate-50 disabled:opacity-50">{s}</button>)}</div>
  <div className="flex gap-2"><input className={inp+' flex-1'} value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(v)} placeholder="Describe your issue"/><button className={btn} disabled={typing} onClick={()=>send(v)}><Send size={14}/>Send</button></div></Card></Page>)}
export function CreateTicket(){
 const {addTicket,me}=useApp(),[f,setF]=useState({title:'',desc:'',category:'Auto',device:'',dept:me.dept,priority:'Auto'}),[done,setDone]=useState(null),[file,setFile]=useState(null),[busy,setBusy]=useState(false),[err,setErr]=useState('')
 const u=k=>e=>setF({...f,[k]:e.target.value}),L=({k,children})=><label className="block text-sm"><span className="text-slate-600">{k}</span>{children}</label>
 const submit=async()=>{setBusy(true);setErr('');try{setDone(await addTicket(f,{file}))}catch(e){setErr(e.message||'Could not submit the ticket')}finally{setBusy(false)}}
 if(done)return <Page title="Ticket submitted"><Card className="max-w-lg"><div className="text-center py-4"><CheckCircle2 className="mx-auto text-emerald-600" size={36}/><p className="mt-2 font-semibold">{done.id}</p><div className="flex justify-center gap-1 mt-1"><Badge v={done.priority}/><Badge v={done.category}/></div><p className="text-sm text-slate-600 mt-2">AI priority score: <b>{done.score}/100</b>. {done.reason}</p><p className="text-sm text-slate-500 mt-1">Our team will pick this up shortly.</p><button className={btn+' mt-4'} onClick={()=>{setDone(null);setFile(null);setF({...f,title:'',desc:''})}}>Create another ticket</button></div></Card></Page>
 return (<Page title="Create Ticket"><Card className="max-w-2xl"><div className="space-y-3">
  <L k="Issue title"><input className={inp+' w-full mt-1'} value={f.title} onChange={u('title')}/></L><L k="Description"><textarea rows={4} className={inp+' w-full mt-1'} value={f.desc} onChange={u('desc')}/></L>
  <div className="grid sm:grid-cols-2 gap-3"><L k="Category"><select className={inp+' w-full mt-1'} value={f.category} onChange={u('category')}><option value="Auto">Auto (AI decides)</option>{CATS.map(x=><option key={x}>{x}</option>)}</select></L><L k="Device"><input className={inp+' w-full mt-1'} value={f.device} onChange={u('device')}/></L>
   <L k="Department"><select className={inp+' w-full mt-1'} value={f.dept} onChange={u('dept')}>{DEPTS.map(x=><option key={x}>{x}</option>)}</select></L><L k="Priority"><select className={inp+' w-full mt-1'} value={f.priority} onChange={u('priority')}><option value="Auto">Auto (AI decides)</option>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></L></div>
  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><Paperclip size={14}/>{file?.name||'Attach screenshot'}<input type="file" accept="image/*" className="hidden" onChange={e=>setFile(e.target.files[0]||null)}/></label>
  {err&&<p className="text-sm text-red-700">{err}</p>}
  <button className={btn} disabled={!f.title.trim()||busy} onClick={submit}>{busy?'AI is scoring your ticket…':'Submit ticket'}</button></div></Card></Page>)}
export const Notifications=()=>{const {notifs}=useApp();return <Page title="Notifications"><Card>{notifs.map(n=><div key={n.id} className="py-2 border-b last:border-0 text-sm">{n.text}</div>)}</Card></Page>}
export const Profile=()=>{const {me}=useApp();return <Page title="Profile"><Card className="max-w-md text-sm space-y-1"><div><b>{me.name}</b></div><div>{me.id} · {me.dept}</div><div>{me.email}</div></Card></Page>}
