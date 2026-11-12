import {useState} from 'react'
import {NavLink,Outlet,useNavigate,Link} from 'react-router-dom'
import {LayoutDashboard,Sparkles,Ticket,MessageSquare,Users,Wrench,Building2,Timer,BookOpen,BarChart3,Settings,Bell,Search,Menu,MessageCircle,PlusCircle,User,ListChecks,Zap} from 'lucide-react'
import {useApp} from '../../context/AppContext'
const NAV={admin:[['/admin','Overview',LayoutDashboard,1],['/admin/ai','AI Intelligence',Sparkles],['/admin/tickets','All Tickets',Ticket],['/admin/conversations','Conversations',MessageSquare],['/admin/users','User Management',Users],['/admin/technicians','Technician Management',Wrench],['/admin/departments','Departments',Building2],['/admin/sla','SLA Monitoring',Timer],['/admin/kb','Knowledge Base',BookOpen],['/admin/reports','Reports & Analytics',BarChart3],['/admin/settings','Settings',Settings]],
 employee:[['/employee','Dashboard',LayoutDashboard,1],['/employee/chat','AI Helpdesk Assistant',MessageCircle],['/employee/create','Create Ticket',PlusCircle],['/employee/tickets','My Tickets',Ticket],['/employee/notifications','Notifications',Bell],['/employee/profile','Profile',User]],
 technician:[['/technician','Dashboard',LayoutDashboard,1],['/technician/tickets','Assigned Tickets',ListChecks],['/technician/kb','Knowledge Base',BookOpen]]}
const ROLE={admin:'Administrator',employee:'Employee',technician:'IT Technician'}
export default function Layout({role}){
 const [open,setOpen]=useState(false),[bell,setBell]=useState(false),nav=useNavigate(),{notifs,admin,me,techMe}=useApp()
 const who={admin,employee:me,technician:techMe}[role]
 return (<div className="min-h-screen flex">
  <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#171e19] border-r-2 border-black transition-transform ${open?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
   <Link to="/" className="h-16 flex items-center gap-2 px-4 border-b-2 border-black bg-[#ffe17c]"><div className="w-10 h-10 border-2 border-black bg-black flex items-center justify-center"><Zap size={18} className="text-[#ffe17c]" fill="#ffe17c"/></div><span className="font-display font-extrabold tracking-tighter text-xl">HelpDesk AI</span></Link>
   <nav className="p-2 space-y-0.5">{NAV[role].map(([to,l,I,end])=><NavLink key={to} to={to} end={!!end} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${isActive?'bg-[#ffe17c] text-black font-bold border-2 border-black shadow-[3px_3px_0_0_#000]':'border-2 border-transparent text-[#b7c6c2] hover:text-white'}`}><I size={16}/>{l}</NavLink>)}</nav></aside>
  {open&&<div className="fixed inset-0 bg-slate-900/30 z-30 lg:hidden" onClick={()=>setOpen(false)}/>}
  <div className="flex-1 min-w-0 dots bg-[#ffe17c]">
   <header className="h-16 bg-[#ffe17c] border-b-2 border-black flex items-center gap-3 px-4 sticky top-0 z-20">
    <button className="lg:hidden" onClick={()=>setOpen(true)}><Menu size={20}/></button>
    <div className="relative flex-1 max-w-md"><Search size={15} className="absolute left-3 top-2.5 text-slate-400"/><input placeholder="Search tickets, users…" onKeyDown={e=>e.key==='Enter'&&nav(`/${role==='employee'?'employee/tickets':role==='admin'?'admin/tickets':'technician/tickets'}?q=${encodeURIComponent(e.target.value)}`)} className="w-full border-2 border-black bg-white rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none"/></div>
    <div className="relative"><button onClick={()=>setBell(!bell)} className="relative p-1.5"><Bell size={18}/><span className="absolute top-0 right-0 bg-black text-[#ffe17c] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{notifs.length}</span></button>
     {bell&&<div className="absolute right-0 mt-2 w-72 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] p-2 max-h-80 overflow-auto">{notifs.map(n=><div key={n.id} className="text-sm p-2 rounded hover:bg-slate-50">{n.text}</div>)}</div>}</div>
    <select value={role} onChange={e=>nav(`/${e.target.value}`)} className="border-2 border-black bg-white rounded-lg text-sm px-2 py-1.5"><option value="admin">Admin portal</option><option value="technician">Technician portal</option><option value="employee">Employee portal</option></select>
    <div className="hidden sm:flex items-center gap-2"><div className="w-9 h-9 border-2 border-black bg-[#b7c6c2] text-black font-bold text-xs flex items-center justify-center">{who.name.split(' ').map(x=>x[0]).join('')}</div><div className="leading-tight"><div className="text-sm font-medium">{who.name}</div><div className="text-[11px] text-slate-500">{ROLE[role]}</div></div></div>
   </header>
   <main className="p-4 md:p-6 max-w-[1400px]"><Outlet/></main></div></div>)}
