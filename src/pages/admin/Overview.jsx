import {Users,UserCheck,Ticket,FolderOpen,Loader,CheckCircle2,AlertTriangle,Wrench} from 'lucide-react'
import {Page,Card,Kpi} from '../../components/ui/ui'
import {Donut,Bars,Lines} from '../../components/charts/Charts'
import {useApp} from '../../context/AppContext'
import {countBy,isDone,techStats} from '../../utils/helpers'
const win=(ts,f,a,b)=>ts.filter(t=>f(t)&&Date.now()-new Date(t.created)>=a*864e5&&Date.now()-new Date(t.created)<b*864e5).length
const pct=(ts,f)=>{const p=win(ts,f,7,14),c=win(ts,f,0,7);return p?Math.round((c-p)/p*100):0}
export default function Overview(){
 const {tickets,users}=useApp(),techs=users.filter(u=>u.role==='Technician')
 const day=n=>{const d=new Date(Date.now()-n*864e5);return d.toDateString()}
 const volume=Array.from({length:14},(_,i)=>{const n=13-i;return {name:new Date(Date.now()-n*864e5).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}),value:tickets.filter(t=>new Date(t.created).toDateString()===day(n)).length}})
 const load=techs.map(t=>({name:t.name.split(' ')[0],value:techStats(t,tickets).active}))
 const K=[['Total Users',users.length,null,Users],['Active Users',users.filter(u=>u.status==='Active').length,null,UserCheck],['Total Tickets',tickets.length,pct(tickets,()=>true),Ticket],
  ['Open Tickets',tickets.filter(t=>t.status==='Open').length,pct(tickets,t=>t.status==='Open'),FolderOpen],['In Progress',tickets.filter(t=>t.status==='In Progress').length,pct(tickets,t=>t.status==='In Progress'),Loader],
  ['Resolved Tickets',tickets.filter(isDone).length,pct(tickets,isDone),CheckCircle2],['Critical Tickets',tickets.filter(t=>t.priority==='Critical'&&!isDone(t)).length,pct(tickets,t=>t.priority==='Critical'),AlertTriangle],
  ['Available Technicians',techs.filter(t=>techStats(t,tickets).availability==='Available').length,null,Wrench]]
 return (<Page title="Overview" sub="IT operations command center">
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{K.map(([l,v,d,i])=><Kpi key={l} label={l} value={v} delta={d} icon={i}/>)}</div>
  <div className="grid lg:grid-cols-3 gap-4">
   <Card title="Tickets by status"><Donut data={countBy(tickets,t=>t.status)}/></Card>
   <Card title="Ticket volume (14 days)" className="lg:col-span-2"><Lines data={volume}/></Card>
   <Card title="Tickets by category"><Bars data={countBy(tickets,t=>t.category)}/></Card>
   <Card title="Department distribution"><Bars horizontal data={countBy(tickets,t=>t.dept)}/></Card>
   <Card title="Priority distribution"><Donut data={countBy(tickets,t=>t.priority)}/></Card>
   <Card title="Technician workload (active tickets)" className="lg:col-span-3"><Bars data={load}/></Card></div></Page>)}
