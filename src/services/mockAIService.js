// Swap these for Gemini calls (via a backend / Edge Function) later. Keep signatures.
export const scoreTicket=(priority,seed=0)=>{
 const base={Low:22,Medium:45,High:70,Critical:88}[priority];const score=Math.min(99,base+seed%10)
 const f=d=>Math.max(5,Math.min(100,score+d))
 return {score,impact:f(seed%7-3),severity:f(seed%5),urgency:f(2-seed%6),recurrence:f(seed%9-12),
  reason:`${priority} priority: ${score>=75?'broad business impact and high technical severity':score>=50?'moderate productivity impact, workaround may exist':'limited impact on a single user'}.`}}
export const levelOf=s=>s>=80?'Critical':s>=60?'High':s>=35?'Medium':'Low'
export const summarize=t=>({
 summary:`${t.empName} (${t.dept}) reports "${t.title.toLowerCase()}" on ${t.device}. ${t.sentiment==='Frustrated'?'The employee is frustrated after repeated attempts.':'The employee is cooperative.'}`,
 findings:[`Category: ${t.category}`,`Priority score ${t.score}/100`,t.score>70?'Similar issues seen in the last 7 days':'No related recurring pattern'],
 tried:['Restarted the device','Checked network / power connection','Searched knowledge base'],
 impact:t.priority==='Critical'||t.priority==='High'?'Employee is unable to work; team deliverables at risk.':'Employee can continue with reduced productivity.',
 next:['Run remote diagnostics','Apply knowledge-base fix','Escalate to Tier 2 if unresolved within SLA']})
export const guessCategory=s=>{s=s.toLowerCase();return /wi-?fi|network|internet|vpn/.test(s)?'Network':/password|login|locked|account|mfa/.test(s)?'Account Access':/mail|outlook/.test(s)?'Email':/phish|virus|security/.test(s)?'Security':/laptop|screen|monitor|keyboard|battery/.test(s)?'Hardware':'Software'}
export const reply=q=>{const t=q.toLowerCase()
 if(/status|track/.test(t))return {intent:'status',text:'Here is the latest on your most recent ticket:'}
 if(/create|raise|log (a|the)|ticket/.test(t))return {intent:'create',text:'Done, I have logged this for you.'}
 if(/wi-?fi|network|internet|vpn/.test(t))return {intent:'help',text:'Try these steps:\n1. Turn Wi-Fi off and on\n2. Forget the "Nexora-Corp" network and reconnect\n3. Restart your laptop\n\nStill failing? Say "create ticket" and I will log it.'}
 if(/password|login|locked/.test(t))return {intent:'help',text:'You can reset it at the self-service portal:\n1. Open the password reset page\n2. Verify with your MFA code\n3. Choose a new password (12+ characters)\n\nIf the MFA code does not arrive, say "create ticket".'}
 if(/laptop|computer|screen|battery|boot/.test(t))return {intent:'help',text:'Sorry about that. Please try:\n1. Hold the power button for 15 seconds\n2. Unplug accessories and charger, then power on\n3. Check for a charging light\n\nIf it still fails, say "create ticket".'}
 return {intent:'help',text:'I can help with hardware, network, accounts, email and software issues. Describe the problem or pick a suggestion.'}}
export const ask=(q,{tickets,users})=>{const t=q.toLowerCase();const live=x=>!['Resolved','Closed'].includes(x.status)
 if(/critical/.test(t))return `${tickets.filter(x=>x.priority==='Critical'&&live(x)).length} critical tickets are currently unresolved.`
 if(/department|dept/.test(t)){const m={};tickets.forEach(x=>m[x.dept]=(m[x.dept]||0)+1);const [d,n]=Object.entries(m).sort((a,b)=>b[1]-a[1])[0];return `${d} has the highest volume with ${n} tickets.`}
 if(/frustrat|sentiment|negative/.test(t))return `${tickets.filter(x=>x.sentiment==='Frustrated').length} tickets show frustrated employees and ${tickets.filter(x=>x.sentiment==='Negative').length} are negative.`
 if(/open|pending|unresolved|tickets/.test(t))return `${tickets.filter(live).length} tickets are unresolved out of ${tickets.length}.`
 if(/user|employee/.test(t))return `There are ${users.length} registered users, ${users.filter(u=>u.status==='Active').length} active.`
 return 'Try asking about critical tickets, busiest department, sentiment, open tickets or users.'}
