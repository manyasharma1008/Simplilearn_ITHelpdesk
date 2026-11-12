export const SLA_H={Critical:4,High:8,Medium:24,Low:72}
export const isDone=t=>['Resolved','Closed'].includes(t.status)
export const deadline=t=>new Date(new Date(t.created).getTime()+SLA_H[t.priority]*36e5)
export const hoursLeft=t=>(deadline(t).getTime()-Date.now())/36e5
export const slaState=t=>isDone(t)?'Met':hoursLeft(t)<0?'Breached':hoursLeft(t)<SLA_H[t.priority]*.25?'At Risk':'Within SLA'
export const fmt=d=>new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
export const fmtT=d=>new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
export const countBy=(a,f)=>Object.entries(a.reduce((m,x)=>{const k=f(x);m[k]=(m[k]||0)+1;return m},{})).map(([name,value])=>({name,value}))
export const techStats=(tech,tickets)=>{const mine=tickets.filter(t=>t.tech===tech.id);const active=mine.filter(t=>!isDone(t)).length;const resolved=mine.length-active
 return {active,resolved,availability:active>=6?'Busy':'Available',performance:mine.length?Math.round(resolved/mine.length*100):0}}
export const countdown=t=>{const h=hoursLeft(t);const a=Math.abs(h);const s=`${Math.floor(a)}h ${Math.round((a%1)*60)}m`;return h<0?`${s} overdue`:`${s} left`}
