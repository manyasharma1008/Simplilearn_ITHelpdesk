import {useState,useEffect} from 'react'
import {useSearchParams} from 'react-router-dom'
import {Page,Card,Badge,Table,inp,btn2} from '../../components/ui/ui'
import TicketModal from '../../components/tickets/TicketModal'
import {useApp} from '../../context/AppContext'
import {CATS,DEPTS,STATUSES,PRIORITIES} from '../../data/constants'
import {fmt} from '../../utils/helpers'
const Sel=({v,set,opts,label})=><select className={inp} value={v} onChange={e=>set(e.target.value)}><option value="">{label}</option>{opts.map(o=><option key={o}>{o}</option>)}</select>
export default function Tickets({scope}){
 const {tickets,users,patch,me,techMe}=useApp(),[sp]=useSearchParams(),[q,setQ]=useState(sp.get('q')||''),[f,setF]=useState({}),[sort,setSort]=useState('created'),[open,setOpen]=useState(null),[limit,setLimit]=useState(50)
 useEffect(()=>{setQ(sp.get('q')||'')},[sp])   // header search while already on this page
 const set=k=>v=>setF(o=>({...o,[k]:v})),name=id=>users.find(u=>u.id===id)?.name||'Unassigned'
 let rows=tickets.filter(t=>(scope==='employee'?t.empId===me.id:scope==='technician'?t.tech===techMe.id:true)&&(!q||(t.title+t.id+t.empName).toLowerCase().includes(q.toLowerCase()))&&(!f.status||t.status===f.status)&&(!f.priority||t.priority===f.priority)&&(!f.category||t.category===f.category)&&(!f.dept||t.dept===f.dept))
 rows=[...rows].sort((a,b)=>sort==='score'?b.score-a.score:new Date(b.created)-new Date(a.created))
 const adm=!scope,techs=users.filter(u=>u.role==='Technician')
 return (<Page title={scope==='employee'?'My Tickets':scope==='technician'?'Assigned Tickets':'All Tickets'} sub={`${rows.length} tickets`}>
  <Card><div className="flex flex-wrap gap-2 mb-3"><input className={inp+' w-56'} placeholder="Search tickets" value={q} onChange={e=>setQ(e.target.value)}/>
   <Sel v={f.status||''} set={set('status')} opts={STATUSES} label="All statuses"/><Sel v={f.priority||''} set={set('priority')} opts={PRIORITIES} label="All priorities"/><Sel v={f.category||''} set={set('category')} opts={CATS} label="All categories"/>{adm&&<Sel v={f.dept||''} set={set('dept')} opts={DEPTS} label="All departments"/>}
   <select className={inp} value={sort} onChange={e=>setSort(e.target.value)}><option value="created">Newest first</option><option value="score">Highest AI score</option></select></div>
   <Table onRow={i=>setOpen(rows[i].id)} cols={adm?['ID','Issue','Employee','Department','Category','Priority','AI score','Technician','Status','Created']:['ID','Issue','Category','Priority','Status','Created']}
    rows={rows.slice(0,limit).map(t=>adm?[t.id,<span className="block max-w-[220px] truncate">{t.title}</span>,t.empName,t.dept,t.category,<Badge v={t.priority}/>,t.score,
     <select className={inp+' py-0.5'} value={t.tech||''} onClick={e=>e.stopPropagation()} onChange={e=>patch(t.id,{tech:e.target.value,status:t.status==='Open'?'Assigned':t.status})}><option value="">Unassigned</option>{techs.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>,
     <select className={inp+' py-0.5'} value={t.status} onClick={e=>e.stopPropagation()} onChange={e=>patch(t.id,{status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>,fmt(t.created)]
     :[t.id,t.title,t.category,<Badge v={t.priority}/>,<Badge v={t.status}/>,fmt(t.created)])}/>
   {rows.length>limit&&<div className="text-center mt-3"><button className={btn2} onClick={()=>setLimit(l=>l+50)}>Show more ({rows.length-limit} left)</button></div>}</Card>
  {open&&<TicketModal id={open} onClose={()=>setOpen(null)} canEdit={scope!=='employee'}/>}</Page>)}
