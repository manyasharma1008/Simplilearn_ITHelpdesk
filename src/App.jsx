import {Routes,Route,Navigate} from 'react-router-dom'
import Layout from './components/layout/Layout'
import Overview from './pages/admin/Overview'
import AIIntelligence from './pages/admin/AIIntelligence'
import Tickets from './pages/admin/Tickets'
import Users from './pages/admin/Users'
import {Conversations,Technicians,Departments,SLA,KnowledgeBase,Reports,SettingsPage} from './pages/admin/Misc'
import {EmployeeDashboard,AIChat,CreateTicket,Notifications,Profile} from './pages/employee/Employee'
import TechnicianDashboard from './pages/technician/TechnicianDashboard'
import Landing from './pages/Landing'
import {AppProvider} from './context/AppContext'
function AppRoutes(){return (<Routes>
 <Route path="/admin" element={<Layout role="admin"/>}><Route index element={<Overview/>}/><Route path="ai" element={<AIIntelligence/>}/><Route path="tickets" element={<Tickets/>}/><Route path="conversations" element={<Conversations/>}/><Route path="users" element={<Users/>}/><Route path="technicians" element={<Technicians/>}/><Route path="departments" element={<Departments/>}/><Route path="sla" element={<SLA/>}/><Route path="kb" element={<KnowledgeBase/>}/><Route path="reports" element={<Reports/>}/><Route path="settings" element={<SettingsPage/>}/></Route>
 <Route path="/employee" element={<Layout role="employee"/>}><Route index element={<EmployeeDashboard/>}/><Route path="chat" element={<AIChat/>}/><Route path="create" element={<CreateTicket/>}/><Route path="tickets" element={<Tickets scope="employee"/>}/><Route path="notifications" element={<Notifications/>}/><Route path="profile" element={<Profile/>}/></Route>
 <Route path="/technician" element={<Layout role="technician"/>}><Route index element={<TechnicianDashboard/>}/><Route path="tickets" element={<Tickets scope="technician"/>}/><Route path="kb" element={<KnowledgeBase/>}/></Route>
 <Route path="*" element={<Navigate to="/admin" replace/>}/></Routes>)}
export default function App(){return (<Routes><Route path="/" element={<Landing/>}/><Route path="/*" element={<AppProvider><AppRoutes/></AppProvider>}/></Routes>)}
