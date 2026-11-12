import {Page,Card,Kpi,Badge,Table} from '../../components/ui/ui'
import {useApp} from '../../context/AppContext'
import {isDone,slaState,countdown} from '../../utils/helpers'
export default function TechnicianDashboard(){const {tickets,techMe}=useApp(),mine=tickets.filter(t=>t.tech===techMe.id),live=mine.filter(t=>!isDone(t)).sort((a,b)=>b.score-a.score)
 return (<Page title={`Hello, ${techMe.name.split(' ')[0]}`} sub="Work queue sorted by AI priority score"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="Active" value={live.length}/><Kpi label="Resolved" value={mine.length-live.length}/><Kpi label="Critical" value={live.filter(t=>t.priority==='Critical').length}/><Kpi label="SLA at risk" value={live.filter(t=>['At Risk','Breached'].includes(slaState(t))).length}/></div>
  <Card title="Next up"><Table cols={['ID','Issue','Priority','Score','SLA','Status']} rows={live.slice(0,8).map(t=>[t.id,t.title,<Badge v={t.priority}/>,t.score,countdown(t),<Badge v={t.status}/>])} empty="Queue is clear"/></Card></Page>)}
