import {useState} from 'react'
import {Plus} from 'lucide-react'
import {Page,Card,Kpi,Badge,Table,Modal,inp,btn,btn2} from '../../components/ui/ui'
import {useApp} from '../../context/AppContext'
import {DEPTS} from '../../data/constants'
export default function Users(){
 const {users,tickets,addUser,updateUser}=useApp(),[q,setQ]=useState(''),[d,setD]=useState(''),[r,setR]=useState(''),[s,setS]=useState(''),[form,setForm]=useState(null),[view,setView]=useState(null)
 const rows=users.filter(u=>(!q||(u.name+u.email+u.id).toLowerCase().includes(q.toLowerCase()))&&(!d||u.dept===d)&&(!r||u.role===r)&&(!s||u.status===s))
 const save=()=>{if(!form.name||!form.email)return;form.id?updateUser(form.id,form):addUser(form);setForm(null)}
 const v=view&&users.find(u=>u.id===view)
 return (<Page title="User Management" right={<button className={btn} onClick={()=>setForm({name:'',email:'',dept:DEPTS[0],role:'Employee'})}><Plus size={14}/>Add user</button>}>
  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">{[['Total users',users.length],['Active',users.filter(u=>u.status==='Active').length],['New (30 days)',users.filter(u=>u.joinedDays<30).length],['Pending approvals',users.filter(u=>u.status==='Pending').length],['IT admins',users.filter(u=>u.role==='Admin').length],['Technicians',users.filter(u=>u.role==='Technician').length]].map(([l,x])=><Kpi key={l} label={l} value={x}/>)}</div>
  <Card><div className="flex flex-wrap gap-2 mb-3"><input className={inp+' w-56'} placeholder="Search users" value={q} onChange={e=>setQ(e.target.value)}/>
   <select className={inp} value={d} onChange={e=>setD(e.target.value)}><option value="">All departments</option>{DEPTS.map(x=><option key={x}>{x}</option>)}</select>
   <select className={inp} value={r} onChange={e=>setR(e.target.value)}><option value="">All roles</option>{['Employee','Technician','Admin'].map(x=><option key={x}>{x}</option>)}</select>
   <select className={inp} value={s} onChange={e=>setS(e.target.value)}><option value="">All statuses</option>{['Active','Inactive','Pending'].map(x=><option key={x}>{x}</option>)}</select></div>
   <Table cols={['Name','ID','Email','Department','Role','Status','Last active','Actions']} rows={rows.map(u=>[u.name,u.id,u.email,u.dept,u.role,<Badge v={u.status}/>,`${u.lastActive}h ago`,
    <div className="flex gap-1.5"><button className="text-blue-600" onClick={()=>setView(u.id)}>View</button><button className="text-blue-600" onClick={()=>setForm({...u})}>Edit</button><button className="text-slate-600" onClick={()=>updateUser(u.id,{status:u.status==='Active'?'Inactive':'Active'})}>{u.status==='Active'?'Deactivate':'Activate'}</button></div>])}/></Card>
  {form&&<Modal title={form.id?'Edit user':'Add user'} onClose={()=>setForm(null)}><div className="space-y-3">
   <input className={inp+' w-full'} placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input className={inp+' w-full'} placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
   <select className={inp+' w-full'} value={form.dept} onChange={e=>setForm({...form,dept:e.target.value})}>{[...DEPTS,'IT Services'].map(x=><option key={x}>{x}</option>)}</select>
   <select className={inp+' w-full'} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{['Employee','Technician','Admin'].map(x=><option key={x}>{x}</option>)}</select>
   <div className="flex justify-end gap-2"><button className={btn2} onClick={()=>setForm(null)}>Cancel</button><button className={btn} onClick={save}>Save user</button></div></div></Modal>}
  {v&&<Modal wide title={v.name} onClose={()=>setView(null)}><p className="text-sm text-slate-600 mb-3">{v.id} · {v.email} · {v.dept} · {v.role} · <Badge v={v.status}/> · last active {v.lastActive}h ago</p>
   <Table cols={['Ticket','Issue','Status','Priority']} rows={tickets.filter(t=>t.empId===v.id||t.tech===v.id).slice(0,10).map(t=>[t.id,t.title,<Badge v={t.status}/>,<Badge v={t.priority}/>])} empty="No tickets"/></Modal>}</Page>)}
