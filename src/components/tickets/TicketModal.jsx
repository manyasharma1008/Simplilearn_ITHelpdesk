import {useState} from 'react'
import {Modal,Badge,PriorityScore,inp,btn} from '../ui/ui'
import {useApp} from '../../context/AppContext'
import {STATUSES,PRIORITIES} from '../../data/constants'
import {useTicketSummary} from '../../hooks'
import {fmtT,slaState,countdown} from '../../utils/helpers'
export default function TicketModal({id,onClose,canEdit}){
 const {tickets,users,patch,comment}=useApp(),t=tickets.find(x=>x.id===id),[c,setC]=useState(''),sm=useTicketSummary(t)
 if(!t)return null
 const ai=sm.data,techs=users.filter(u=>u.role==='Technician'),tech=users.find(u=>u.id===t.tech)
 const L=({k,children})=><div><div className="text-xs text-slate-500 mb-1">{k}</div>{children}</div>
 return (<Modal wide title={`${t.id} · ${t.title}`} onClose={onClose}><div className="grid md:grid-cols-2 gap-5 text-sm">
  <div className="space-y-4">
   <div className="flex gap-2 flex-wrap"><Badge v={t.status}/><Badge v={t.priority}/><Badge v={t.sentiment}/><Badge v={slaState(t)}/></div>
   <L k="Employee">{t.empName} · {t.dept}</L><L k="Description">{t.desc}</L><L k="Device / category">{t.device} · {t.category}</L><L k="SLA">{slaState(t)==='Met'?'Met':countdown(t)}</L>
   {canEdit&&<div className="grid grid-cols-3 gap-2">
    <L k="Status"><select className={inp+' w-full'} value={t.status} onChange={e=>patch(t.id,{status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></L>
    <L k="Priority"><select className={inp+' w-full'} value={t.priority} onChange={e=>patch(t.id,{priority:e.target.value})}>{PRIORITIES.map(s=><option key={s}>{s}</option>)}</select></L>
    <L k="Technician"><select className={inp+' w-full'} value={t.tech||''} onChange={e=>patch(t.id,{tech:e.target.value,status:t.status==='Open'?'Assigned':t.status})}><option value="">Unassigned</option>{techs.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></L></div>}
   {!canEdit&&<L k="Technician">{tech?.name||'Not yet assigned'}</L>}
   <L k="Activity timeline"><ol className="border-l-2 border-slate-200 ml-1 space-y-2">{t.history.map((h,i)=><li key={i} className="pl-3 relative"><span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-navy"/>{h.s} <span className="text-xs text-slate-400">{fmtT(h.t)}</span></li>)}</ol></L>
  </div>
  <div className="space-y-4">
   <div className="bg-navy-50 rounded-md p-3"><div className="text-xs font-medium text-navy mb-1">AI summary{ai?.src==='local'?' (offline rules)':ai?.src==='gemini'?' (Gemini)':''}</div>
    {sm.loading||!ai?<p className="text-slate-500">Generating summary…</p>:<><p>{ai.summary}</p>
    <ul className="list-disc ml-4 mt-2 text-slate-600">{ai.findings.map(f=><li key={f}>{f}</li>)}</ul><div className="text-xs font-medium mt-2">Impact</div><p className="text-slate-600">{ai.impact}</p>
    <div className="text-xs font-medium mt-2">Suggested next steps</div><ul className="list-disc ml-4 text-slate-600">{ai.next.map(f=><li key={f}>{f}</li>)}</ul></>}</div>
   <PriorityScore t={t}/>
   <L k="Comments">{t.comments.map((x,i)=><div key={i} className="bg-slate-50 rounded p-2 mb-1"><b>{x.by}</b> · <span className="text-xs text-slate-400">{fmtT(x.t)}</span><div className="break-words">{x.text.startsWith('Attachment: http')?<a className="text-blue-600 underline" href={x.text.slice(12)} target="_blank" rel="noreferrer">View attachment</a>:x.text}</div></div>)}
    <div className="flex gap-2"><input className={inp+' flex-1'} value={c} onChange={e=>setC(e.target.value)} placeholder="Add comment"/><button className={btn} onClick={()=>{if(c.trim()){comment(t.id,c,canEdit?'IT':t.empName);setC('')}}}>Post</button></div></L>
  </div></div></Modal>)}
