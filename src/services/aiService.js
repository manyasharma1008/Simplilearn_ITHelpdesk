// Single entry point for every AI feature.
// Each function calls the Supabase Edge Function "ai" (which holds the Gemini key).
// If the function is not deployed / Gemini is down, it falls back to the local rules in
// mockAIService.js, so the app never breaks. Every result carries src: 'gemini' | 'local'.
import {supabase,configured} from '../lib/supabase'
import * as local from './mockAIService'
import {countBy,isDone,slaState,techStats} from '../utils/helpers'

export const aiState={mode:'unknown',error:null,at:null}   // read by the Settings page

async function call(action,payload){
 if(!configured)throw new Error('Supabase is not configured')
 const {data,error}=await supabase.functions.invoke('ai',{body:{action,payload}})
 if(error){let msg=error.message;try{const j=await error.context?.json();if(j?.error)msg=j.error}catch{}
  throw new Error(msg)}
 if(!data||data.error)throw new Error(data?.error||'Empty response from AI function')
 return data.data}

async function withFallback(action,payload,fallback){
 try{const d=await call(action,payload);Object.assign(aiState,{mode:'gemini',error:null,at:Date.now()});return {...d,src:'gemini'}}
 catch(e){Object.assign(aiState,{mode:'local',error:e.message,at:Date.now()});console.warn(`[AI] ${action} fell back to local rules:`,e.message)
  return {...(await fallback()),src:'local'}}}

export const pingAI=async()=>{try{const d=await call('ping',{});return {ok:true,...d}}catch(e){return {ok:false,error:e.message}}}

const band=s=>s>=80?'Critical':s>=60?'High':s>=35?'Medium':'Low'
const BANDS={Low:[5,34],Medium:[35,59],High:[60,79],Critical:[80,99]}

// ---- chat assistant ---------------------------------------------------------------------------
export const chatReply=({message,history,user,tickets})=>withFallback('chat',
 {message,history,user:{name:user.name,dept:user.dept},
  tickets:tickets.map(t=>({id:t.id,title:t.title,status:t.status,priority:t.priority,created:t.created}))},
 async()=>{const r=local.reply(message);return {...r,ticket:null}})

// ---- ticket scoring (category, priority, 4 sub-scores, sentiment) ------------------------------
export async function analyzeTicket(f,tickets=[],seed=0){
 const recent=tickets.filter(t=>t.category===f.category&&Date.now()-new Date(t.created)<14*864e5).length
 const r=await withFallback('analyze_ticket',{title:f.title,desc:f.desc,device:f.device,category:f.category,dept:f.dept,priority:f.priority||'Auto',recentSameCategory:recent},
  async()=>{const p=f.priority&&f.priority!=='Auto'?f.priority:'Medium';const s=local.scoreTicket(p,seed)
   return {...s,priority:p,category:f.category&&f.category!=='Auto'?f.category:local.guessCategory(f.title+' '+(f.desc||'')),sentiment:'Neutral'}})
 // The employee can pin a priority. Keep the score inside that priority's band so the two never disagree.
 if(f.priority&&f.priority!=='Auto'&&BANDS[f.priority]){const [lo,hi]=BANDS[f.priority];r.score=Math.max(lo,Math.min(hi,r.score));r.priority=f.priority}
 else r.priority=band(r.score)
 return r}

// ---- ticket briefing (cached so re-opening a ticket does not call Gemini again) ---------------
const sumCache=new Map()
export const summarizeTicket=async t=>{
 const k=`${t.id}|${t.status}|${t.priority}|${t.comments.length}`
 if(sumCache.has(k))return sumCache.get(k)
 const r=await withFallback('summarize',{ticket:t},async()=>local.summarize(t))
 if(r.src==='gemini')sumCache.set(k,r)
 return r}

// ---- chat transcript analysis (sentiment / frustration for the admin Conversations page) ------
export const analyzeConversation=(messages,employee)=>withFallback('analyze_conversation',{messages,employee},async()=>{
 const text=messages.filter(m=>m.from==='user').map(m=>m.text).join(' ').toLowerCase()
 const bad=/(again|still|third|not working|urgent|blocking|useless|angry|frustrat)/.test(text)
 return {sentiment:bad?'Frustrated':'Neutral',frustration:bad?70:30,urgency:bad?'High':'Medium',
  summary:`${employee} contacted the AI assistant: "${(messages.find(m=>m.from==='user')?.text||'').slice(0,90)}".`,
  recommended_action:bad?'Prioritise and contact the employee directly.':'Follow standard resolution workflow.',key_phrases:[]}})

// ---- admin "ask your IT data" -----------------------------------------------------------------
export const buildContext=({tickets,users,conversations})=>{
 const live=tickets.filter(t=>!isDone(t)),techs=users.filter(u=>u.role==='Technician')
 return {totalTickets:tickets.length,unresolvedTickets:live.length,totalUsers:users.length,activeUsers:users.filter(u=>u.status==='Active').length,
  ticketsByStatus:countBy(tickets,t=>t.status),ticketsByPriority:countBy(tickets,t=>t.priority),ticketsByCategory:countBy(tickets,t=>t.category),
  ticketsByDepartment:countBy(tickets,t=>t.dept),ticketSentiment:countBy(tickets,t=>t.sentiment),conversationSentiment:countBy(conversations,c=>c.sentiment),
  slaBreachedOpen:live.filter(t=>slaState(t)==='Breached').length,slaAtRiskOpen:live.filter(t=>slaState(t)==='At Risk').length,
  technicians:techs.map(t=>({name:t.name,specialization:t.spec,...(({active,resolved})=>({active,resolved}))(techStats(t,tickets))})),
  topUnresolvedByScore:[...live].sort((a,b)=>b.score-a.score).slice(0,15).map(t=>({id:t.id,title:t.title,dept:t.dept,priority:t.priority,score:t.score,status:t.status,sla:slaState(t)}))}}
export const askData=async(question,ctx)=>{
 const r=await withFallback('ask',{question,context:buildContext(ctx)},async()=>({answer:local.ask(question,ctx)}))
 return r}
