// Builds a ticket object from the form + the AI analysis (see aiService.analyzeTicket).
export const newTicket=(f,me,n,a)=>{const now=new Date().toISOString()
 return {id:`TKT-${2101+n}`,title:f.title,desc:f.desc||f.title,category:f.category&&f.category!=='Auto'?f.category:a.category,device:f.device||'Not specified',dept:f.dept||me.dept,empId:me.id,empName:me.name,
  priority:a.priority,score:a.score,impact:a.impact,severity:a.severity,urgency:a.urgency,recurrence:a.recurrence,reason:a.reason,
  status:'Open',tech:null,created:now,sentiment:a.sentiment||'Neutral',history:[{s:'Open',t:now}],comments:[]}}
