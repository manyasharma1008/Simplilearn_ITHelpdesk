import {createContext,useContext,useState,useEffect,useCallback} from 'react'
import {supabase,configured} from '../lib/supabase'
import {newTicket} from '../services/mockTicketService'
import {analyzeTicket,analyzeConversation} from '../services/aiService'
import {guessCategory} from '../services/mockAIService'
const Ctx=createContext()
export const useApp=()=>useContext(Ctx)
const prof=r=>({id:r.id,name:r.name,email:r.email,dept:r.dept,role:r.role,status:r.status,lastActive:r.last_active_hours??0,joinedDays:r.joined_days_ago??0,spec:r.specialization})
const tick=r=>({id:r.id,title:r.title,desc:r.description,category:r.category,device:r.device,dept:r.dept,empId:r.employee_id,empName:r.employee_name,priority:r.priority,score:r.ai_score,impact:r.impact,severity:r.severity,urgency:r.urgency,recurrence:r.recurrence,reason:r.score_reason,status:r.status,tech:r.technician_id,sentiment:r.sentiment,created:r.created_at,
 history:[...(r.ticket_history||[])].sort((a,b)=>new Date(a.at)-new Date(b.at)).map(h=>({s:h.status,t:h.at})),comments:[...(r.ticket_comments||[])].sort((a,b)=>new Date(a.at)-new Date(b.at)).map(c=>({by:c.author,text:c.body,t:c.at}))})
const conv=r=>({id:r.id,ticketId:r.ticket_id,empName:r.employee_name,dept:r.dept,category:r.category,sentiment:r.sentiment,frustration:r.frustration,urgency:r.urgency,summary:r.summary,action:r.recommended_action,keyPhrases:r.key_phrases||[],date:r.created_at,daysAgo:Math.floor((Date.now()-new Date(r.created_at))/864e5),
 messages:[...(r.conversation_messages||[])].sort((a,b)=>a.seq-b.seq).map(m=>({from:m.sender,text:m.body}))})
