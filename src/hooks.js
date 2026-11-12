import {useState,useEffect} from 'react'
import {summarizeTicket} from './services/aiService'
// Loads the AI briefing for a ticket. Re-runs when the ticket's status / priority / comments change.
export function useTicketSummary(t){
 const [s,setS]=useState({loading:true,data:null})
 const key=t?`${t.id}|${t.status}|${t.priority}|${t.comments.length}`:''
 useEffect(()=>{if(!t)return;let live=true;setS({loading:true,data:null})
  summarizeTicket(t).then(d=>live&&setS({loading:false,data:d}))
  return()=>{live=false}},[key])   // eslint-disable-line
 return s}