const num=id=>+String(id).split('-')[1]
export function AppProvider({children}){
 const [st,setSt]=useState({loading:true,error:null}),[users,setUsers]=useState([]),[tickets,setTickets]=useState([]),[conversations,setConv]=useState([]),[notifs,setNotifs]=useState([])
 const notify=text=>setNotifs(n=>[{id:Date.now()+Math.random(),text},...n])
 const load=useCallback(async()=>{
  if(!configured)return setSt({loading:false,error:'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in.'})
  const [p,t,c]=await Promise.all([supabase.from('profiles').select('*').order('id'),supabase.from('tickets').select('*,ticket_history(*),ticket_comments(*)').order('created_at',{ascending:false}),supabase.from('conversations').select('*,conversation_messages(*)').order('created_at',{ascending:false})])
  const err=p.error||t.error||c.error;if(err)return setSt({loading:false,error:err.message})
  const tk=t.data.map(tick);setUsers(p.data.map(prof));setTickets(tk);setConv(c.data.map(conv))
  const crit=tk.filter(x=>x.priority==='Critical'&&!['Resolved','Closed'].includes(x.status)).length
  setNotifs(crit?[{id:1,text:`${crit} critical tickets need attention`}]:[]);setSt({loading:false,error:null})},[])
 useEffect(()=>{load()},[load])
 const run=fn=>fn().catch(e=>{notify(`Save failed: ${e.message}`);load()})
 const ok=async q=>{const r=await q;if(r.error)throw r.error}
 const me=users.find(u=>u.role==='Employee'),techMe=users.find(u=>u.role==='Technician'),admin=users.find(u=>u.role==='Admin')
 const patch=(id,p)=>{const old=tickets.find(t=>t.id===id);if(!old)return;const changed=p.status&&p.status!==old.status,now=new Date().toISOString()
  setTickets(ts=>ts.map(t=>t.id===id?{...t,...p,history:changed?[...t.history,{s:p.status,t:now}]:t.history}:t))
  const col={};if(p.status!==undefined)col.status=p.status;if(p.priority!==undefined)col.priority=p.priority;if(p.tech!==undefined)col.technician_id=p.tech||null
  run(async()=>{await ok(supabase.from('tickets').update(col).eq('id',id));if(changed)await ok(supabase.from('ticket_history').insert({ticket_id:id,status:p.status,at:now}))})}
 const ticketRow=t=>({id:t.id,title:t.title,description:t.desc,category:t.category,device:t.device,dept:t.dept,employee_id:t.empId,employee_name:t.empName,priority:t.priority,ai_score:t.score,impact:t.impact,severity:t.severity,urgency:t.urgency,recurrence:t.recurrence,score_reason:t.reason,status:'Open',technician_id:null,sentiment:t.sentiment,created_at:t.created})
 const saveConversation=async(ticket,messages,an)=>{
  const id=`CONV-${Date.now().toString().slice(-8)}`,now=new Date().toISOString(),first=messages.find(m=>m.from==='user')?.text||''
  const row={id,ticket_id:ticket?.id||null,employee_name:me.name,dept:me.dept,category:ticket?.category||guessCategory(first),sentiment:an.sentiment,frustration:an.frustration,urgency:an.urgency,summary:an.summary,recommended_action:an.recommended_action,key_phrases:an.key_phrases||[],created_at:now}
  const msgs=messages.map((m,i)=>({conversation_id:id,seq:i+1,sender:m.from==='user'?'user':'ai',body:m.text}))
  const a=await supabase.from('conversations').insert(row);if(a.error){notify(`Conversation not saved: ${a.error.message}`);return}
  const b=await supabase.from('conversation_messages').insert(msgs);if(b.error){notify(`Conversation messages not saved: ${b.error.message}`);return}
  setConv(cs=>[{id,ticketId:row.ticket_id,empName:me.name,dept:me.dept,category:row.category,sentiment:row.sentiment,frustration:row.frustration,urgency:row.urgency,summary:row.summary,action:row.recommended_action,keyPhrases:row.key_phrases,date:now,daysAgo:0,messages:messages.map(m=>({from:m.from,text:m.text}))},...cs])}
 const uploadAttachment=async(t,file)=>{
  const path=`${t.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g,'_')}`
  const up=await supabase.storage.from('attachments').upload(path,file);if(up.error)throw up.error
  const url=supabase.storage.from('attachments').getPublicUrl(path).data.publicUrl,now=new Date().toISOString(),text=`Attachment: ${url}`
  const r=await supabase.from('ticket_comments').insert({ticket_id:t.id,author:t.empName,body:text,at:now});if(r.error)throw r.error
  setTickets(ts=>ts.map(x=>x.id===t.id?{...x,comments:[...x.comments,{by:t.empName,text,t:now}]}:x))}
 // f: {title,desc,category,device,dept,priority ('Auto' lets the AI decide)}   opts: {messages (chat transcript), file}
 const addTicket=async(f,opts={})=>{
  const [a,conv]=await Promise.all([analyzeTicket(f,tickets,Date.now()%97),opts.messages?analyzeConversation(opts.messages,me.name):null])
  if(conv)a.sentiment=conv.sentiment
  const base=Math.max(2100,...tickets.map(x=>num(x.id)));let t,tries=0
  for(;;){t=newTicket(f,me,base+1-2101+tries,a)
   const {error}=await supabase.from('tickets').insert(ticketRow(t))
   if(!error)break
   if(error.code==='23505'&&tries<5){tries++;continue}   // id already taken by someone else: try the next number
   notify(`Could not save ticket: ${error.message}`);throw error}
  const h=await supabase.from('ticket_history').insert({ticket_id:t.id,status:'Open',at:t.created});if(h.error)notify(`History not saved: ${h.error.message}`)
  setTickets(ts=>[t,...ts]);notify(`Ticket ${t.id} created (${t.priority}, AI score ${t.score})`)
  if(opts.messages)await saveConversation(t,opts.messages,conv)
  if(opts.file)try{await uploadAttachment(t,opts.file)}catch(e){notify(`Ticket saved, but the attachment failed: ${e.message}. Run db/patch_attachments.sql in Supabase.`)}
  return t}
 const endChat=async messages=>{if(messages.filter(m=>m.from==='user').length<1)return;const an=await analyzeConversation(messages,me.name);await saveConversation(null,messages,an)}
 const comment=(id,text,by)=>{const now=new Date().toISOString();setTickets(ts=>ts.map(t=>t.id===id?{...t,comments:[...t.comments,{by,text,t:now}]}:t));run(()=>ok(supabase.from('ticket_comments').insert({ticket_id:id,author:by,body:text,at:now})))}
 const addUser=u=>{const id=`EMP-${Math.max(1000,...users.map(x=>num(x.id)))+1}`,n={id,status:'Active',lastActive:0,joinedDays:0,spec:null,...u};setUsers(us=>[n,...us])
  run(()=>ok(supabase.from('profiles').insert({id,name:n.name,email:n.email,dept:n.dept,role:n.role,status:n.status,last_active_hours:0,joined_days_ago:0})))}
 const updateUser=(id,p)=>{setUsers(us=>us.map(u=>u.id===id?{...u,...p}:u));const col={};['name','email','dept','role','status'].forEach(k=>p[k]!==undefined&&(col[k]=p[k]));run(()=>ok(supabase.from('profiles').update(col).eq('id',id)))}
 if(st.loading)return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading from Supabase…</div>
 if(st.error||!me||!techMe||!admin)return <div className="min-h-screen flex items-center justify-center p-6"><div className="max-w-md bg-white border rounded-lg p-5 text-sm"><div className="font-semibold mb-1">Could not load data</div><p className="text-slate-600">{st.error||'No profiles found. Run db/ps4_it_helpdesk.sql in the Supabase SQL editor.'}</p><button className="mt-3 border rounded-md px-3 py-1.5" onClick={()=>{setSt({loading:true,error:null});load()}}>Retry</button></div></div>
 return <Ctx.Provider value={{users,tickets,conversations,notifs,me,techMe,admin,patch,addTicket,endChat,comment,addUser,updateUser,notify,refresh:load}}>{children}</Ctx.Provider>}
