// HelpDesk AI: single-file app (landing + admin, technician and employee portals, Supabase data).
// Setup:
//   npm create vite@latest helpdesk -- --template react && cd helpdesk
//   npm i react-router-dom lucide-react recharts @supabase/supabase-js
//   npm i -D tailwindcss@3 postcss autoprefixer && npx tailwindcss init -p
//   tailwind.config.js -> content: ['./index.html','./src/**/*.{js,jsx}']
//   src/index.css      -> @tailwind base; @tailwind components; @tailwind utilities;
//   src/main.jsx       -> import App from './App'; createRoot(document.getElementById('root')).render(<App/>)
//   .env               -> VITE_SUPABASE_URL=...  VITE_SUPABASE_ANON_KEY=...  (anon key only)
//   Seed data: run npm run dev, open /setup, copy or download ps4_it_helpdesk.sql and run it in the Supabase SQL editor.
//   Replace this file as src/App.jsx.
import {createClient} from '@supabase/supabase-js'
import {AlertTriangle,ArrowRight,BarChart3,Bell,BookOpen,Bot,Building2,Check,CheckCircle2,Download,FolderOpen,Gauge,LayoutDashboard,ListChecks,Loader,Menu,MessageCircle,MessageSquare,Paperclip,Plus,PlusCircle,Search,Send,Settings,Sparkles,Star,Ticket,Timer,User,UserCheck,Users,Wrench,X,Zap} from 'lucide-react'
import {Bar as RBar,BarChart,CartesianGrid,Cell,Legend,Line,LineChart,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts'
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react'
import {BrowserRouter,Link,NavLink,Navigate,Outlet,Route,Routes,useNavigate,useSearchParams} from 'react-router-dom'

const CSS=`@import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@500,700,800&f[]=satoshi@500,700&display=swap');
*,::before,::after{border-color:#000}
body{background:#ffe17c;color:#000;font-family:Satoshi,system-ui,sans-serif;font-weight:500;-webkit-font-smoothing:antialiased}
h1,h2,h3,.font-display{font-family:'Cabinet Grotesk',Satoshi,sans-serif}
h1,h2,h3{font-weight:800;letter-spacing:-0.025em}
.dots{background-image:radial-gradient(rgba(0,0,0,.1) 2px,transparent 2px);background-size:32px 32px}
@keyframes marquee{to{transform:translateX(-50%)}}
.marquee{animation:marquee 30s linear infinite;width:max-content}
@media (prefers-reduced-motion:reduce){.marquee{animation:none}}`
const SEED_SQL=`-- PS4: IT Helpdesk Ticket Agent (IT services)
-- Seed file: ps4_it_helpdesk.sql  (Postgres / Supabase). All company names and records are made up.
-- Contents: 61 profiles (50 employees, 8 technicians, 3 admins), 100 tickets, 30 conversations.

drop table if exists conversation_messages, conversations, ticket_comments, ticket_history, tickets, profiles cascade;

create table profiles(id text primary key,name text not null,email text unique not null,dept text,role text check(role in('Employee','Technician','Admin')),status text check(status in('Active','Inactive','Pending')),specialization text,last_active_hours int,joined_days_ago int);
create table tickets(id text primary key,title text not null,description text,category text,device text,dept text,employee_id text references profiles(id),employee_name text,
 priority text check(priority in('Low','Medium','High','Critical')),ai_score int,impact int,severity int,urgency int,recurrence int,score_reason text,
 status text check(status in('Open','Assigned','In Progress','Pending Employee','Resolved','Closed','Reopened')),technician_id text references profiles(id),sentiment text,created_at timestamptz default now());
create table ticket_history(id serial primary key,ticket_id text references tickets(id) on delete cascade,status text,at timestamptz);
create table ticket_comments(id serial primary key,ticket_id text references tickets(id) on delete cascade,author text,body text,at timestamptz default now());
create table conversations(id text primary key,ticket_id text references tickets(id),employee_name text,dept text,category text,sentiment text,frustration int,urgency text,summary text,recommended_action text,key_phrases text[],created_at timestamptz);
create table conversation_messages(id serial primary key,conversation_id text references conversations(id) on delete cascade,seq int,sender text check(sender in('user','ai')),body text);
create index on tickets(status);create index on tickets(employee_id);create index on tickets(technician_id);

insert into profiles values
('EMP-1001','Aarav Sharma','aarav.sharma@nexora.in','IT Services','Admin','Active',NULL,0,209),
('EMP-1002','Priya Krishnan','priya.krishnan@nexora.in','IT Services','Admin','Active',NULL,52,105),
('EMP-1003','Rohan Nair','rohan.nair@nexora.in','IT Services','Admin','Active',NULL,27,78),
('EMP-1004','Ananya Verma','ananya.verma@nexora.in','IT Services','Technician','Active','Hardware',70,204),
('EMP-1005','Vikram Gupta','vikram.gupta@nexora.in','IT Services','Technician','Active','Network',38,102),
('EMP-1006','Kavya Reddy','kavya.reddy@nexora.in','IT Services','Technician','Active','Software',7,326),
('EMP-1007','Arjun Rao','arjun.rao@nexora.in','IT Services','Technician','Active','Security',64,180),
('EMP-1008','Meera Menon','meera.menon@nexora.in','IT Services','Technician','Active','Email',17,98),
('EMP-1009','Karthik Iyer','karthik.iyer@nexora.in','IT Services','Technician','Active','Account Access',13,129),
('EMP-1010','Divya Das','divya.das@nexora.in','IT Services','Technician','Active','Hardware',7,322),
('EMP-1011','Siddharth Patel','siddharth.patel@nexora.in','IT Services','Technician','Active','Network',38,337),
('EMP-1012','Lakshmi Sharma','lakshmi.sharma@nexora.in','Operations','Employee','Active',NULL,5,215),
('EMP-1013','Aarav Krishnan','aarav.krishnan@nexora.in','Finance','Employee','Active',NULL,62,185),
('EMP-1014','Priya Nair','priya.nair@nexora.in','Sales','Employee','Active',NULL,32,93),
('EMP-1015','Rohan Verma','rohan.verma@nexora.in','Engineering','Employee','Active',NULL,1,397),
('EMP-1016','Ananya Gupta','ananya.gupta@nexora.in','Customer Support','Employee','Inactive',NULL,56,228),
('EMP-1017','Vikram Reddy','vikram.reddy@nexora.in','Legal','Employee','Active',NULL,44,137),
('EMP-1018','Kavya Rao','kavya.rao@nexora.in','Sales','Employee','Active',NULL,19,140),
('EMP-1019','Arjun Menon','arjun.menon@nexora.in','Operations','Employee','Pending',NULL,26,21),
('EMP-1020','Meera Iyer','meera.iyer@nexora.in','Marketing','Employee','Active',NULL,11,181),
('EMP-1021','Karthik Das','karthik.das@nexora.in','HR','Employee','Active',NULL,13,25),
('EMP-1022','Divya Patel','divya.patel@nexora.in','Customer Support','Employee','Active',NULL,39,35),
('EMP-1023','Siddharth Sharma','siddharth.sharma@nexora.in','Customer Support','Employee','Active',NULL,31,280),
('EMP-1024','Lakshmi Krishnan','lakshmi.krishnan@nexora.in','Finance','Employee','Active',NULL,39,398),
('EMP-1025','Aarav Nair','aarav.nair@nexora.in','Finance','Employee','Active',NULL,49,159),
('EMP-1026','Priya Verma','priya.verma@nexora.in','Sales','Employee','Active',NULL,53,71),
('EMP-1027','Rohan Gupta','rohan.gupta@nexora.in','Legal','Employee','Inactive',NULL,58,38),
('EMP-1028','Ananya Reddy','ananya.reddy@nexora.in','Engineering','Employee','Active',NULL,9,254),
('EMP-1029','Vikram Rao','vikram.rao@nexora.in','Sales','Employee','Active',NULL,17,202),
('EMP-1030','Kavya Menon','kavya.menon@nexora.in','Marketing','Employee','Active',NULL,7,393),
('EMP-1031','Arjun Iyer','arjun.iyer@nexora.in','HR','Employee','Active',NULL,55,106),
('EMP-1032','Meera Das','meera.das@nexora.in','Operations','Employee','Pending',NULL,65,186),
('EMP-1033','Karthik Patel','karthik.patel@nexora.in','Sales','Employee','Active',NULL,66,186),
('EMP-1034','Divya Sharma','divya.sharma@nexora.in','Customer Support','Employee','Active',NULL,23,317),
('EMP-1035','Siddharth Krishnan','siddharth.krishnan@nexora.in','Legal','Employee','Active',NULL,53,222),
('EMP-1036','Lakshmi Nair','lakshmi.nair@nexora.in','Legal','Employee','Active',NULL,38,122),
('EMP-1037','Aarav Verma','aarav.verma@nexora.in','HR','Employee','Active',NULL,22,178),
('EMP-1038','Priya Gupta','priya.gupta@nexora.in','Marketing','Employee','Inactive',NULL,46,25),
('EMP-1039','Rohan Reddy','rohan.reddy@nexora.in','Sales','Employee','Active',NULL,32,3),
('EMP-1040','Ananya Rao','ananya.rao@nexora.in','Operations','Employee','Active',NULL,27,178),
('EMP-1041','Vikram Menon','vikram.menon@nexora.in','Customer Support','Employee','Active',NULL,9,171),
('EMP-1042','Kavya Iyer','kavya.iyer@nexora.in','HR','Employee','Active',NULL,29,97),
('EMP-1043','Arjun Das','arjun.das@nexora.in','HR','Employee','Active',NULL,51,374),
('EMP-1044','Meera Patel','meera.patel@nexora.in','Engineering','Employee','Active',NULL,34,328),
('EMP-1045','Karthik Sharma','karthik.sharma@nexora.in','Marketing','Employee','Pending',NULL,9,160),
('EMP-1046','Divya Krishnan','divya.krishnan@nexora.in','Finance','Employee','Active',NULL,58,156),
('EMP-1047','Siddharth Nair','siddharth.nair@nexora.in','Engineering','Employee','Active',NULL,43,134),
('EMP-1048','Lakshmi Verma','lakshmi.verma@nexora.in','HR','Employee','Active',NULL,27,125),
('EMP-1049','Aarav Gupta','aarav.gupta@nexora.in','Marketing','Employee','Inactive',NULL,14,113),
('EMP-1050','Priya Reddy','priya.reddy@nexora.in','Customer Support','Employee','Active',NULL,14,264),
('EMP-1051','Rohan Rao','rohan.rao@nexora.in','Marketing','Employee','Active',NULL,56,50),
('EMP-1052','Ananya Menon','ananya.menon@nexora.in','HR','Employee','Active',NULL,16,119),
('EMP-1053','Vikram Iyer','vikram.iyer@nexora.in','Finance','Employee','Active',NULL,68,290),
('EMP-1054','Kavya Das','kavya.das@nexora.in','Marketing','Employee','Active',NULL,37,195),
('EMP-1055','Arjun Patel','arjun.patel@nexora.in','HR','Employee','Active',NULL,21,155),
('EMP-1056','Meera Sharma','meera.sharma@nexora.in','Sales','Employee','Active',NULL,30,128),
('EMP-1057','Karthik Krishnan','karthik.krishnan@nexora.in','HR','Employee','Active',NULL,7,291),
('EMP-1058','Divya Nair','divya.nair@nexora.in','Sales','Employee','Pending',NULL,0,140),
('EMP-1059','Siddharth Verma','siddharth.verma@nexora.in','Marketing','Employee','Active',NULL,13,348),
('EMP-1060','Lakshmi Gupta','lakshmi.gupta@nexora.in','Customer Support','Employee','Inactive',NULL,69,317),
('EMP-1061','Aarav Reddy','aarav.reddy@nexora.in','Finance','Employee','Active',NULL,36,78);

insert into tickets values
('TKT-2001','Unauthorized login attempt','Unauthorized login attempt. Started this morning and is blocking my work. Already restarted once.','Security','MacBook Pro 14','Operations','EMP-1012','Lakshmi Sharma','High',72,74,74,74,63,'High priority: moderate productivity impact, workaround may exist.','Closed','EMP-1011','Frustrated',now() - interval '14640 minutes'),
('TKT-2002','Laptop will not boot','Laptop will not boot. Started this morning and is blocking my work. Already restarted once.','Hardware','HP EliteBook 840','Sales','EMP-1014','Priya Nair','Medium',54,53,58,55,49,'Medium priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1005','Neutral',now() - interval '4080 minutes'),
('TKT-2003','Emails stuck in outbox','Emails stuck in outbox. Started this morning and is blocking my work. Already restarted once.','Email','Lenovo ThinkPad T14','Marketing','EMP-1059','Siddharth Verma','Medium',54,51,58,55,46,'Medium priority: moderate productivity impact, workaround may exist.','Pending Employee','EMP-1004','Negative',now() - interval '11220 minutes'),
('TKT-2004','Keyboard keys unresponsive','Keyboard keys unresponsive. Started this morning and is blocking my work. Already restarted once.','Hardware','MacBook Pro 14','HR','EMP-1042','Kavya Iyer','High',78,81,81,80,69,'High priority: broad business impact and high technical severity.','Assigned','EMP-1008','Positive',now() - interval '5760 minutes'),
('TKT-2005','Password reset not working','Password reset not working. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell U2722 Monitor','Operations','EMP-1019','Arjun Menon','High',73,73,76,74,62,'High priority: moderate productivity impact, workaround may exist.','Open',NULL,'Neutral',now() - interval '7380 minutes'),
('TKT-2006','Keyboard keys unresponsive','Keyboard keys unresponsive. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell U2722 Monitor','HR','EMP-1031','Arjun Iyer','High',74,71,78,76,65,'High priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1008','Positive',now() - interval '7860 minutes'),
('TKT-2007','Missing calendar invites','Missing calendar invites. Started this morning and is blocking my work. Already restarted once.','Email','HP EliteBook 840','Operations','EMP-1012','Lakshmi Sharma','Medium',52,52,54,51,46,'Medium priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1011','Frustrated',now() - interval '600 minutes'),
('TKT-2008','Slow internet on floor 3','Slow internet on floor 3. Started this morning and is blocking my work. Already restarted once.','Network','Lenovo ThinkPad T14','Sales','EMP-1056','Meera Sharma','Medium',45,47,45,43,37,'Medium priority: limited impact on a single user.','In Progress','EMP-1009','Neutral',now() - interval '0 minutes'),
('TKT-2009','Password reset not working','Password reset not working. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell U2722 Monitor','Customer Support','EMP-1050','Priya Reddy','Low',30,27,33,30,26,'Low priority: limited impact on a single user.','Resolved','EMP-1007','Neutral',now() - interval '33780 minutes'),
('TKT-2010','Lost company device','Lost company device. Started this morning and is blocking my work. Already restarted once.','Security','MacBook Pro 14','Marketing','EMP-1030','Kavya Menon','High',72,70,74,72,62,'High priority: moderate productivity impact, workaround may exist.','Assigned','EMP-1010','Positive',now() - interval '900 minutes'),
('TKT-2011','Slow internet on floor 3','Slow internet on floor 3. Started this morning and is blocking my work. Already restarted once.','Network','Lenovo ThinkPad T14','Sales','EMP-1026','Priya Verma','Low',26,26,30,28,20,'Low priority: limited impact on a single user.','Reopened','EMP-1010','Negative',now() - interval '4620 minutes'),
('TKT-2012','Cannot connect to office Wi-Fi','Cannot connect to office Wi-Fi. Started this morning and is blocking my work. Already restarted once.','Network','HP EliteBook 840','HR','EMP-1052','Ananya Menon','High',78,78,81,78,68,'High priority: broad business impact and high technical severity.','Pending Employee','EMP-1008','Positive',now() - interval '2460 minutes'),
('TKT-2013','Password reset not working','Password reset not working. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell Latitude 5440','Operations','EMP-1012','Lakshmi Sharma','Medium',48,47,51,47,39,'Medium priority: limited impact on a single user.','In Progress','EMP-1004','Neutral',now() - interval '2880 minutes'),
('TKT-2014','Outlook not syncing','Outlook not syncing. Started this morning and is blocking my work. Already restarted once.','Email','HP EliteBook 840','Marketing','EMP-1038','Priya Gupta','Critical',93,91,93,92,87,'Critical priority: broad business impact and high technical severity.','In Progress','EMP-1004','Neutral',now() - interval '240 minutes'),
('TKT-2015','Missing calendar invites','Missing calendar invites. Started this morning and is blocking my work. Already restarted once.','Email','MacBook Pro 14','Sales','EMP-1014','Priya Nair','Medium',45,43,45,45,38,'Medium priority: limited impact on a single user.','Closed','EMP-1011','Neutral',now() - interval '22980 minutes'),
('TKT-2016','Missing calendar invites','Missing calendar invites. Started this morning and is blocking my work. Already restarted once.','Email','HP EliteBook 840','Marketing','EMP-1038','Priya Gupta','Medium',45,46,45,47,39,'Medium priority: limited impact on a single user.','In Progress','EMP-1009','Neutral',now() - interval '6120 minutes'),
('TKT-2017','VPN keeps dropping','VPN keeps dropping. Started this morning and is blocking my work. Already restarted once.','Network','Dell Latitude 5440','Engineering','EMP-1028','Ananya Reddy','High',71,71,72,72,63,'High priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1007','Negative',now() - interval '24120 minutes'),
('TKT-2018','Lost company device','Lost company device. Started this morning and is blocking my work. Already restarted once.','Security','MacBook Pro 14','HR','EMP-1043','Arjun Das','High',79,81,83,80,68,'High priority: broad business impact and high technical severity.','Assigned','EMP-1006','Neutral',now() - interval '60 minutes'),
('TKT-2019','Docking station not detected','Docking station not detected. Started this morning and is blocking my work. Already restarted once.','Hardware','HP EliteBook 840','Operations','EMP-1012','Lakshmi Sharma','Low',24,23,26,26,12,'Low priority: limited impact on a single user.','Reopened','EMP-1007','Neutral',now() - interval '12720 minutes'),
('TKT-2020','Need access to finance folder','Need access to finance folder. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell U2722 Monitor','HR','EMP-1048','Lakshmi Verma','Medium',50,47,50,47,46,'Medium priority: moderate productivity impact, workaround may exist.','Assigned','EMP-1011','Frustrated',now() - interval '5400 minutes'),
('TKT-2021','VPN keeps dropping','VPN keeps dropping. Started this morning and is blocking my work. Already restarted once.','Network','HP EliteBook 840','Finance','EMP-1025','Aarav Nair','Medium',51,54,52,53,45,'Medium priority: moderate productivity impact, workaround may exist.','Closed','EMP-1006','Negative',now() - interval '18780 minutes'),
('TKT-2022','Outlook not syncing','Outlook not syncing. Started this morning and is blocking my work. Already restarted once.','Email','HP EliteBook 840','Customer Support','EMP-1050','Priya Reddy','High',79,80,83,78,70,'High priority: broad business impact and high technical severity.','Reopened','EMP-1011','Neutral',now() - interval '7200 minutes'),
('TKT-2023','Excel crashes on launch','Excel crashes on launch. Started this morning and is blocking my work. Already restarted once.','Software','HP EliteBook 840','Customer Support','EMP-1060','Lakshmi Gupta','Medium',51,54,52,53,45,'Medium priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1010','Negative',now() - interval '12540 minutes'),
('TKT-2024','IDE freezing on startup','IDE freezing on startup. Started this morning and is blocking my work. Already restarted once.','Software','Lenovo ThinkPad T14','Operations','EMP-1012','Lakshmi Sharma','Low',23,26,24,20,16,'Low priority: limited impact on a single user.','Pending Employee','EMP-1010','Positive',now() - interval '2460 minutes'),
('TKT-2025','Lost company device','Lost company device. Started this morning and is blocking my work. Already restarted once.','Security','Lenovo ThinkPad T14','Operations','EMP-1012','Lakshmi Sharma','Medium',47,47,49,45,42,'Medium priority: limited impact on a single user.','Resolved','EMP-1005','Frustrated',now() - interval '20880 minutes'),
('TKT-2026','Suspicious phishing email','Suspicious phishing email. Started this morning and is blocking my work. Already restarted once.','Security','HP EliteBook 840','Marketing','EMP-1051','Rohan Rao','High',79,77,83,78,67,'High priority: broad business impact and high technical severity.','Assigned','EMP-1011','Frustrated',now() - interval '6480 minutes'),
('TKT-2027','Locked out of account','Locked out of account. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell Latitude 5440','Operations','EMP-1019','Arjun Menon','High',77,80,79,78,72,'High priority: broad business impact and high technical severity.','Assigned','EMP-1011','Frustrated',now() - interval '8340 minutes'),
('TKT-2028','Outlook not syncing','Outlook not syncing. Started this morning and is blocking my work. Already restarted once.','Email','Dell U2722 Monitor','Customer Support','EMP-1060','Lakshmi Gupta','High',76,77,77,74,65,'High priority: broad business impact and high technical severity.','Assigned','EMP-1010','Positive',now() - interval '4260 minutes'),
('TKT-2029','Excel crashes on launch','Excel crashes on launch. Started this morning and is blocking my work. Already restarted once.','Software','Dell Latitude 5440','Finance','EMP-1024','Lakshmi Krishnan','Critical',88,86,88,88,81,'Critical priority: broad business impact and high technical severity.','In Progress','EMP-1006','Frustrated',now() - interval '12240 minutes'),
('TKT-2030','Slow internet on floor 3','Slow internet on floor 3. Started this morning and is blocking my work. Already restarted once.','Network','Dell U2722 Monitor','HR','EMP-1043','Arjun Das','Medium',46,49,47,43,39,'Medium priority: limited impact on a single user.','Resolved','EMP-1008','Neutral',now() - interval '17820 minutes'),
('TKT-2031','Outlook not syncing','Outlook not syncing. Started this morning and is blocking my work. Already restarted once.','Email','HP EliteBook 840','Operations','EMP-1012','Lakshmi Sharma','Medium',45,45,45,45,41,'Medium priority: limited impact on a single user.','Pending Employee','EMP-1010','Neutral',now() - interval '10560 minutes'),
('TKT-2032','Monitor flickering','Monitor flickering. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell U2722 Monitor','Marketing','EMP-1049','Aarav Gupta','Medium',49,51,53,51,37,'Medium priority: limited impact on a single user.','Reopened','EMP-1007','Negative',now() - interval '12780 minutes'),
('TKT-2033','Locked out of account','Locked out of account. Started this morning and is blocking my work. Already restarted once.','Account Access','Lenovo ThinkPad T14','Engineering','EMP-1044','Meera Patel','Low',26,24,30,24,15,'Low priority: limited impact on a single user.','Closed','EMP-1008','Negative',now() - interval '25800 minutes'),
('TKT-2034','Antivirus alert on laptop','Antivirus alert on laptop. Started this morning and is blocking my work. Already restarted once.','Security','MacBook Pro 14','Legal','EMP-1017','Vikram Reddy','Medium',45,45,45,45,41,'Medium priority: limited impact on a single user.','Resolved','EMP-1011','Neutral',now() - interval '23220 minutes'),
('TKT-2035','Password reset not working','Password reset not working. Started this morning and is blocking my work. Already restarted once.','Account Access','MacBook Pro 14','Sales','EMP-1018','Kavya Rao','Critical',88,91,88,88,78,'Critical priority: broad business impact and high technical severity.','Assigned','EMP-1004','Frustrated',now() - interval '5700 minutes'),
('TKT-2036','Laptop will not boot','Laptop will not boot. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell Latitude 5440','Engineering','EMP-1047','Siddharth Nair','Medium',53,55,56,53,46,'Medium priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1004','Neutral',now() - interval '6120 minutes'),
('TKT-2037','VPN client install fails','VPN client install fails. Started this morning and is blocking my work. Already restarted once.','Software','Lenovo ThinkPad T14','Operations','EMP-1012','Lakshmi Sharma','Critical',96,94,99,98,90,'Critical priority: broad business impact and high technical severity.','In Progress','EMP-1009','Positive',now() - interval '240 minutes'),
('TKT-2038','Design tool licence expired','Design tool licence expired. Started this morning and is blocking my work. Already restarted once.','Software','Lenovo ThinkPad T14','Marketing','EMP-1054','Kavya Das','Critical',96,97,99,98,84,'Critical priority: broad business impact and high technical severity.','Resolved','EMP-1009','Neutral',now() - interval '17040 minutes'),
('TKT-2039','Design tool licence expired','Design tool licence expired. Started this morning and is blocking my work. Already restarted once.','Software','Dell U2722 Monitor','Finance','EMP-1046','Divya Krishnan','Medium',48,49,51,45,44,'Medium priority: limited impact on a single user.','Reopened','EMP-1009','Neutral',now() - interval '900 minutes'),
('TKT-2040','Design tool licence expired','Design tool licence expired. Started this morning and is blocking my work. Already restarted once.','Software','MacBook Pro 14','HR','EMP-1052','Ananya Menon','High',78,78,81,78,68,'High priority: broad business impact and high technical severity.','Pending Employee','EMP-1010','Frustrated',now() - interval '240 minutes'),
('TKT-2041','Suspicious phishing email','Suspicious phishing email. Started this morning and is blocking my work. Already restarted once.','Security','MacBook Pro 14','Sales','EMP-1033','Karthik Patel','Critical',92,93,96,90,84,'Critical priority: broad business impact and high technical severity.','Reopened','EMP-1007','Frustrated',now() - interval '10500 minutes'),
('TKT-2042','Excel crashes on launch','Excel crashes on launch. Started this morning and is blocking my work. Already restarted once.','Software','Lenovo ThinkPad T14','Marketing','EMP-1054','Kavya Das','High',75,76,75,72,68,'High priority: broad business impact and high technical severity.','Closed','EMP-1008','Negative',now() - interval '20400 minutes'),
('TKT-2043','Slow internet on floor 3','Slow internet on floor 3. Started this morning and is blocking my work. Already restarted once.','Network','Dell Latitude 5440','Operations','EMP-1012','Lakshmi Sharma','Low',26,23,30,26,19,'Low priority: limited impact on a single user.','Assigned','EMP-1005','Negative',now() - interval '9000 minutes'),
('TKT-2044','Monitor flickering','Monitor flickering. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell Latitude 5440','Engineering','EMP-1047','Siddharth Nair','High',72,75,74,72,68,'High priority: moderate productivity impact, workaround may exist.','Reopened','EMP-1010','Frustrated',now() - interval '11280 minutes'),
('TKT-2045','Need access to finance folder','Need access to finance folder. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell Latitude 5440','Engineering','EMP-1047','Siddharth Nair','Critical',94,97,95,96,88,'Critical priority: broad business impact and high technical severity.','In Progress','EMP-1008','Negative',now() - interval '13680 minutes'),
('TKT-2046','Suspicious phishing email','Suspicious phishing email. Started this morning and is blocking my work. Already restarted once.','Security','Dell U2722 Monitor','Legal','EMP-1027','Rohan Gupta','High',71,69,72,72,60,'High priority: moderate productivity impact, workaround may exist.','Resolved','EMP-1005','Negative',now() - interval '25500 minutes'),
('TKT-2047','Antivirus alert on laptop','Antivirus alert on laptop. Started this morning and is blocking my work. Already restarted once.','Security','Dell U2722 Monitor','Engineering','EMP-1015','Rohan Verma','Low',22,24,22,20,14,'Low priority: limited impact on a single user.','Pending Employee','EMP-1008','Negative',now() - interval '9840 minutes'),
('TKT-2048','Suspicious phishing email','Suspicious phishing email. Started this morning and is blocking my work. Already restarted once.','Security','MacBook Pro 14','Legal','EMP-1035','Siddharth Krishnan','Low',26,27,30,24,18,'Low priority: limited impact on a single user.','Open',NULL,'Positive',now() - interval '4680 minutes'),
('TKT-2049','Missing calendar invites','Missing calendar invites. Started this morning and is blocking my work. Already restarted once.','Email','Dell Latitude 5440','Operations','EMP-1012','Lakshmi Sharma','Low',24,25,26,24,17,'Low priority: limited impact on a single user.','Resolved','EMP-1011','Neutral',now() - interval '16920 minutes'),
('TKT-2050','Slow internet on floor 3','Slow internet on floor 3. Started this morning and is blocking my work. Already restarted once.','Network','Lenovo ThinkPad T14','HR','EMP-1037','Aarav Verma','Medium',53,50,56,51,42,'Medium priority: moderate productivity impact, workaround may exist.','Open',NULL,'Neutral',now() - interval '600 minutes'),
('TKT-2051','Shared drive unreachable','Shared drive unreachable. Started this morning and is blocking my work. Already restarted once.','Network','MacBook Pro 14','Finance','EMP-1025','Aarav Nair','Medium',48,46,51,49,43,'Medium priority: limited impact on a single user.','Assigned','EMP-1007','Negative',now() - interval '2220 minutes'),
('TKT-2052','Need access to finance folder','Need access to finance folder. Started this morning and is blocking my work. Already restarted once.','Account Access','MacBook Pro 14','Operations','EMP-1032','Meera Das','Medium',50,49,50,47,40,'Medium priority: moderate productivity impact, workaround may exist.','Open',NULL,'Neutral',now() - interval '14040 minutes'),
('TKT-2053','Monitor flickering','Monitor flickering. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell Latitude 5440','Finance','EMP-1013','Aarav Krishnan','High',76,73,77,76,66,'High priority: broad business impact and high technical severity.','Resolved','EMP-1009','Positive',now() - interval '18840 minutes'),
('TKT-2054','Excel crashes on launch','Excel crashes on launch. Started this morning and is blocking my work. Already restarted once.','Software','Lenovo ThinkPad T14','Legal','EMP-1036','Lakshmi Nair','Low',31,33,35,32,20,'Low priority: limited impact on a single user.','In Progress','EMP-1007','Neutral',now() - interval '7200 minutes'),
('TKT-2055','Mailbox full','Mailbox full. Started this morning and is blocking my work. Already restarted once.','Email','Dell U2722 Monitor','Operations','EMP-1012','Lakshmi Sharma','Medium',45,43,45,45,38,'Medium priority: limited impact on a single user.','Open',NULL,'Frustrated',now() - interval '12900 minutes'),
('TKT-2056','VPN client install fails','VPN client install fails. Started this morning and is blocking my work. Already restarted once.','Software','Dell U2722 Monitor','Sales','EMP-1033','Karthik Patel','High',76,76,77,78,67,'High priority: broad business impact and high technical severity.','Resolved','EMP-1004','Frustrated',now() - interval '28260 minutes'),
('TKT-2057','Design tool licence expired','Design tool licence expired. Started this morning and is blocking my work. Already restarted once.','Software','HP EliteBook 840','Marketing','EMP-1059','Siddharth Verma','Medium',50,48,50,51,42,'Medium priority: moderate productivity impact, workaround may exist.','Pending Employee','EMP-1005','Positive',now() - interval '4620 minutes'),
('TKT-2058','Design tool licence expired','Design tool licence expired. Started this morning and is blocking my work. Already restarted once.','Software','Dell Latitude 5440','Sales','EMP-1058','Divya Nair','High',74,77,78,72,69,'High priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1004','Neutral',now() - interval '5160 minutes'),
('TKT-2059','Locked out of account','Locked out of account. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell U2722 Monitor','Legal','EMP-1035','Siddharth Krishnan','Medium',54,56,58,55,43,'Medium priority: moderate productivity impact, workaround may exist.','Assigned','EMP-1004','Frustrated',now() - interval '8520 minutes'),
('TKT-2060','Lost company device','Lost company device. Started this morning and is blocking my work. Already restarted once.','Security','Dell U2722 Monitor','Customer Support','EMP-1050','Priya Reddy','Low',26,23,30,26,19,'Low priority: limited impact on a single user.','Resolved','EMP-1006','Negative',now() - interval '16620 minutes'),
('TKT-2061','Locked out of account','Locked out of account. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell Latitude 5440','Operations','EMP-1012','Lakshmi Sharma','Critical',95,95,97,94,89,'Critical priority: broad business impact and high technical severity.','Reopened','EMP-1005','Positive',now() - interval '13920 minutes'),
('TKT-2062','Laptop will not boot','Laptop will not boot. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell Latitude 5440','Finance','EMP-1061','Aarav Reddy','High',72,70,74,70,64,'High priority: moderate productivity impact, workaround may exist.','Closed','EMP-1006','Positive',now() - interval '17880 minutes'),
('TKT-2063','Docking station not detected','Docking station not detected. Started this morning and is blocking my work. Already restarted once.','Hardware','MacBook Pro 14','Engineering','EMP-1028','Ananya Reddy','Critical',92,89,96,92,85,'Critical priority: broad business impact and high technical severity.','Resolved','EMP-1006','Frustrated',now() - interval '39600 minutes'),
('TKT-2064','Laptop will not boot','Laptop will not boot. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell Latitude 5440','Customer Support','EMP-1034','Divya Sharma','Low',26,26,30,28,20,'Low priority: limited impact on a single user.','In Progress','EMP-1007','Neutral',now() - interval '60 minutes'),
('TKT-2065','Excel crashes on launch','Excel crashes on launch. Started this morning and is blocking my work. Already restarted once.','Software','HP EliteBook 840','Sales','EMP-1014','Priya Nair','Medium',45,45,45,45,41,'Medium priority: limited impact on a single user.','Assigned','EMP-1011','Negative',now() - interval '300 minutes'),
('TKT-2066','Cannot connect to office Wi-Fi','Cannot connect to office Wi-Fi. Started this morning and is blocking my work. Already restarted once.','Network','Lenovo ThinkPad T14','Engineering','EMP-1047','Siddharth Nair','Medium',53,51,56,53,49,'Medium priority: moderate productivity impact, workaround may exist.','Reopened','EMP-1010','Positive',now() - interval '2580 minutes'),
('TKT-2067','Cannot connect to office Wi-Fi','Cannot connect to office Wi-Fi. Started this morning and is blocking my work. Already restarted once.','Network','HP EliteBook 840','Operations','EMP-1012','Lakshmi Sharma','Low',30,31,33,28,25,'Low priority: limited impact on a single user.','Assigned','EMP-1004','Neutral',now() - interval '480 minutes'),
('TKT-2068','Excel crashes on launch','Excel crashes on launch. Started this morning and is blocking my work. Already restarted once.','Software','HP EliteBook 840','Sales','EMP-1014','Priya Nair','High',71,69,72,72,60,'High priority: moderate productivity impact, workaround may exist.','Open',NULL,'Negative',now() - interval '13980 minutes'),
('TKT-2069','Monitor flickering','Monitor flickering. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell Latitude 5440','Finance','EMP-1053','Vikram Iyer','Medium',50,53,50,51,39,'Medium priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1007','Neutral',now() - interval '17580 minutes'),
('TKT-2070','Locked out of account','Locked out of account. Started this morning and is blocking my work. Already restarted once.','Account Access','MacBook Pro 14','Marketing','EMP-1030','Kavya Menon','Medium',45,43,45,45,38,'Medium priority: limited impact on a single user.','Resolved','EMP-1011','Negative',now() - interval '16920 minutes'),
('TKT-2071','VPN client install fails','VPN client install fails. Started this morning and is blocking my work. Already restarted once.','Software','HP EliteBook 840','HR','EMP-1042','Kavya Iyer','Medium',49,48,53,49,45,'Medium priority: limited impact on a single user.','Reopened','EMP-1009','Positive',now() - interval '120 minutes'),
('TKT-2072','Monitor flickering','Monitor flickering. Started this morning and is blocking my work. Already restarted once.','Hardware','Dell Latitude 5440','Finance','EMP-1013','Aarav Krishnan','High',74,74,78,72,66,'High priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1007','Negative',now() - interval '5460 minutes'),
('TKT-2073','IDE freezing on startup','IDE freezing on startup. Started this morning and is blocking my work. Already restarted once.','Software','HP EliteBook 840','Operations','EMP-1012','Lakshmi Sharma','High',70,67,70,68,65,'High priority: moderate productivity impact, workaround may exist.','Pending Employee','EMP-1010','Positive',now() - interval '5340 minutes'),
('TKT-2074','Keyboard keys unresponsive','Keyboard keys unresponsive. Started this morning and is blocking my work. Already restarted once.','Hardware','Lenovo ThinkPad T14','Marketing','EMP-1045','Karthik Sharma','High',78,77,81,76,70,'High priority: broad business impact and high technical severity.','In Progress','EMP-1008','Neutral',now() - interval '180 minutes'),
('TKT-2075','Need access to finance folder','Need access to finance folder. Started this morning and is blocking my work. Already restarted once.','Account Access','Lenovo ThinkPad T14','Sales','EMP-1058','Divya Nair','Critical',97,96,100,96,85,'Critical priority: broad business impact and high technical severity.','In Progress','EMP-1006','Positive',now() - interval '2580 minutes'),
('TKT-2076','Suspicious phishing email','Suspicious phishing email. Started this morning and is blocking my work. Already restarted once.','Security','Dell U2722 Monitor','Sales','EMP-1039','Rohan Reddy','Medium',48,47,51,45,41,'Medium priority: limited impact on a single user.','In Progress','EMP-1004','Neutral',now() - interval '780 minutes'),
('TKT-2077','IDE freezing on startup','IDE freezing on startup. Started this morning and is blocking my work. Already restarted once.','Software','HP EliteBook 840','Customer Support','EMP-1022','Divya Patel','Medium',45,42,45,47,33,'Medium priority: limited impact on a single user.','Open',NULL,'Neutral',now() - interval '11400 minutes'),
('TKT-2078','Laptop will not boot','Laptop will not boot. Started this morning and is blocking my work. Already restarted once.','Hardware','HP EliteBook 840','Sales','EMP-1029','Vikram Rao','Low',23,22,24,22,17,'Low priority: limited impact on a single user.','Closed','EMP-1009','Neutral',now() - interval '29880 minutes'),
('TKT-2079','Cannot connect to office Wi-Fi','Cannot connect to office Wi-Fi. Started this morning and is blocking my work. Already restarted once.','Network','Dell U2722 Monitor','Operations','EMP-1012','Lakshmi Sharma','Critical',94,95,95,92,83,'Critical priority: broad business impact and high technical severity.','In Progress','EMP-1008','Neutral',now() - interval '20100 minutes'),
('TKT-2080','Suspicious phishing email','Suspicious phishing email. Started this morning and is blocking my work. Already restarted once.','Security','HP EliteBook 840','Customer Support','EMP-1023','Siddharth Sharma','High',73,75,76,72,67,'High priority: moderate productivity impact, workaround may exist.','Resolved','EMP-1004','Positive',now() - interval '14880 minutes'),
('TKT-2081','IDE freezing on startup','IDE freezing on startup. Started this morning and is blocking my work. Already restarted once.','Software','MacBook Pro 14','Legal','EMP-1017','Vikram Reddy','Critical',89,92,90,86,82,'Critical priority: broad business impact and high technical severity.','Open',NULL,'Positive',now() - interval '13020 minutes'),
('TKT-2082','Locked out of account','Locked out of account. Started this morning and is blocking my work. Already restarted once.','Account Access','Dell U2722 Monitor','Legal','EMP-1017','Vikram Reddy','Medium',49,48,53,49,45,'Medium priority: limited impact on a single user.','Closed','EMP-1005','Positive',now() - interval '39000 minutes'),
('TKT-2083','Locked out of account','Locked out of account. Started this morning and is blocking my work. Already restarted once.','Account Access','HP EliteBook 840','Customer Support','EMP-1034','Divya Sharma','Medium',49,50,53,49,39,'Medium priority: limited impact on a single user.','Closed','EMP-1011','Neutral',now() - interval '26400 minutes'),
('TKT-2084','Outlook not syncing','Outlook not syncing. Started this morning and is blocking my work. Already restarted once.','Email','HP EliteBook 840','Finance','EMP-1025','Aarav Nair','High',73,72,76,70,66,'High priority: moderate productivity impact, workaround may exist.','Assigned','EMP-1006','Neutral',now() - interval '1740 minutes'),
('TKT-2085','Cannot connect to office Wi-Fi','Cannot connect to office Wi-Fi. Started this morning and is blocking my work. Already restarted once.','Network','Lenovo ThinkPad T14','Operations','EMP-1012','Lakshmi Sharma','Low',25,28,28,26,17,'Low priority: limited impact on a single user.','Reopened','EMP-1004','Frustrated',now() - interval '7500 minutes'),
('TKT-2086','Password reset not working','Password reset not working. Started this morning and is blocking my work. Already restarted once.','Account Access','Lenovo ThinkPad T14','HR','EMP-1057','Karthik Krishnan','Low',25,25,28,24,16,'Low priority: limited impact on a single user.','Assigned','EMP-1005','Neutral',now() - interval '17460 minutes'),
('TKT-2087','Excel crashes on launch','Excel crashes on launch. Started this morning and is blocking my work. Already restarted once.','Software','Dell Latitude 5440','Finance','EMP-1061','Aarav Reddy','High',79,81,83,76,75,'High priority: broad business impact and high technical severity.','Closed','EMP-1011','Positive',now() - interval '36780 minutes'),
('TKT-2088','IDE freezing on startup','IDE freezing on startup. Started this morning and is blocking my work. Already restarted once.','Software','Lenovo ThinkPad T14','Customer Support','EMP-1023','Siddharth Sharma','High',78,77,81,76,70,'High priority: broad business impact and high technical severity.','In Progress','EMP-1008','Positive',now() - interval '10680 minutes'),
('TKT-2089','Keyboard keys unresponsive','Keyboard keys unresponsive. Started this morning and is blocking my work. Already restarted once.','Hardware','Lenovo ThinkPad T14','Marketing','EMP-1049','Aarav Gupta','Critical',94,93,95,94,87,'Critical priority: broad business impact and high technical severity.','Closed','EMP-1007','Neutral',now() - interval '17220 minutes'),
('TKT-2090','Design tool licence expired','Design tool licence expired. Started this morning and is blocking my work. Already restarted once.','Software','Dell U2722 Monitor','HR','EMP-1031','Arjun Iyer','High',72,73,74,72,65,'High priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1006','Negative',now() - interval '480 minutes'),
('TKT-2091','MFA codes not arriving','MFA codes not arriving. Started this morning and is blocking my work. Already restarted once.','Account Access','Lenovo ThinkPad T14','Operations','EMP-1012','Lakshmi Sharma','High',70,71,70,72,64,'High priority: moderate productivity impact, workaround may exist.','Assigned','EMP-1009','Frustrated',now() - interval '7740 minutes'),
('TKT-2092','Design tool licence expired','Design tool licence expired. Started this morning and is blocking my work. Already restarted once.','Software','Dell U2722 Monitor','Sales','EMP-1026','Priya Verma','High',72,72,74,70,67,'High priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1006','Neutral',now() - interval '17880 minutes'),
('TKT-2093','Unauthorized login attempt','Unauthorized login attempt. Started this morning and is blocking my work. Already restarted once.','Security','Dell U2722 Monitor','HR','EMP-1048','Lakshmi Verma','Medium',50,49,50,47,40,'Medium priority: moderate productivity impact, workaround may exist.','Resolved','EMP-1008','Frustrated',now() - interval '15720 minutes'),
('TKT-2094','Antivirus alert on laptop','Antivirus alert on laptop. Started this morning and is blocking my work. Already restarted once.','Security','Dell Latitude 5440','Sales','EMP-1039','Rohan Reddy','High',72,69,74,74,66,'High priority: moderate productivity impact, workaround may exist.','In Progress','EMP-1006','Neutral',now() - interval '5460 minutes'),
('TKT-2095','Locked out of account','Locked out of account. Started this morning and is blocking my work. Already restarted once.','Account Access','HP EliteBook 840','Operations','EMP-1032','Meera Das','Critical',94,97,95,92,86,'Critical priority: broad business impact and high technical severity.','Open',NULL,'Neutral',now() - interval '300 minutes'),
('TKT-2096','Keyboard keys unresponsive','Keyboard keys unresponsive. Started this morning and is blocking my work. Already restarted once.','Hardware','HP EliteBook 840','Customer Support','EMP-1022','Divya Patel','High',79,78,83,78,67,'High priority: broad business impact and high technical severity.','In Progress','EMP-1008','Frustrated',now() - interval '7560 minutes'),
('TKT-2097','VPN client install fails','VPN client install fails. Started this morning and is blocking my work. Already restarted once.','Software','Dell U2722 Monitor','Operations','EMP-1012','Lakshmi Sharma','Medium',47,46,49,49,35,'Medium priority: limited impact on a single user.','Open',NULL,'Neutral',now() - interval '2400 minutes'),
('TKT-2098','Outlook not syncing','Outlook not syncing. Started this morning and is blocking my work. Already restarted once.','Email','HP EliteBook 840','HR','EMP-1055','Arjun Patel','Low',24,21,26,26,18,'Low priority: limited impact on a single user.','Resolved','EMP-1005','Neutral',now() - interval '20400 minutes'),
('TKT-2099','VPN keeps dropping','VPN keeps dropping. Started this morning and is blocking my work. Already restarted once.','Network','Dell U2722 Monitor','Customer Support','EMP-1050','Priya Reddy','Medium',49,46,53,51,40,'Medium priority: limited impact on a single user.','In Progress','EMP-1005','Neutral',now() - interval '5100 minutes'),
('TKT-2100','MFA codes not arriving','MFA codes not arriving. Started this morning and is blocking my work. Already restarted once.','Account Access','MacBook Pro 14','HR','EMP-1055','Arjun Patel','Low',28,25,29,28,18,'Low priority: limited impact on a single user.','Assigned','EMP-1007','Negative',now() - interval '2340 minutes');

insert into ticket_history(ticket_id,status,at) values
('TKT-2001','Open',now() - interval '14640 minutes'),
('TKT-2001','Closed',now() - interval '14520 minutes'),
('TKT-2002','Open',now() - interval '4080 minutes'),
('TKT-2002','In Progress',now() - interval '3960 minutes'),
('TKT-2003','Open',now() - interval '11220 minutes'),
('TKT-2003','Pending Employee',now() - interval '11100 minutes'),
('TKT-2004','Open',now() - interval '5760 minutes'),
('TKT-2004','Assigned',now() - interval '5640 minutes'),
('TKT-2005','Open',now() - interval '7380 minutes'),
('TKT-2006','Open',now() - interval '7860 minutes'),
('TKT-2006','In Progress',now() - interval '7740 minutes'),
('TKT-2007','Open',now() - interval '600 minutes'),
('TKT-2007','In Progress',now() - interval '480 minutes'),
('TKT-2008','Open',now() - interval '0 minutes'),
('TKT-2008','In Progress',now() - interval '0 minutes'),
('TKT-2009','Open',now() - interval '33780 minutes'),
('TKT-2009','Resolved',now() - interval '33660 minutes'),
('TKT-2010','Open',now() - interval '900 minutes'),
('TKT-2010','Assigned',now() - interval '780 minutes'),
('TKT-2011','Open',now() - interval '4620 minutes'),
('TKT-2011','Reopened',now() - interval '4500 minutes'),
('TKT-2012','Open',now() - interval '2460 minutes'),
('TKT-2012','Pending Employee',now() - interval '2340 minutes'),
('TKT-2013','Open',now() - interval '2880 minutes'),
('TKT-2013','In Progress',now() - interval '2760 minutes'),
('TKT-2014','Open',now() - interval '240 minutes'),
('TKT-2014','In Progress',now() - interval '120 minutes'),
('TKT-2015','Open',now() - interval '22980 minutes'),
('TKT-2015','Closed',now() - interval '22860 minutes'),
('TKT-2016','Open',now() - interval '6120 minutes'),
('TKT-2016','In Progress',now() - interval '6000 minutes'),
('TKT-2017','Open',now() - interval '24120 minutes'),
('TKT-2017','In Progress',now() - interval '24000 minutes'),
('TKT-2018','Open',now() - interval '60 minutes'),
('TKT-2018','Assigned',now() - interval '0 minutes'),
('TKT-2019','Open',now() - interval '12720 minutes'),
('TKT-2019','Reopened',now() - interval '12600 minutes'),
('TKT-2020','Open',now() - interval '5400 minutes'),
('TKT-2020','Assigned',now() - interval '5280 minutes'),
('TKT-2021','Open',now() - interval '18780 minutes'),
('TKT-2021','Closed',now() - interval '18660 minutes'),
('TKT-2022','Open',now() - interval '7200 minutes'),
('TKT-2022','Reopened',now() - interval '7080 minutes'),
('TKT-2023','Open',now() - interval '12540 minutes'),
('TKT-2023','In Progress',now() - interval '12420 minutes'),
('TKT-2024','Open',now() - interval '2460 minutes'),
('TKT-2024','Pending Employee',now() - interval '2340 minutes'),
('TKT-2025','Open',now() - interval '20880 minutes'),
('TKT-2025','Resolved',now() - interval '20760 minutes'),
('TKT-2026','Open',now() - interval '6480 minutes'),
('TKT-2026','Assigned',now() - interval '6360 minutes'),
('TKT-2027','Open',now() - interval '8340 minutes'),
('TKT-2027','Assigned',now() - interval '8220 minutes'),
('TKT-2028','Open',now() - interval '4260 minutes'),
('TKT-2028','Assigned',now() - interval '4140 minutes'),
('TKT-2029','Open',now() - interval '12240 minutes'),
('TKT-2029','In Progress',now() - interval '12120 minutes'),
('TKT-2030','Open',now() - interval '17820 minutes'),
('TKT-2030','Resolved',now() - interval '17700 minutes'),
('TKT-2031','Open',now() - interval '10560 minutes'),
('TKT-2031','Pending Employee',now() - interval '10440 minutes'),
('TKT-2032','Open',now() - interval '12780 minutes'),
('TKT-2032','Reopened',now() - interval '12660 minutes'),
('TKT-2033','Open',now() - interval '25800 minutes'),
('TKT-2033','Closed',now() - interval '25680 minutes'),
('TKT-2034','Open',now() - interval '23220 minutes'),
('TKT-2034','Resolved',now() - interval '23100 minutes'),
('TKT-2035','Open',now() - interval '5700 minutes'),
('TKT-2035','Assigned',now() - interval '5580 minutes'),
('TKT-2036','Open',now() - interval '6120 minutes'),
('TKT-2036','In Progress',now() - interval '6000 minutes'),
('TKT-2037','Open',now() - interval '240 minutes'),
('TKT-2037','In Progress',now() - interval '120 minutes'),
('TKT-2038','Open',now() - interval '17040 minutes'),
('TKT-2038','Resolved',now() - interval '16920 minutes'),
('TKT-2039','Open',now() - interval '900 minutes'),
('TKT-2039','Reopened',now() - interval '780 minutes'),
('TKT-2040','Open',now() - interval '240 minutes'),
('TKT-2040','Pending Employee',now() - interval '120 minutes'),
('TKT-2041','Open',now() - interval '10500 minutes'),
('TKT-2041','Reopened',now() - interval '10380 minutes'),
('TKT-2042','Open',now() - interval '20400 minutes'),
('TKT-2042','Closed',now() - interval '20280 minutes'),
('TKT-2043','Open',now() - interval '9000 minutes'),
('TKT-2043','Assigned',now() - interval '8880 minutes'),
('TKT-2044','Open',now() - interval '11280 minutes'),
('TKT-2044','Reopened',now() - interval '11160 minutes'),
('TKT-2045','Open',now() - interval '13680 minutes'),
('TKT-2045','In Progress',now() - interval '13560 minutes'),
('TKT-2046','Open',now() - interval '25500 minutes'),
('TKT-2046','Resolved',now() - interval '25380 minutes'),
('TKT-2047','Open',now() - interval '9840 minutes'),
('TKT-2047','Pending Employee',now() - interval '9720 minutes'),
('TKT-2048','Open',now() - interval '4680 minutes'),
('TKT-2049','Open',now() - interval '16920 minutes'),
('TKT-2049','Resolved',now() - interval '16800 minutes'),
('TKT-2050','Open',now() - interval '600 minutes'),
('TKT-2051','Open',now() - interval '2220 minutes'),
('TKT-2051','Assigned',now() - interval '2100 minutes'),
('TKT-2052','Open',now() - interval '14040 minutes'),
('TKT-2053','Open',now() - interval '18840 minutes'),
('TKT-2053','Resolved',now() - interval '18720 minutes'),
('TKT-2054','Open',now() - interval '7200 minutes'),
('TKT-2054','In Progress',now() - interval '7080 minutes'),
('TKT-2055','Open',now() - interval '12900 minutes'),
('TKT-2056','Open',now() - interval '28260 minutes'),
('TKT-2056','Resolved',now() - interval '28140 minutes'),
('TKT-2057','Open',now() - interval '4620 minutes'),
('TKT-2057','Pending Employee',now() - interval '4500 minutes'),
('TKT-2058','Open',now() - interval '5160 minutes'),
('TKT-2058','In Progress',now() - interval '5040 minutes'),
('TKT-2059','Open',now() - interval '8520 minutes'),
('TKT-2059','Assigned',now() - interval '8400 minutes'),
('TKT-2060','Open',now() - interval '16620 minutes'),
('TKT-2060','Resolved',now() - interval '16500 minutes'),
('TKT-2061','Open',now() - interval '13920 minutes'),
('TKT-2061','Reopened',now() - interval '13800 minutes'),
('TKT-2062','Open',now() - interval '17880 minutes'),
('TKT-2062','Closed',now() - interval '17760 minutes'),
('TKT-2063','Open',now() - interval '39600 minutes'),
('TKT-2063','Resolved',now() - interval '39480 minutes'),
('TKT-2064','Open',now() - interval '60 minutes'),
('TKT-2064','In Progress',now() - interval '0 minutes'),
('TKT-2065','Open',now() - interval '300 minutes'),
('TKT-2065','Assigned',now() - interval '180 minutes'),
('TKT-2066','Open',now() - interval '2580 minutes'),
('TKT-2066','Reopened',now() - interval '2460 minutes'),
('TKT-2067','Open',now() - interval '480 minutes'),
('TKT-2067','Assigned',now() - interval '360 minutes'),
('TKT-2068','Open',now() - interval '13980 minutes'),
('TKT-2069','Open',now() - interval '17580 minutes'),
('TKT-2069','In Progress',now() - interval '17460 minutes'),
('TKT-2070','Open',now() - interval '16920 minutes'),
('TKT-2070','Resolved',now() - interval '16800 minutes'),
('TKT-2071','Open',now() - interval '120 minutes'),
('TKT-2071','Reopened',now() - interval '0 minutes'),
('TKT-2072','Open',now() - interval '5460 minutes'),
('TKT-2072','In Progress',now() - interval '5340 minutes'),
('TKT-2073','Open',now() - interval '5340 minutes'),
('TKT-2073','Pending Employee',now() - interval '5220 minutes'),
('TKT-2074','Open',now() - interval '180 minutes'),
('TKT-2074','In Progress',now() - interval '60 minutes'),
('TKT-2075','Open',now() - interval '2580 minutes'),
('TKT-2075','In Progress',now() - interval '2460 minutes'),
('TKT-2076','Open',now() - interval '780 minutes'),
('TKT-2076','In Progress',now() - interval '660 minutes'),
('TKT-2077','Open',now() - interval '11400 minutes'),
('TKT-2078','Open',now() - interval '29880 minutes'),
('TKT-2078','Closed',now() - interval '29760 minutes'),
('TKT-2079','Open',now() - interval '20100 minutes'),
('TKT-2079','In Progress',now() - interval '19980 minutes'),
('TKT-2080','Open',now() - interval '14880 minutes'),
('TKT-2080','Resolved',now() - interval '14760 minutes'),
('TKT-2081','Open',now() - interval '13020 minutes'),
('TKT-2082','Open',now() - interval '39000 minutes'),
('TKT-2082','Closed',now() - interval '38880 minutes'),
('TKT-2083','Open',now() - interval '26400 minutes'),
('TKT-2083','Closed',now() - interval '26280 minutes'),
('TKT-2084','Open',now() - interval '1740 minutes'),
('TKT-2084','Assigned',now() - interval '1620 minutes'),
('TKT-2085','Open',now() - interval '7500 minutes'),
('TKT-2085','Reopened',now() - interval '7380 minutes'),
('TKT-2086','Open',now() - interval '17460 minutes'),
('TKT-2086','Assigned',now() - interval '17340 minutes'),
('TKT-2087','Open',now() - interval '36780 minutes'),
('TKT-2087','Closed',now() - interval '36660 minutes'),
('TKT-2088','Open',now() - interval '10680 minutes'),
('TKT-2088','In Progress',now() - interval '10560 minutes'),
('TKT-2089','Open',now() - interval '17220 minutes'),
('TKT-2089','Closed',now() - interval '17100 minutes'),
('TKT-2090','Open',now() - interval '480 minutes'),
('TKT-2090','In Progress',now() - interval '360 minutes'),
('TKT-2091','Open',now() - interval '7740 minutes'),
('TKT-2091','Assigned',now() - interval '7620 minutes'),
('TKT-2092','Open',now() - interval '17880 minutes'),
('TKT-2092','In Progress',now() - interval '17760 minutes'),
('TKT-2093','Open',now() - interval '15720 minutes'),
('TKT-2093','Resolved',now() - interval '15600 minutes'),
('TKT-2094','Open',now() - interval '5460 minutes'),
('TKT-2094','In Progress',now() - interval '5340 minutes'),
('TKT-2095','Open',now() - interval '300 minutes'),
('TKT-2096','Open',now() - interval '7560 minutes'),
('TKT-2096','In Progress',now() - interval '7440 minutes'),
('TKT-2097','Open',now() - interval '2400 minutes'),
('TKT-2098','Open',now() - interval '20400 minutes'),
('TKT-2098','Resolved',now() - interval '20280 minutes'),
('TKT-2099','Open',now() - interval '5100 minutes'),
('TKT-2099','In Progress',now() - interval '4980 minutes'),
('TKT-2100','Open',now() - interval '2340 minutes'),
('TKT-2100','Assigned',now() - interval '2220 minutes');

insert into conversations values
('CONV-5001','TKT-2001','Lakshmi Sharma','Operations','Security','Frustrated',87,'High','Lakshmi Sharma reported "unauthorized login attempt". Basic steps failed; ticket TKT-2001 was created.','Prioritise and contact the employee directly.',array['second time','blocking my work','three times'],now() - interval '14640 minutes'),
('CONV-5002','TKT-2002','Priya Nair','Sales','Hardware','Neutral',39,'Medium','Priya Nair reported "laptop will not boot". Basic steps failed; ticket TKT-2002 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '4080 minutes'),
('CONV-5003','TKT-2003','Siddharth Verma','Marketing','Email','Negative',67,'Medium','Siddharth Verma reported "emails stuck in outbox". Basic steps failed; ticket TKT-2003 was created.','Prioritise and contact the employee directly.',array['still the same','restarted'],now() - interval '11220 minutes'),
('CONV-5004','TKT-2004','Kavya Iyer','HR','Hardware','Positive',11,'High','Kavya Iyer reported "keyboard keys unresponsive". Basic steps failed; ticket TKT-2004 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '5760 minutes'),
('CONV-5005','TKT-2005','Arjun Menon','Operations','Account Access','Neutral',30,'High','Arjun Menon reported "password reset not working". Basic steps failed; ticket TKT-2005 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '7380 minutes'),
('CONV-5006','TKT-2006','Arjun Iyer','HR','Hardware','Positive',13,'High','Arjun Iyer reported "keyboard keys unresponsive". Basic steps failed; ticket TKT-2006 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '7860 minutes'),
('CONV-5007','TKT-2007','Lakshmi Sharma','Operations','Email','Frustrated',92,'Medium','Lakshmi Sharma reported "missing calendar invites". Basic steps failed; ticket TKT-2007 was created.','Prioritise and contact the employee directly.',array['second time','blocking my work','three times'],now() - interval '600 minutes'),
('CONV-5008','TKT-2008','Meera Sharma','Sales','Network','Neutral',30,'Medium','Meera Sharma reported "slow internet on floor 3". Basic steps failed; ticket TKT-2008 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '0 minutes'),
('CONV-5009','TKT-2009','Priya Reddy','Customer Support','Account Access','Neutral',31,'Low','Priya Reddy reported "password reset not working". Basic steps failed; ticket TKT-2009 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '33780 minutes'),
('CONV-5010','TKT-2010','Kavya Menon','Marketing','Security','Positive',15,'High','Kavya Menon reported "lost company device". Basic steps failed; ticket TKT-2010 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '900 minutes'),
('CONV-5011','TKT-2011','Priya Verma','Sales','Network','Negative',61,'Low','Priya Verma reported "slow internet on floor 3". Basic steps failed; ticket TKT-2011 was created.','Prioritise and contact the employee directly.',array['still the same','restarted'],now() - interval '4620 minutes'),
('CONV-5012','TKT-2012','Ananya Menon','HR','Network','Positive',11,'High','Ananya Menon reported "cannot connect to office wi-fi". Basic steps failed; ticket TKT-2012 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '2460 minutes'),
('CONV-5013','TKT-2013','Lakshmi Sharma','Operations','Account Access','Neutral',39,'Medium','Lakshmi Sharma reported "password reset not working". Basic steps failed; ticket TKT-2013 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '2880 minutes'),
('CONV-5014','TKT-2014','Priya Gupta','Marketing','Email','Neutral',33,'Critical','Priya Gupta reported "outlook not syncing". Basic steps failed; ticket TKT-2014 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '240 minutes'),
('CONV-5015','TKT-2015','Priya Nair','Sales','Email','Neutral',32,'Medium','Priya Nair reported "missing calendar invites". Basic steps failed; ticket TKT-2015 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '22980 minutes'),
('CONV-5016','TKT-2016','Priya Gupta','Marketing','Email','Neutral',35,'Medium','Priya Gupta reported "missing calendar invites". Basic steps failed; ticket TKT-2016 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '6120 minutes'),
('CONV-5017','TKT-2017','Ananya Reddy','Engineering','Network','Negative',65,'High','Ananya Reddy reported "vpn keeps dropping". Basic steps failed; ticket TKT-2017 was created.','Prioritise and contact the employee directly.',array['still the same','restarted'],now() - interval '24120 minutes'),
('CONV-5018','TKT-2018','Arjun Das','HR','Security','Neutral',30,'High','Arjun Das reported "lost company device". Basic steps failed; ticket TKT-2018 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '60 minutes'),
('CONV-5019','TKT-2019','Lakshmi Sharma','Operations','Hardware','Neutral',33,'Low','Lakshmi Sharma reported "docking station not detected". Basic steps failed; ticket TKT-2019 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '12720 minutes'),
('CONV-5020','TKT-2020','Lakshmi Verma','HR','Account Access','Frustrated',90,'Medium','Lakshmi Verma reported "need access to finance folder". Basic steps failed; ticket TKT-2020 was created.','Prioritise and contact the employee directly.',array['second time','blocking my work','three times'],now() - interval '5400 minutes'),
('CONV-5021','TKT-2021','Aarav Nair','Finance','Network','Negative',68,'Medium','Aarav Nair reported "vpn keeps dropping". Basic steps failed; ticket TKT-2021 was created.','Prioritise and contact the employee directly.',array['still the same','restarted'],now() - interval '18780 minutes'),
('CONV-5022','TKT-2022','Priya Reddy','Customer Support','Email','Neutral',36,'High','Priya Reddy reported "outlook not syncing". Basic steps failed; ticket TKT-2022 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '7200 minutes'),
('CONV-5023','TKT-2023','Lakshmi Gupta','Customer Support','Software','Negative',62,'Medium','Lakshmi Gupta reported "excel crashes on launch". Basic steps failed; ticket TKT-2023 was created.','Prioritise and contact the employee directly.',array['still the same','restarted'],now() - interval '12540 minutes'),
('CONV-5024','TKT-2024','Lakshmi Sharma','Operations','Software','Positive',13,'Low','Lakshmi Sharma reported "ide freezing on startup". Basic steps failed; ticket TKT-2024 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '2460 minutes'),
('CONV-5025','TKT-2025','Lakshmi Sharma','Operations','Security','Frustrated',85,'Medium','Lakshmi Sharma reported "lost company device". Basic steps failed; ticket TKT-2025 was created.','Prioritise and contact the employee directly.',array['second time','blocking my work','three times'],now() - interval '20880 minutes'),
('CONV-5026','TKT-2026','Rohan Rao','Marketing','Security','Frustrated',92,'High','Rohan Rao reported "suspicious phishing email". Basic steps failed; ticket TKT-2026 was created.','Prioritise and contact the employee directly.',array['second time','blocking my work','three times'],now() - interval '6480 minutes'),
('CONV-5027','TKT-2027','Arjun Menon','Operations','Account Access','Frustrated',92,'High','Arjun Menon reported "locked out of account". Basic steps failed; ticket TKT-2027 was created.','Prioritise and contact the employee directly.',array['second time','blocking my work','three times'],now() - interval '8340 minutes'),
('CONV-5028','TKT-2028','Lakshmi Gupta','Customer Support','Email','Positive',12,'High','Lakshmi Gupta reported "outlook not syncing". Basic steps failed; ticket TKT-2028 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '4260 minutes'),
('CONV-5029','TKT-2029','Lakshmi Krishnan','Finance','Software','Frustrated',90,'Critical','Lakshmi Krishnan reported "excel crashes on launch". Basic steps failed; ticket TKT-2029 was created.','Prioritise and contact the employee directly.',array['second time','blocking my work','three times'],now() - interval '12240 minutes'),
('CONV-5030','TKT-2030','Arjun Das','HR','Network','Neutral',33,'Medium','Arjun Das reported "slow internet on floor 3". Basic steps failed; ticket TKT-2030 was created.','Follow standard resolution workflow.',array['still the same','restarted'],now() - interval '17820 minutes');

insert into conversation_messages(conversation_id,seq,sender,body) values
('CONV-5001',1,'user','Hi, unauthorized login attempt.'),
('CONV-5001',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5001',3,'user','Yes, three times. This is the second time this week!'),
('CONV-5001',4,'ai','I have created ticket TKT-2001 and notified IT.'),
('CONV-5002',1,'user','Hi, laptop will not boot.'),
('CONV-5002',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5002',3,'user','Yes, still the same.'),
('CONV-5002',4,'ai','I have created ticket TKT-2002 and notified IT.'),
('CONV-5003',1,'user','Hi, emails stuck in outbox.'),
('CONV-5003',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5003',3,'user','Yes, still the same.'),
('CONV-5003',4,'ai','I have created ticket TKT-2003 and notified IT.'),
('CONV-5004',1,'user','Hi, keyboard keys unresponsive.'),
('CONV-5004',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5004',3,'user','Yes, still the same.'),
('CONV-5004',4,'ai','I have created ticket TKT-2004 and notified IT.'),
('CONV-5005',1,'user','Hi, password reset not working.'),
('CONV-5005',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5005',3,'user','Yes, still the same.'),
('CONV-5005',4,'ai','I have created ticket TKT-2005 and notified IT.'),
('CONV-5006',1,'user','Hi, keyboard keys unresponsive.'),
('CONV-5006',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5006',3,'user','Yes, still the same.'),
('CONV-5006',4,'ai','I have created ticket TKT-2006 and notified IT.'),
('CONV-5007',1,'user','Hi, missing calendar invites.'),
('CONV-5007',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5007',3,'user','Yes, three times. This is the second time this week!'),
('CONV-5007',4,'ai','I have created ticket TKT-2007 and notified IT.'),
('CONV-5008',1,'user','Hi, slow internet on floor 3.'),
('CONV-5008',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5008',3,'user','Yes, still the same.'),
('CONV-5008',4,'ai','I have created ticket TKT-2008 and notified IT.'),
('CONV-5009',1,'user','Hi, password reset not working.'),
('CONV-5009',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5009',3,'user','Yes, still the same.'),
('CONV-5009',4,'ai','I have created ticket TKT-2009 and notified IT.'),
('CONV-5010',1,'user','Hi, lost company device.'),
('CONV-5010',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5010',3,'user','Yes, still the same.'),
('CONV-5010',4,'ai','I have created ticket TKT-2010 and notified IT.'),
('CONV-5011',1,'user','Hi, slow internet on floor 3.'),
('CONV-5011',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5011',3,'user','Yes, still the same.'),
('CONV-5011',4,'ai','I have created ticket TKT-2011 and notified IT.'),
('CONV-5012',1,'user','Hi, cannot connect to office wi-fi.'),
('CONV-5012',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5012',3,'user','Yes, still the same.'),
('CONV-5012',4,'ai','I have created ticket TKT-2012 and notified IT.'),
('CONV-5013',1,'user','Hi, password reset not working.'),
('CONV-5013',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5013',3,'user','Yes, still the same.'),
('CONV-5013',4,'ai','I have created ticket TKT-2013 and notified IT.'),
('CONV-5014',1,'user','Hi, outlook not syncing.'),
('CONV-5014',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5014',3,'user','Yes, still the same.'),
('CONV-5014',4,'ai','I have created ticket TKT-2014 and notified IT.'),
('CONV-5015',1,'user','Hi, missing calendar invites.'),
('CONV-5015',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5015',3,'user','Yes, still the same.'),
('CONV-5015',4,'ai','I have created ticket TKT-2015 and notified IT.'),
('CONV-5016',1,'user','Hi, missing calendar invites.'),
('CONV-5016',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5016',3,'user','Yes, still the same.'),
('CONV-5016',4,'ai','I have created ticket TKT-2016 and notified IT.'),
('CONV-5017',1,'user','Hi, vpn keeps dropping.'),
('CONV-5017',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5017',3,'user','Yes, still the same.'),
('CONV-5017',4,'ai','I have created ticket TKT-2017 and notified IT.'),
('CONV-5018',1,'user','Hi, lost company device.'),
('CONV-5018',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5018',3,'user','Yes, still the same.'),
('CONV-5018',4,'ai','I have created ticket TKT-2018 and notified IT.'),
('CONV-5019',1,'user','Hi, docking station not detected.'),
('CONV-5019',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5019',3,'user','Yes, still the same.'),
('CONV-5019',4,'ai','I have created ticket TKT-2019 and notified IT.'),
('CONV-5020',1,'user','Hi, need access to finance folder.'),
('CONV-5020',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5020',3,'user','Yes, three times. This is the second time this week!'),
('CONV-5020',4,'ai','I have created ticket TKT-2020 and notified IT.'),
('CONV-5021',1,'user','Hi, vpn keeps dropping.'),
('CONV-5021',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5021',3,'user','Yes, still the same.'),
('CONV-5021',4,'ai','I have created ticket TKT-2021 and notified IT.'),
('CONV-5022',1,'user','Hi, outlook not syncing.'),
('CONV-5022',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5022',3,'user','Yes, still the same.'),
('CONV-5022',4,'ai','I have created ticket TKT-2022 and notified IT.'),
('CONV-5023',1,'user','Hi, excel crashes on launch.'),
('CONV-5023',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5023',3,'user','Yes, still the same.'),
('CONV-5023',4,'ai','I have created ticket TKT-2023 and notified IT.'),
('CONV-5024',1,'user','Hi, ide freezing on startup.'),
('CONV-5024',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5024',3,'user','Yes, still the same.'),
('CONV-5024',4,'ai','I have created ticket TKT-2024 and notified IT.'),
('CONV-5025',1,'user','Hi, lost company device.'),
('CONV-5025',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5025',3,'user','Yes, three times. This is the second time this week!'),
('CONV-5025',4,'ai','I have created ticket TKT-2025 and notified IT.'),
('CONV-5026',1,'user','Hi, suspicious phishing email.'),
('CONV-5026',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5026',3,'user','Yes, three times. This is the second time this week!'),
('CONV-5026',4,'ai','I have created ticket TKT-2026 and notified IT.'),
('CONV-5027',1,'user','Hi, locked out of account.'),
('CONV-5027',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5027',3,'user','Yes, three times. This is the second time this week!'),
('CONV-5027',4,'ai','I have created ticket TKT-2027 and notified IT.'),
('CONV-5028',1,'user','Hi, outlook not syncing.'),
('CONV-5028',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5028',3,'user','Yes, still the same.'),
('CONV-5028',4,'ai','I have created ticket TKT-2028 and notified IT.'),
('CONV-5029',1,'user','Hi, excel crashes on launch.'),
('CONV-5029',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5029',3,'user','Yes, three times. This is the second time this week!'),
('CONV-5029',4,'ai','I have created ticket TKT-2029 and notified IT.'),
('CONV-5030',1,'user','Hi, slow internet on floor 3.'),
('CONV-5030',2,'ai','Sorry to hear that. Have you tried restarting the device?'),
('CONV-5030',3,'user','Yes, still the same.'),
('CONV-5030',4,'ai','I have created ticket TKT-2030 and notified IT.');

-- Row Level Security. DEMO policies let the anon key read/write everything so the first version works.
-- Replace with auth-based policies (auth.uid() + role checks) before real use.
do $$ declare t text; begin
 foreach t in array array['profiles','tickets','ticket_history','ticket_comments','conversations','conversation_messages'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy demo_all on %I for all to anon using (true) with check (true)',t);
 end loop; end $$;
`

// ===== data/constants.js =====
const DEPTS=['Engineering','Finance','HR','Sales','Marketing','Operations','Legal','Customer Support']
const CATS=['Hardware','Software','Network','Account Access','Email','Security']
const STATUSES=['Open','Assigned','In Progress','Pending Employee','Resolved','Closed','Reopened']
const PRIORITIES=['Low','Medium','High','Critical']

// ===== lib/supabase.js =====
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY
const configured=!!(url&&key)
const supabase=configured?createClient(url,key):null

// ===== utils/helpers.js =====
const SLA_H={Critical:4,High:8,Medium:24,Low:72}
const isDone=t=>['Resolved','Closed'].includes(t.status)
const deadline=t=>new Date(new Date(t.created).getTime()+SLA_H[t.priority]*36e5)
const hoursLeft=t=>(deadline(t).getTime()-Date.now())/36e5
const slaState=t=>isDone(t)?'Met':hoursLeft(t)<0?'Breached':hoursLeft(t)<SLA_H[t.priority]*.25?'At Risk':'Within SLA'
const fmt=d=>new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
const fmtT=d=>new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
const countBy=(a,f)=>Object.entries(a.reduce((m,x)=>{const k=f(x);m[k]=(m[k]||0)+1;return m},{})).map(([name,value])=>({name,value}))
const techStats=(tech,tickets)=>{const mine=tickets.filter(t=>t.tech===tech.id);const active=mine.filter(t=>!isDone(t)).length;const resolved=mine.length-active
 return {active,resolved,availability:active>=6?'Busy':'Available',performance:mine.length?Math.round(resolved/mine.length*100):0}}
const countdown=t=>{const h=hoursLeft(t);const a=Math.abs(h);const s=`${Math.floor(a)}h ${Math.round((a%1)*60)}m`;return h<0?`${s} overdue`:`${s} left`}

// ===== services/mockAIService.js =====
// Swap these for Gemini calls (via a backend / Edge Function) later. Keep signatures.
const scoreTicket=(priority,seed=0)=>{
 const base={Low:22,Medium:45,High:70,Critical:88}[priority];const score=Math.min(99,base+seed%10)
 const f=d=>Math.max(5,Math.min(100,score+d))
 return {score,impact:f(seed%7-3),severity:f(seed%5),urgency:f(2-seed%6),recurrence:f(seed%9-12),
  reason:`${priority} priority: ${score>=75?'broad business impact and high technical severity':score>=50?'moderate productivity impact, workaround may exist':'limited impact on a single user'}.`}}
const levelOf=s=>s>=80?'Critical':s>=60?'High':s>=35?'Medium':'Low'
const summarize=t=>({
 summary:`${t.empName} (${t.dept}) reports "${t.title.toLowerCase()}" on ${t.device}. ${t.sentiment==='Frustrated'?'The employee is frustrated after repeated attempts.':'The employee is cooperative.'}`,
 findings:[`Category: ${t.category}`,`Priority score ${t.score}/100`,t.score>70?'Similar issues seen in the last 7 days':'No related recurring pattern'],
 tried:['Restarted the device','Checked network / power connection','Searched knowledge base'],
 impact:t.priority==='Critical'||t.priority==='High'?'Employee is unable to work; team deliverables at risk.':'Employee can continue with reduced productivity.',
 next:['Run remote diagnostics','Apply knowledge-base fix','Escalate to Tier 2 if unresolved within SLA']})
const guessCategory=s=>{s=s.toLowerCase();return /wi-?fi|network|internet|vpn/.test(s)?'Network':/password|login|locked|account|mfa/.test(s)?'Account Access':/mail|outlook/.test(s)?'Email':/phish|virus|security/.test(s)?'Security':/laptop|screen|monitor|keyboard|battery/.test(s)?'Hardware':'Software'}
const reply=q=>{const t=q.toLowerCase()
 if(/status|track/.test(t))return {intent:'status',text:'Here is the latest on your most recent ticket:'}
 if(/create|raise|log (a|the)|ticket/.test(t))return {intent:'create',text:'Done, I have logged this for you.'}
 if(/wi-?fi|network|internet|vpn/.test(t))return {intent:'help',text:'Try these steps:\n1. Turn Wi-Fi off and on\n2. Forget the "Nexora-Corp" network and reconnect\n3. Restart your laptop\n\nStill failing? Say "create ticket" and I will log it.'}
 if(/password|login|locked/.test(t))return {intent:'help',text:'You can reset it at the self-service portal:\n1. Open the password reset page\n2. Verify with your MFA code\n3. Choose a new password (12+ characters)\n\nIf the MFA code does not arrive, say "create ticket".'}
 if(/laptop|computer|screen|battery|boot/.test(t))return {intent:'help',text:'Sorry about that. Please try:\n1. Hold the power button for 15 seconds\n2. Unplug accessories and charger, then power on\n3. Check for a charging light\n\nIf it still fails, say "create ticket".'}
 return {intent:'help',text:'I can help with hardware, network, accounts, email and software issues. Describe the problem or pick a suggestion.'}}
const ask=(q,{tickets,users})=>{const t=q.toLowerCase();const live=x=>!['Resolved','Closed'].includes(x.status)
 if(/critical/.test(t))return `${tickets.filter(x=>x.priority==='Critical'&&live(x)).length} critical tickets are currently unresolved.`
 if(/department|dept/.test(t)){const m={};tickets.forEach(x=>m[x.dept]=(m[x.dept]||0)+1);const [d,n]=Object.entries(m).sort((a,b)=>b[1]-a[1])[0];return `${d} has the highest volume with ${n} tickets.`}
 if(/frustrat|sentiment|negative/.test(t))return `${tickets.filter(x=>x.sentiment==='Frustrated').length} tickets show frustrated employees and ${tickets.filter(x=>x.sentiment==='Negative').length} are negative.`
 if(/open|pending/.test(t))return `${tickets.filter(live).length} tickets are unresolved out of ${tickets.length}.`
 if(/user|employee/.test(t))return `There are ${users.length} registered users, ${users.filter(u=>u.status==='Active').length} active.`
 return 'Try asking about critical tickets, busiest department, sentiment, open tickets or users.'}

// ===== services/mockTicketService.js =====
const newTicket=(f,me,n)=>{const now=new Date().toISOString();const sc=scoreTicket(f.priority,n*7)
 return {id:`TKT-${2101+n}`,title:f.title,desc:f.desc||f.title,category:f.category,device:f.device||'Not specified',dept:f.dept||me.dept,empId:me.id,empName:me.name,
  priority:f.priority,...sc,status:'Open',tech:null,created:now,sentiment:'Neutral',history:[{s:'Open',t:now}],comments:[]}}

// ===== components/ui/ui.jsx =====
const push='border-2 border-black rounded-lg shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none'
const inp='border-2 border-black rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:bg-[#ffe17c]/40'
const btn=`inline-flex items-center gap-1.5 bg-black text-white text-sm font-bold px-3 py-1.5 ${push}`
const btn2=`inline-flex items-center gap-1.5 bg-white text-black text-sm font-bold px-3 py-1.5 ${push}`
const Card=({title,right,children,className=''})=>(<div className={`bg-white border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] ${className}`}>
 {title&&<div className="flex items-center justify-between gap-2 px-4 py-3 border-b-2 border-black bg-[#b7c6c2] rounded-t-[10px]"><h3 className="text-base">{title}</h3>{right}</div>}<div className="p-4">{children}</div></div>)
const Kpi=({label,value,delta,icon:I})=>(<div className="bg-white border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] p-4"><div className="flex items-center justify-between text-xs font-bold">{label}{I&&<span className="w-8 h-8 bg-[#b7c6c2] border-2 border-black rounded-lg flex items-center justify-center"><I size={15}/></span>}</div>
 <div className="font-display font-extrabold tracking-tighter text-3xl mt-1">{value}</div>{delta!=null&&<div className={`text-xs font-bold mt-1 ${delta>=0?'text-emerald-700':'text-red-700'}`}>{delta>=0?'+':''}{delta}% vs previous week</div>}</div>)
const tone={Critical:'bg-red-200',High:'bg-orange-200',Medium:'bg-[#ffe17c]',Low:'bg-slate-100',Open:'bg-blue-200',Assigned:'bg-indigo-200','In Progress':'bg-sky-200','Pending Employee':'bg-[#ffe17c]',Resolved:'bg-emerald-200',Closed:'bg-slate-200',Reopened:'bg-red-200',
 Positive:'bg-emerald-200',Neutral:'bg-slate-100',Negative:'bg-orange-200',Frustrated:'bg-red-200',Active:'bg-emerald-200',Inactive:'bg-slate-200',Pending:'bg-[#ffe17c]',Available:'bg-emerald-200',Busy:'bg-orange-200',
 Met:'bg-emerald-200','Within SLA':'bg-emerald-200','At Risk':'bg-[#ffe17c]',Breached:'bg-red-200'}
const Badge=({v})=><span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border-2 border-black whitespace-nowrap ${tone[v]||'bg-slate-100'}`}>{v}</span>
const Bar=({v,color='bg-black'})=><div className="h-2.5 bg-white border-2 border-black rounded-full overflow-hidden"><div className={`h-full ${color==='bg-black'?'bg-black':color.replace('bg-blue-500','bg-[#b7c6c2]')}`} style={{width:`${v}%`}}/></div>
const Modal=({title,onClose,children,wide})=>(<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
 <div className={`bg-white border-2 border-black rounded-xl shadow-[8px_8px_0_0_#000] w-full ${wide?'max-w-3xl':'max-w-md'} max-h-[90vh] overflow-auto`} onClick={e=>e.stopPropagation()}>
 <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black sticky top-0 bg-[#ffe17c]"><h3 className="text-lg">{title}</h3><button onClick={onClose} className="border-2 border-black rounded-lg bg-white p-0.5"><X size={16}/></button></div><div className="p-5">{children}</div></div></div>)
const Table=({cols,rows,onRow,empty='No results'})=>(<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs font-bold border-b-2 border-black">{cols.map(c=><th key={c} className="py-2 pr-4 whitespace-nowrap">{c}</th>)}</tr></thead>
 <tbody>{rows.map((r,i)=><tr key={i} onClick={onRow?()=>onRow(i):undefined} className={`border-b border-black/15 ${onRow?'cursor-pointer':''} hover:bg-[#ffe17c]/50`}>{r.map((c,j)=><td key={j} className="py-2.5 pr-4 whitespace-nowrap">{c}</td>)}</tr>)}</tbody></table>
 {!rows.length&&<div className="text-center text-black/50 text-sm py-8">{empty}</div>}</div>)
const Page=({title,sub,right,children})=>(<div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h1 className="text-3xl">{title}</h1>{sub&&<p className="text-sm font-medium text-black/70">{sub}</p>}</div>{right}</div>{children}</div>)
const PriorityScore=({t})=>(<div className="space-y-3"><div className="flex items-center gap-4"><div className="w-20 h-20 rounded-full border-4 border-black bg-[#ffe17c] shadow-[4px_4px_0_0_#000] flex flex-col items-center justify-center"><span className="font-display font-extrabold text-2xl leading-none">{t.score}</span><span className="text-[10px] font-bold">/100</span></div>
 <div><Badge v={t.priority}/><p className="text-xs mt-2 max-w-xs">{t.reason}</p></div></div>
 {[['Business impact',t.impact],['Technical severity',t.severity],['Urgency',t.urgency],['Recurrence',t.recurrence]].map(([k,v])=><div key={k}><div className="flex justify-between text-xs font-bold mb-1"><span>{k}</span><span>{v}</span></div><Bar v={v} color={v>75?'bg-red-500':v>50?'bg-[#ffe17c]':'bg-[#b7c6c2]'}/></div>)}</div>)

// ===== components/charts/Charts.jsx =====
const COLORS=['#171e19','#e0b400','#6b8a82','#b7c6c2','#ffe17c','#272727','#8a8f8c']
const ax={tick:{fontSize:11,fill:'#64748b'},axisLine:false,tickLine:false}
const Donut=({data})=>(<ResponsiveContainer width="100%" height={230}><PieChart><Pie data={data} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={2}>{data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} stroke="#000" strokeWidth={2}/>)}</Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize:11}}/></PieChart></ResponsiveContainer>)
const Bars=({data,horizontal})=>(<ResponsiveContainer width="100%" height={230}><BarChart data={data} layout={horizontal?'vertical':'horizontal'} margin={{left:horizontal?30:-20}}><CartesianGrid stroke="#f1f5f9" vertical={!horizontal} horizontal={horizontal?false:true}/>
 {horizontal?<><XAxis type="number" {...ax}/><YAxis type="category" dataKey="name" width={90} {...ax}/></>:<><XAxis dataKey="name" {...ax}/><YAxis {...ax}/></>}<Tooltip cursor={{fill:'#f8fafc'}}/><RBar dataKey="value" fill="#0b1f4b" radius={[3,3,0,0]} barSize={18}/></BarChart></ResponsiveContainer>)
const Lines=({data,keys=['value']})=>(<ResponsiveContainer width="100%" height={230}><LineChart data={data} margin={{left:-20}}><CartesianGrid stroke="#f1f5f9" vertical={false}/><XAxis dataKey="name" {...ax}/><YAxis {...ax}/><Tooltip/>{keys.length>1&&<Legend iconSize={8} wrapperStyle={{fontSize:11}}/>}
 {keys.map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={COLORS[i%COLORS.length]} strokeWidth={2} dot={false}/>)}</LineChart></ResponsiveContainer>)

// ===== context/AppContext.jsx =====
const Ctx=createContext()
const useApp=()=>useContext(Ctx)
const prof=r=>({id:r.id,name:r.name,email:r.email,dept:r.dept,role:r.role,status:r.status,lastActive:r.last_active_hours??0,joinedDays:r.joined_days_ago??0,spec:r.specialization})
const tick=r=>({id:r.id,title:r.title,desc:r.description,category:r.category,device:r.device,dept:r.dept,empId:r.employee_id,empName:r.employee_name,priority:r.priority,score:r.ai_score,impact:r.impact,severity:r.severity,urgency:r.urgency,recurrence:r.recurrence,reason:r.score_reason,status:r.status,tech:r.technician_id,sentiment:r.sentiment,created:r.created_at,
 history:[...(r.ticket_history||[])].sort((a,b)=>new Date(a.at)-new Date(b.at)).map(h=>({s:h.status,t:h.at})),comments:[...(r.ticket_comments||[])].sort((a,b)=>new Date(a.at)-new Date(b.at)).map(c=>({by:c.author,text:c.body,t:c.at}))})
const conv=r=>({id:r.id,ticketId:r.ticket_id,empName:r.employee_name,dept:r.dept,category:r.category,sentiment:r.sentiment,frustration:r.frustration,urgency:r.urgency,summary:r.summary,action:r.recommended_action,keyPhrases:r.key_phrases||[],date:r.created_at,daysAgo:Math.floor((Date.now()-new Date(r.created_at))/864e5),
 messages:[...(r.conversation_messages||[])].sort((a,b)=>a.seq-b.seq).map(m=>({from:m.sender,text:m.body}))})
const num=id=>+String(id).split('-')[1]
function AppProvider({children}){
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
 const addTicket=f=>{const t=newTicket(f,me,Math.max(2100,...tickets.map(x=>num(x.id)))+1-2101);setTickets(ts=>[t,...ts]);notify(`Ticket ${t.id} created`)
  run(async()=>{await ok(supabase.from('tickets').insert({id:t.id,title:t.title,description:t.desc,category:t.category,device:t.device,dept:t.dept,employee_id:t.empId,employee_name:t.empName,priority:t.priority,ai_score:t.score,impact:t.impact,severity:t.severity,urgency:t.urgency,recurrence:t.recurrence,score_reason:t.reason,status:'Open',technician_id:null,sentiment:t.sentiment,created_at:t.created}));await ok(supabase.from('ticket_history').insert({ticket_id:t.id,status:'Open',at:t.created}))});return t}
 const comment=(id,text,by)=>{const now=new Date().toISOString();setTickets(ts=>ts.map(t=>t.id===id?{...t,comments:[...t.comments,{by,text,t:now}]}:t));run(()=>ok(supabase.from('ticket_comments').insert({ticket_id:id,author:by,body:text,at:now})))}
 const addUser=u=>{const id=`EMP-${Math.max(1000,...users.map(x=>num(x.id)))+1}`,n={id,status:'Active',lastActive:0,joinedDays:0,spec:null,...u};setUsers(us=>[n,...us])
  run(()=>ok(supabase.from('profiles').insert({id,name:n.name,email:n.email,dept:n.dept,role:n.role,status:n.status,last_active_hours:0,joined_days_ago:0})))}
 const updateUser=(id,p)=>{setUsers(us=>us.map(u=>u.id===id?{...u,...p}:u));const col={};['name','email','dept','role','status'].forEach(k=>p[k]!==undefined&&(col[k]=p[k]));run(()=>ok(supabase.from('profiles').update(col).eq('id',id)))}
 if(st.loading)return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading from Supabase…</div>
 if(st.error||!me||!techMe||!admin)return <div className="min-h-screen flex items-center justify-center p-6"><div className="max-w-md bg-white border rounded-lg p-5 text-sm"><div className="font-semibold mb-1">Could not load data</div><p className="text-slate-600">{st.error||'No profiles found. Run db/ps4_it_helpdesk.sql in the Supabase SQL editor.'}</p><button className="mt-3 border rounded-md px-3 py-1.5" onClick={()=>{setSt({loading:true,error:null});load()}}>Retry</button><a href="/setup" className="underline ml-3">Database setup</a></div></div>
 return <Ctx.Provider value={{users,tickets,conversations,notifs,me,techMe,admin,patch,addTicket,comment,addUser,updateUser,notify,refresh:load}}>{children}</Ctx.Provider>}

// ===== components/tickets/TicketModal.jsx =====
function TicketModal({id,onClose,canEdit}){
 const {tickets,users,patch,comment}=useApp(),t=tickets.find(x=>x.id===id),[c,setC]=useState('')
 if(!t)return null
 const ai=summarize(t),techs=users.filter(u=>u.role==='Technician'),tech=users.find(u=>u.id===t.tech)
 const L=({k,children})=><div><div className="text-xs text-slate-500 mb-1">{k}</div>{children}</div>
 return (<Modal wide title={`${t.id} · ${t.title}`} onClose={onClose}><div className="grid md:grid-cols-2 gap-5 text-sm">
  <div className="space-y-4">
   <div className="flex gap-2 flex-wrap"><Badge v={t.status}/><Badge v={t.priority}/><Badge v={t.sentiment}/><Badge v={slaState(t)}/></div>
   <L k="Employee">{t.empName} · {t.dept}</L><L k="Description">{t.desc}</L><L k="Device / category">{t.device} · {t.category}</L><L k="SLA">{slaState(t)==='Met'?'Met':countdown(t)}</L>
   {canEdit&&<div className="grid grid-cols-3 gap-2">
    <L k="Status"><select className={inp+' w-full'} value={t.status} onChange={e=>patch(t.id,{status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></L>
    <L k="Priority"><select className={inp+' w-full'} value={t.priority} onChange={e=>patch(t.id,{priority:e.target.value})}>{PRIORITIES.map(s=><option key={s}>{s}</option>)}</select></L>
    <L k="Technician"><select className={inp+' w-full'} value={t.tech||''} onChange={e=>patch(t.id,{tech:e.target.value,status:t.status==='Open'?'Assigned':t.status})}><option value="">Unassigned</option>{techs.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></L></div>}
   {!canEdit&&<L k="Technician">{tech?.name||'Not yet assigned'}</L>}
   <L k="Activity timeline"><ol className="border-l-2 border-slate-200 ml-1 space-y-2">{t.history.map((h,i)=><li key={i} className="pl-3 relative"><span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-black"/>{h.s} <span className="text-xs text-slate-400">{fmtT(h.t)}</span></li>)}</ol></L>
  </div>
  <div className="space-y-4">
   <div className="bg-[#b7c6c2] rounded-md p-3"><div className="text-xs font-medium text-black mb-1">AI summary (sample)</div><p>{ai.summary}</p>
    <ul className="list-disc ml-4 mt-2 text-slate-600">{ai.findings.map(f=><li key={f}>{f}</li>)}</ul><div className="text-xs font-medium mt-2">Impact</div><p className="text-slate-600">{ai.impact}</p></div>
   <PriorityScore t={t}/>
   <L k="Comments">{t.comments.map((x,i)=><div key={i} className="bg-slate-50 rounded p-2 mb-1"><b>{x.by}</b> · <span className="text-xs text-slate-400">{fmtT(x.t)}</span><div>{x.text}</div></div>)}
    <div className="flex gap-2"><input className={inp+' flex-1'} value={c} onChange={e=>setC(e.target.value)} placeholder="Add comment"/><button className={btn} onClick={()=>{if(c.trim()){comment(t.id,c,canEdit?'IT':t.empName);setC('')}}}>Post</button></div></L>
  </div></div></Modal>)}

// ===== components/layout/Layout.jsx =====
const NAV={admin:[['/admin','Overview',LayoutDashboard,1],['/admin/ai','AI Intelligence',Sparkles],['/admin/tickets','All Tickets',Ticket],['/admin/conversations','Conversations',MessageSquare],['/admin/users','User Management',Users],['/admin/technicians','Technician Management',Wrench],['/admin/departments','Departments',Building2],['/admin/sla','SLA Monitoring',Timer],['/admin/kb','Knowledge Base',BookOpen],['/admin/reports','Reports & Analytics',BarChart3],['/admin/settings','Settings',Settings]],
 employee:[['/employee','Dashboard',LayoutDashboard,1],['/employee/chat','AI Helpdesk Assistant',MessageCircle],['/employee/create','Create Ticket',PlusCircle],['/employee/tickets','My Tickets',Ticket],['/employee/notifications','Notifications',Bell],['/employee/profile','Profile',User]],
 technician:[['/technician','Dashboard',LayoutDashboard,1],['/technician/tickets','Assigned Tickets',ListChecks],['/technician/kb','Knowledge Base',BookOpen]]}
const ROLE={admin:'Administrator',employee:'Employee',technician:'IT Technician'}
function Layout({role}){
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
    <select className="hidden sm:block border-2 border-black bg-white rounded-lg text-sm px-2 py-1.5"><option>Last 30 days</option><option>Last 7 days</option><option>Today</option></select>
    <div className="relative"><button onClick={()=>setBell(!bell)} className="relative p-1.5"><Bell size={18}/><span className="absolute top-0 right-0 bg-black text-[#ffe17c] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{notifs.length}</span></button>
     {bell&&<div className="absolute right-0 mt-2 w-72 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] p-2 max-h-80 overflow-auto">{notifs.map(n=><div key={n.id} className="text-sm p-2 rounded hover:bg-slate-50">{n.text}</div>)}</div>}</div>
    <select value={role} onChange={e=>nav(`/${e.target.value}`)} className="border-2 border-black bg-white rounded-lg text-sm px-2 py-1.5"><option value="admin">Admin portal</option><option value="technician">Technician portal</option><option value="employee">Employee portal</option></select>
    <div className="hidden sm:flex items-center gap-2"><div className="w-9 h-9 border-2 border-black bg-[#b7c6c2] text-black font-bold text-xs flex items-center justify-center">{who.name.split(' ').map(x=>x[0]).join('')}</div><div className="leading-tight"><div className="text-sm font-medium">{who.name}</div><div className="text-[11px] text-slate-500">{ROLE[role]}</div></div></div>
   </header>
   <main className="p-4 md:p-6 max-w-[1400px]"><Outlet/></main></div></div>)}

// ===== pages/admin/Overview.jsx =====
const win=(ts,f,a,b)=>ts.filter(t=>f(t)&&Date.now()-new Date(t.created)>=a*864e5&&Date.now()-new Date(t.created)<b*864e5).length
const pct=(ts,f)=>{const p=win(ts,f,7,14),c=win(ts,f,0,7);return p?Math.round((c-p)/p*100):0}
function Overview(){
 const {tickets,users}=useApp(),techs=users.filter(u=>u.role==='Technician')
 const day=n=>{const d=new Date(Date.now()-n*864e5);return d.toDateString()}
 const volume=Array.from({length:14},(_,i)=>{const n=13-i;return {name:new Date(Date.now()-n*864e5).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}),value:tickets.filter(t=>new Date(t.created).toDateString()===day(n)).length}})
 const load=techs.map(t=>({name:t.name.split(' ')[0],value:techStats(t,tickets).active}))
 const K=[['Total Users',users.length,null,Users],['Active Users',users.filter(u=>u.status==='Active').length,null,UserCheck],['Total Tickets',tickets.length,pct(tickets,()=>true),Ticket],
  ['Open Tickets',tickets.filter(t=>t.status==='Open').length,pct(tickets,t=>t.status==='Open'),FolderOpen],['In Progress',tickets.filter(t=>t.status==='In Progress').length,pct(tickets,t=>t.status==='In Progress'),Loader],
  ['Resolved Tickets',tickets.filter(isDone).length,pct(tickets,isDone),CheckCircle2],['Critical Tickets',tickets.filter(t=>t.priority==='Critical'&&!isDone(t)).length,pct(tickets,t=>t.priority==='Critical'),AlertTriangle],
  ['Available Technicians',techs.filter(t=>techStats(t,tickets).availability==='Available').length,null,Wrench]]
 return (<Page title="Overview" sub="IT operations command center">
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{K.map(([l,v,d,i])=><Kpi key={l} label={l} value={v} delta={d} icon={i}/>)}</div>
  <div className="grid lg:grid-cols-3 gap-4">
   <Card title="Tickets by status"><Donut data={countBy(tickets,t=>t.status)}/></Card>
   <Card title="Ticket volume (14 days)" className="lg:col-span-2"><Lines data={volume}/></Card>
   <Card title="Tickets by category"><Bars data={countBy(tickets,t=>t.category)}/></Card>
   <Card title="Department distribution"><Bars horizontal data={countBy(tickets,t=>t.dept)}/></Card>
   <Card title="Priority distribution"><Donut data={countBy(tickets,t=>t.priority)}/></Card>
   <Card title="Technician workload (active tickets)" className="lg:col-span-3"><Bars data={load}/></Card></div></Page>)}

// ===== pages/admin/AIIntelligence.jsx =====
const SENT=['Positive','Neutral','Negative','Frustrated']
function AIIntelligence(){
 const {tickets,users,conversations}=useApp(),[sel,setSel]=useState(null),[tid,setTid]=useState(null),[q,setQ]=useState(''),[a,setA]=useState('')
 const top=[...tickets].filter(t=>!isDone(t)).sort((x,y)=>y.score-x.score),ticket=tickets.find(t=>t.id===tid)||top[0],ai=summarize(ticket)
 const trend=[3,2,1,0].map(w=>({name:w?`${w}w ago`:'This week',...Object.fromEntries(SENT.map(s=>[s,conversations.filter(c=>Math.floor(c.daysAgo/7)===w&&c.sentiment===s).length]))}))
 const esc=top.filter(t=>['Breached','At Risk'].includes(slaState(t))||t.score>=80).slice(0,8)
 const net=tickets.filter(t=>t.category==='Network').length,dept=countBy(tickets,t=>t.dept).sort((x,y)=>y.value-x.value)[0]
 const ins=[`${net} network tickets logged; the largest category cluster to monitor.`,`${tickets.filter(t=>t.category==='Account Access'&&!isDone(t)).length} employees have unresolved login or access problems.`,`${dept.name} has the highest ticket volume (${dept.value}).`,`${top.filter(t=>t.priority==='Critical').length} critical tickets require immediate attention.`,`${tickets.filter(t=>t.category==='Hardware').length} hardware tickets suggest ageing devices.`]
 const c=sel&&conversations.find(x=>x.id===sel)
 return (<Page title="AI Intelligence Center" sub="Sentiment, summaries, priority scoring and escalation risk. Sample data, simulated AI.">
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{SENT.map(s=><Kpi key={s} label={`${s} conversations`} value={conversations.filter(x=>x.sentiment===s).length}/>)}</div>
  <div className="grid lg:grid-cols-3 gap-4"><Card title="Sentiment distribution"><Donut data={countBy(conversations,x=>x.sentiment)}/></Card><Card title="Sentiment trend" className="lg:col-span-2"><Lines data={trend} keys={SENT}/></Card></div>
  <Card title="AI insights (sample)"><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{ins.map(i=><div key={i} className="flex gap-2 text-sm bg-[#b7c6c2] rounded-md p-3"><Sparkles size={15} className="text-black shrink-0 mt-0.5"/>{i}</div>)}
   <div className="bg-white border rounded-md p-3 text-sm space-y-2"><div className="font-medium">Ask your IT data</div><div className="flex gap-2"><input className={inp+' flex-1 min-w-0'} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setA(ask(q,{tickets,users}))} placeholder="Which department is busiest?"/><button className={btn} onClick={()=>setA(ask(q,{tickets,users}))}><Send size={14}/></button></div>{a&&<p className="text-slate-600">{a}</p>}</div></div></Card>
  <Card title="Conversation analysis"><Table cols={['Employee','Ticket','Department','Sentiment','Frustration','Date','AI summary','']} onRow={i=>setSel(conversations[i].id)}
   rows={conversations.slice(0,12).map(x=>[x.empName,x.ticketId,x.dept,<Badge v={x.sentiment}/>,<div className="w-20"><Bar v={x.frustration} color={x.frustration>60?'bg-red-500':'bg-blue-500'}/></div>,fmt(x.date),<span className="block max-w-xs truncate">{x.summary}</span>,<span className="text-blue-600">View</span>])}/></Card>
  <div className="grid lg:grid-cols-2 gap-4">
   <Card title="Ticket intelligence" right={<select className={inp} value={ticket.id} onChange={e=>setTid(e.target.value)}>{top.slice(0,10).map(t=><option key={t.id} value={t.id}>{t.id} · {t.title}</option>)}</select>}>
    <div className="text-sm space-y-2"><p><b>Original issue:</b> {ticket.desc}</p><p><b>AI summary:</b> {ai.summary}</p><p><b>Key findings:</b> {ai.findings.join('; ')}</p><p><b>Tried:</b> {ai.tried.join(', ')}</p><p><b>Impact:</b> {ai.impact}</p><p><b>Next steps:</b> {ai.next.join('; ')}</p></div></Card>
   <Card title="Priority score"><PriorityScore t={ticket}/></Card></div>
  <Card title="Escalation risk"><Table cols={['Ticket','Employee','Issue','Status','SLA','Risk','Recommended action']} rows={esc.map(t=>[t.id,t.empName,<span className="block max-w-[200px] truncate">{t.title}</span>,<Badge v={t.status}/>,countdown(t),<Badge v={slaState(t)==='Breached'?'Critical':'High'}/>,slaState(t)==='Breached'?'Escalate to Tier 2 now':'Assign senior technician'])}/></Card>
  {c&&<Modal wide title={`${c.id} · ${c.empName}`} onClose={()=>setSel(null)}><div className="grid md:grid-cols-2 gap-5 text-sm"><div className="space-y-2">{c.messages.map((m,i)=><div key={i} className={`p-2 rounded-lg max-w-[85%] ${m.from==='user'?'bg-black text-white ml-auto':'bg-slate-100'}`}>{m.text}</div>)}</div>
   <div className="space-y-3"><div className="flex gap-2"><Badge v={c.sentiment}/><Badge v={c.urgency}/></div><p><b>Summary:</b> {c.summary}</p><p><b>Key phrases:</b> {c.keyPhrases.join(', ')}</p><p><b>Frustration:</b> {c.frustration}%</p><p><b>Recommended action:</b> {c.action}</p></div></div></Modal>}
 </Page>)}

// ===== pages/admin/Tickets.jsx =====
const Sel=({v,set,opts,label})=><select className={inp} value={v} onChange={e=>set(e.target.value)}><option value="">{label}</option>{opts.map(o=><option key={o}>{o}</option>)}</select>
function Tickets({scope}){
 const {tickets,users,patch,me,techMe}=useApp(),[sp]=useSearchParams(),[q,setQ]=useState(sp.get('q')||''),[f,setF]=useState({}),[sort,setSort]=useState('created'),[open,setOpen]=useState(null)
 const set=k=>v=>setF(o=>({...o,[k]:v})),name=id=>users.find(u=>u.id===id)?.name||'Unassigned'
 let rows=tickets.filter(t=>(scope==='employee'?t.empId===me.id:scope==='technician'?t.tech===techMe.id:true)&&(!q||(t.title+t.id+t.empName).toLowerCase().includes(q.toLowerCase()))&&(!f.status||t.status===f.status)&&(!f.priority||t.priority===f.priority)&&(!f.category||t.category===f.category)&&(!f.dept||t.dept===f.dept))
 rows=[...rows].sort((a,b)=>sort==='score'?b.score-a.score:new Date(b.created)-new Date(a.created))
 const adm=!scope,techs=users.filter(u=>u.role==='Technician')
 return (<Page title={scope==='employee'?'My Tickets':scope==='technician'?'Assigned Tickets':'All Tickets'} sub={`${rows.length} tickets`}>
  <Card><div className="flex flex-wrap gap-2 mb-3"><input className={inp+' w-56'} placeholder="Search tickets" value={q} onChange={e=>setQ(e.target.value)}/>
   <Sel v={f.status||''} set={set('status')} opts={STATUSES} label="All statuses"/><Sel v={f.priority||''} set={set('priority')} opts={PRIORITIES} label="All priorities"/><Sel v={f.category||''} set={set('category')} opts={CATS} label="All categories"/>{adm&&<Sel v={f.dept||''} set={set('dept')} opts={DEPTS} label="All departments"/>}
   <select className={inp} value={sort} onChange={e=>setSort(e.target.value)}><option value="created">Newest first</option><option value="score">Highest AI score</option></select></div>
   <Table onRow={i=>setOpen(rows[i].id)} cols={adm?['ID','Issue','Employee','Department','Category','Priority','AI score','Technician','Status','Created']:['ID','Issue','Category','Priority','Status','Created']}
    rows={rows.slice(0,50).map(t=>adm?[t.id,<span className="block max-w-[220px] truncate">{t.title}</span>,t.empName,t.dept,t.category,<Badge v={t.priority}/>,t.score,
     <select className={inp+' py-0.5'} value={t.tech||''} onClick={e=>e.stopPropagation()} onChange={e=>patch(t.id,{tech:e.target.value,status:t.status==='Open'?'Assigned':t.status})}><option value="">Unassigned</option>{techs.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>,
     <select className={inp+' py-0.5'} value={t.status} onClick={e=>e.stopPropagation()} onChange={e=>patch(t.id,{status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>,fmt(t.created)]
     :[t.id,t.title,t.category,<Badge v={t.priority}/>,<Badge v={t.status}/>,fmt(t.created)])}/></Card>
  {open&&<TicketModal id={open} onClose={()=>setOpen(null)} canEdit={scope!=='employee'}/>}</Page>)}

// ===== pages/admin/Users.jsx =====
function UsersPage(){
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

// ===== pages/admin/Misc.jsx =====
function Conversations(){
 const {conversations}=useApp(),[sel,setSel]=useState(null),[q,setQ]=useState('');const c=conversations.find(x=>x.id===sel)
 const rows=conversations.filter(x=>(x.empName+x.id+x.ticketId).toLowerCase().includes(q.toLowerCase()))
 return (<Page title="Conversations" sub="Employee conversations with the AI agent"><Card><input className={inp+' mb-3 w-56'} placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/>
  <Table onRow={i=>setSel(rows[i].id)} cols={['Employee','Conversation','Ticket','Date','Sentiment','Category','AI summary']} rows={rows.map(x=>[x.empName,x.id,x.ticketId,fmt(x.date),<Badge v={x.sentiment}/>,x.category,<span className="block max-w-xs truncate">{x.summary}</span>])}/></Card>
  {c&&<Modal wide title={`${c.id} · ${c.empName}`} onClose={()=>setSel(null)}><div className="grid md:grid-cols-2 gap-5 text-sm"><div className="space-y-2">{c.messages.map((m,i)=><div key={i} className={`p-2 rounded-lg max-w-[85%] ${m.from==='user'?'bg-black text-white ml-auto':'bg-slate-100'}`}>{m.text}</div>)}</div>
   <div className="space-y-2 bg-[#b7c6c2] rounded-md p-3"><div className="font-medium text-black">AI analysis (sample)</div><Badge v={c.sentiment}/><p>{c.summary}</p><p><b>Key phrases:</b> {c.keyPhrases.join(', ')}</p><p><b>Recommended:</b> {c.action}</p></div></div></Modal>}</Page>)}
function Technicians(){
 const {users,tickets}=useApp(),techs=users.filter(u=>u.role==='Technician'),st=techs.map(t=>({t,...techStats(t,tickets)})),[sel,setSel]=useState(null),s=st.find(x=>x.t.id===sel)
 return (<Page title="Technician Management"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="Total technicians" value={techs.length}/><Kpi label="Available" value={st.filter(x=>x.availability==='Available').length}/><Kpi label="Busy" value={st.filter(x=>x.availability==='Busy').length}/><Kpi label="Avg workload" value={(st.reduce((a,x)=>a+x.active,0)/techs.length).toFixed(1)}/></div>
  <Card><Table onRow={i=>setSel(st[i].t.id)} cols={['Name','ID','Specialization','Active','Resolved','Availability','Performance']} rows={st.map(x=>[x.t.name,x.t.id,x.t.spec,x.active,x.resolved,<Badge v={x.availability}/>,<div className="w-24"><Bar v={x.performance}/></div>])}/></Card>
  {s&&<Modal wide title={s.t.name} onClose={()=>setSel(null)}><div className="grid md:grid-cols-2 gap-4"><Bars data={countBy(tickets.filter(t=>t.tech===s.t.id),t=>t.status)}/><Table cols={['Ticket','Status']} rows={tickets.filter(t=>t.tech===s.t.id).slice(0,8).map(t=>[t.id,<Badge v={t.status}/>])}/></div></Modal>}</Page>)}
const Departments=()=>{const {tickets,users}=useApp();return (<Page title="Departments"><Card><Table cols={['Department','Employees','Tickets','Open','Critical']} rows={DEPTS.map(d=>[d,users.filter(u=>u.dept===d).length,tickets.filter(t=>t.dept===d).length,tickets.filter(t=>t.dept===d&&!isDone(t)).length,tickets.filter(t=>t.dept===d&&t.priority==='Critical').length])}/></Card></Page>)}
const SLA=()=>{const {tickets}=useApp(),live=tickets.filter(t=>!isDone(t)),done=tickets.filter(isDone)
 const risk=live.filter(t=>slaState(t)==='At Risk').sort((a,b)=>SLA_H[a.priority]-SLA_H[b.priority])
 return (<Page title="SLA Monitoring" sub="Targets: Critical 4h · High 8h · Medium 24h · Low 72h"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="Within SLA" value={live.filter(t=>slaState(t)==='Within SLA').length}/><Kpi label="Approaching deadline" value={risk.length}/><Kpi label="Breached" value={live.filter(t=>slaState(t)==='Breached').length}/><Kpi label="Resolved tickets" value={done.length}/></div>
  <Card title="Approaching deadline"><Table cols={['Ticket','Issue','Priority','Countdown']} rows={risk.map(t=>[t.id,t.title,<Badge v={t.priority}/>,<span className="text-amber-700 font-medium">{countdown(t)}</span>])} empty="No tickets near deadline"/></Card></Page>)}
const ART=CATS.flatMap(c=>[`Troubleshooting ${c.toLowerCase()} problems`,`${c}: first steps before you raise a ticket`].map(t=>({t,c,b:`Step-by-step guidance for ${c.toLowerCase()} issues: verify basics, restart, check status page, then contact IT.`})))
function KnowledgeBase(){const [q,setQ]=useState(''),[c,setC]=useState(''),[a,setA]=useState(null)
 const rows=ART.filter(x=>x.t.toLowerCase().includes(q.toLowerCase())&&(!c||x.c===c))
 return (<Page title="Knowledge Base"><div className="flex gap-2"><input className={inp+' w-64'} placeholder="Search articles" value={q} onChange={e=>setQ(e.target.value)}/><select className={inp} value={c} onChange={e=>setC(e.target.value)}><option value="">All categories</option>{CATS.map(x=><option key={x}>{x}</option>)}</select></div>
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{rows.map(x=><button key={x.t} onClick={()=>setA(x)} className="text-left bg-white border rounded-lg p-4 hover:border-black"><div className="text-xs text-blue-600">{x.c}</div><div className="font-medium text-sm mt-1">{x.t}</div></button>)}</div>
  {a&&<Modal title={a.t} onClose={()=>setA(null)}><p className="text-sm">{a.b}</p></Modal>}</Page>)}
const Reports=()=>{const {tickets,conversations}=useApp(),[range,setRange]=useState('30')
 const month=Array.from({length:6},(_,i)=>({name:`M-${5-i}`,value:i<5?10+i*3:tickets.length}))
 return (<Page title="Reports & Analytics" right={<div className="flex gap-2"><select className={inp} value={range} onChange={e=>setRange(e.target.value)}><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select><button className={btn2} onClick={()=>alert('Export started (demo)')}><Download size={14}/>Export</button></div>}>
  <div className="grid lg:grid-cols-3 gap-4"><Card title="Monthly tickets (sample trend)"><Lines data={month}/></Card><Card title="Issues by department"><Bars horizontal data={countBy(tickets,t=>t.dept)}/></Card><Card title="Sentiment"><Donut data={countBy(conversations,c=>c.sentiment)}/></Card>
  <Card title="Priority distribution"><Donut data={countBy(tickets,t=>t.priority)}/></Card><Card title="SLA compliance"><Donut data={countBy(tickets,t=>slaState(t))}/></Card><Card title="Employee satisfaction (sample)"><Bars data={[{name:'Resolution',value:4.3},{name:'Speed',value:3.9},{name:'Comms',value:4.1}]}/></Card></div></Page>)}
const SettingsPage=()=><Page title="Settings" sub="Supabase and Gemini integration points live in src/services."><Card><p className="text-sm text-slate-600">Configuration is not wired in this first version.</p></Card></Page>

// ===== pages/employee/Employee.jsx =====
function EmployeeDashboard(){const {tickets,me}=useApp(),mine=tickets.filter(t=>t.empId===me.id)
 return (<Page title={`Welcome, ${me.name.split(' ')[0]}`} sub="Your IT support at a glance"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="My tickets" value={mine.length}/><Kpi label="Open" value={mine.filter(t=>['Open','Assigned','Reopened'].includes(t.status)).length}/><Kpi label="In progress" value={mine.filter(t=>t.status==='In Progress').length}/><Kpi label="Resolved" value={mine.filter(isDone).length}/></div>
  <Card title="Recent tickets"><Table cols={['ID','Issue','Status','Created']} rows={mine.slice(0,6).map(t=>[t.id,t.title,<Badge v={t.status}/>,fmt(t.created)])}/></Card></Page>)}
const SUG=['My laptop is not working.','I cannot connect to Wi-Fi.','Help me reset my password.','Check my ticket status.','Create a support ticket.']
function AIChat(){
 const {tickets,me,addTicket}=useApp(),[msgs,setMsgs]=useState([{from:'ai',text:`Hi ${me.name.split(' ')[0]}, I am the HelpDesk AI assistant. How can I help today?`}]),[v,setV]=useState(''),[typing,setTyping]=useState(false),issue=useRef(''),end=useRef()
 useEffect(()=>end.current?.scrollIntoView({behavior:'smooth'}),[msgs,typing])
 const send=text=>{if(!text.trim()||typing)return;setMsgs(m=>[...m,{from:'user',text}]);setV('');setTyping(true)
  setTimeout(()=>{const r=reply(text);let card=null
   if(r.intent==='help')issue.current=text
   if(r.intent==='create'){const title=issue.current||'Issue reported via AI assistant';card={type:'created',t:addTicket({title,category:guessCategory(title),priority:'Medium'})}}
   if(r.intent==='status'){card={type:'status',t:tickets.find(t=>t.empId===me.id)}}
   setMsgs(m=>[...m,{from:'ai',text:r.text,card}]);setTyping(false)},900)}
 return (<Page title="AI Helpdesk Assistant"><Card className="max-w-3xl"><div className="h-[55vh] overflow-auto space-y-3">{msgs.map((m,i)=><div key={i} className={`flex gap-2 ${m.from==='user'?'justify-end':''}`}>{m.from==='ai'&&<Bot size={20} className="text-black mt-1 shrink-0"/>}
   <div className={`max-w-[80%] text-sm rounded-lg px-3 py-2 ${m.from==='user'?'bg-black text-white':'bg-slate-100'}`}><div className="whitespace-pre-line">{m.text}</div>
    {m.card&&<div className="mt-2 bg-white text-slate-800 border rounded-md p-3">{m.card.type==='created'&&<div className="flex items-center gap-1 text-emerald-700 text-xs mb-1"><CheckCircle2 size={14}/>Ticket created</div>}<div className="font-medium">{m.card.t.id} · {m.card.t.title}</div><div className="mt-1"><Badge v={m.card.t.status}/></div></div>}</div></div>)}
   {typing&&<div className="text-slate-400 text-sm pl-7">Assistant is typing…</div>}<div ref={end}/></div>
  <div className="flex flex-wrap gap-2 my-3">{SUG.map(s=><button key={s} onClick={()=>send(s)} className="text-xs border rounded-full px-3 py-1 hover:bg-slate-50">{s}</button>)}</div>
  <div className="flex gap-2"><input className={inp+' flex-1'} value={v} onChange={e=>setV(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send(v)} placeholder="Describe your issue"/><button className={btn} onClick={()=>send(v)}><Send size={14}/>Send</button></div></Card></Page>)}
function CreateTicket(){
 const {addTicket,me}=useApp(),[f,setF]=useState({title:'',desc:'',category:CATS[0],device:'',dept:me.dept,priority:'Medium'}),[done,setDone]=useState(null),[file,setFile]=useState('')
 const u=k=>e=>setF({...f,[k]:e.target.value}),L=({k,children})=><label className="block text-sm"><span className="text-slate-600">{k}</span>{children}</label>
 if(done)return <Page title="Ticket submitted"><Card className="max-w-lg"><div className="text-center py-4"><CheckCircle2 className="mx-auto text-emerald-600" size={36}/><p className="mt-2 font-semibold">{done.id}</p><p className="text-sm text-slate-500">Our team will pick this up shortly.</p><button className={btn+' mt-4'} onClick={()=>{setDone(null);setF({...f,title:'',desc:''})}}>Create another ticket</button></div></Card></Page>
 return (<Page title="Create Ticket"><Card className="max-w-2xl"><div className="space-y-3">
  <L k="Issue title"><input className={inp+' w-full mt-1'} value={f.title} onChange={u('title')}/></L><L k="Description"><textarea rows={4} className={inp+' w-full mt-1'} value={f.desc} onChange={u('desc')}/></L>
  <div className="grid sm:grid-cols-2 gap-3"><L k="Category"><select className={inp+' w-full mt-1'} value={f.category} onChange={u('category')}>{CATS.map(x=><option key={x}>{x}</option>)}</select></L><L k="Device"><input className={inp+' w-full mt-1'} value={f.device} onChange={u('device')}/></L>
   <L k="Department"><select className={inp+' w-full mt-1'} value={f.dept} onChange={u('dept')}>{DEPTS.map(x=><option key={x}>{x}</option>)}</select></L><L k="Priority"><select className={inp+' w-full mt-1'} value={f.priority} onChange={u('priority')}>{PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></L></div>
  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"><Paperclip size={14}/>{file||'Attach screenshot'}<input type="file" accept="image/*" className="hidden" onChange={e=>setFile(e.target.files[0]?.name||'')}/></label>
  <button className={btn} disabled={!f.title.trim()} onClick={()=>setDone(addTicket(f))}>Submit ticket</button></div></Card></Page>)}
const Notifications=()=>{const {notifs}=useApp();return <Page title="Notifications"><Card>{notifs.map(n=><div key={n.id} className="py-2 border-b last:border-0 text-sm">{n.text}</div>)}</Card></Page>}
const Profile=()=>{const {me}=useApp();return <Page title="Profile"><Card className="max-w-md text-sm space-y-1"><div><b>{me.name}</b></div><div>{me.id} · {me.dept}</div><div>{me.email}</div></Card></Page>}

// ===== pages/technician/TechnicianDashboard.jsx =====
function TechnicianDashboard(){const {tickets,techMe}=useApp(),mine=tickets.filter(t=>t.tech===techMe.id),live=mine.filter(t=>!isDone(t)).sort((a,b)=>b.score-a.score)
 return (<Page title={`Hello, ${techMe.name.split(' ')[0]}`} sub="Work queue sorted by AI priority score"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3"><Kpi label="Active" value={live.length}/><Kpi label="Resolved" value={mine.length-live.length}/><Kpi label="Critical" value={live.filter(t=>t.priority==='Critical').length}/><Kpi label="SLA at risk" value={live.filter(t=>['At Risk','Breached'].includes(slaState(t))).length}/></div>
  <Card title="Next up"><Table cols={['ID','Issue','Priority','Score','SLA','Status']} rows={live.slice(0,8).map(t=>[t.id,t.title,<Badge v={t.priority}/>,t.score,countdown(t),<Badge v={t.status}/>])} empty="Queue is clear"/></Card></Page>)}

// ===== pages/Landing.jsx =====
const Y='#ffe17c',C='#171e19',S='#b7c6c2'
const lpush='border-2 border-black rounded-xl font-bold transition-all duration-200 hover:translate-x-1 hover:translate-y-1 inline-flex items-center gap-2 px-6 py-3'
const Btn=({to,dark,big,children})=><Link to={to} className={`${lpush} ${dark?'bg-black text-white':'bg-white text-black'} ${big?'shadow-[8px_8px_0_0_#000] hover:shadow-[4px_4px_0_0_#000]':'shadow-[4px_4px_0_0_#000] hover:shadow-none'}`}>{children}</Link>
const BRANDS=['ACME','GLOBEX','INITECH','UMBRELLA','HOOLI','STARK','WAYNE','SOYLENT']
const FEATURES=[[MessageCircle,'AI helpdesk chat','Employees describe problems in plain language and get fixes or a ticket in seconds.'],[Gauge,'Priority scoring','Every ticket scores 0 to 100 on impact, severity, urgency and recurrence.'],[Sparkles,'Sentiment analysis','Spot frustrated employees before a small issue becomes an escalation.'],[AlertTriangle,'Escalation alerts','See which tickets are about to breach SLA and what to do about them.'],[Timer,'SLA monitoring','Live countdowns per priority keep technicians focused on the next deadline.'],[BarChart3,'Reports','Department, technician and satisfaction reports ready to export.']]
const Shadow='border-2 border-black'
function Landing(){return (<div className="font-sans text-black">
 <header className="fixed top-0 inset-x-0 h-20 z-30 bg-[#ffe17c] border-b-2 border-black flex items-center justify-between px-6 md:px-10">
  <div className="flex items-center gap-2"><div className="w-10 h-10 bg-black flex items-center justify-center"><Zap size={20} fill={Y} color={Y}/></div><span className="font-display font-extrabold tracking-tighter text-2xl">HelpDesk AI</span></div>
  <nav className="hidden md:flex gap-8 font-bold text-sm"><a href="#features">Features</a><a href="#how">How it works</a><a href="#who">Who it is for</a><a href="#love">Reviews</a></nav>
  <Link to="/admin" className="bg-black text-white font-bold text-sm px-4 py-2 border-2 border-black rounded-lg shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">Start free trial</Link></header>
 <section className="pt-20 bg-[#ffe17c] relative"><div className="absolute inset-0 dots pointer-events-none"/>
  <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center px-6 md:px-10 py-20">
   <div><span className="inline-block bg-white border-2 border-black rounded-full px-4 py-1 text-sm font-bold">NEW: AI Ticket Intelligence 2.0</span>
    <h1 className="font-display font-extrabold tracking-tighter text-6xl md:text-8xl leading-[0.95] mt-6">IT support that <span style={{WebkitTextStroke:'2px #000',color:'transparent'}}>thinks</span> first.</h1>
    <p className="text-lg mt-6 max-w-lg">Employees chat with an AI agent, technicians resolve the right ticket first, and admins see sentiment, risk and SLA in one command center.</p>
    <div className="flex flex-wrap gap-4 mt-8"><Btn to="/admin" dark big>Open admin dashboard<ArrowRight size={18}/></Btn><Btn to="/employee/chat">Try the AI assistant</Btn></div></div>
   <div className="bg-white border-2 border-black rounded-2xl shadow-[12px_12px_0_0_#000] overflow-hidden"><div className="bg-black px-4 py-3 flex gap-2">{['#ff5f57','#febc2e','#28c840'].map(c=><span key={c} className="w-3 h-3 rounded-full" style={{background:c}}/>)}</div>
    <div className="p-4 grid grid-cols-3 gap-3"><div className="p-3 border-2 border-black rounded-lg" style={{background:S}}><div className="text-xs font-bold">Open</div><div className="font-display font-extrabold text-3xl">42</div></div><div className="p-3 border-2 border-black rounded-lg text-white" style={{background:C}}><div className="text-xs font-bold">Critical</div><div className="font-display font-extrabold text-3xl">7</div></div><div className="p-3 border-2 border-black rounded-lg" style={{background:S}}><div className="text-xs font-bold">SLA met</div><div className="font-display font-extrabold text-3xl">94%</div></div>
     <div className="col-span-3 border-2 border-black rounded-lg p-3 flex items-end gap-2 h-32">{[40,65,50,80,60,95,70].map((h,i)=><div key={i} className="flex-1 border-2 border-black" style={{height:`${h}%`,background:i%2?C:S}}/>)}</div></div></div></div></section>
 <section className="bg-[#171e19] border-y-2 border-black py-6 overflow-hidden"><div className="marquee flex gap-16 font-display font-extrabold text-3xl tracking-tighter opacity-50" style={{color:S}}>{[...BRANDS,...BRANDS].map((b,i)=><span key={i}>{b}</span>)}</div></section>
 <section className="bg-white py-24 px-6 md:px-10"><div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
  <div className="rounded-3xl p-8 bg-[#f4f4f5] border-2 border-dashed border-gray-400 opacity-70"><h2 className="text-3xl mb-5">Without HelpDesk AI</h2>{['Tickets pile up in a shared inbox','Frustration is invisible until it escalates','Priorities are guessed','SLA breaches found too late'].map(t=><p key={t} className="flex gap-3 font-bold py-1.5"><X className="shrink-0 text-red-600"/>{t}</p>)}</div>
  <div className="rounded-3xl p-8 bg-[#ffe17c] border-2 border-black shadow-[8px_8px_0_0_#000]"><h2 className="text-3xl mb-5">With HelpDesk AI</h2>{['The AI agent resolves or logs issues instantly','Sentiment flags unhappy employees early','Every ticket gets a 0 to 100 score','Countdowns warn before SLA breaches'].map(t=><p key={t} className="flex gap-3 font-bold py-1.5"><Check className="shrink-0"/>{t}</p>)}</div></div></section>
 <section id="features" className="bg-[#ffe17c] border-y-2 border-black py-24 px-6 md:px-10"><div className="max-w-6xl mx-auto"><h2 className="text-5xl md:text-6xl mb-12">Everything IT needs.</h2>
  <div className="grid md:grid-cols-3 gap-6">{FEATURES.map(([I,t,d])=><div key={t} className="group bg-white border-2 border-black rounded-xl shadow-[4px_4px_0_0_#000] p-6"><div className="w-16 h-16 border-2 border-black rounded-lg flex items-center justify-center bg-[#b7c6c2] group-hover:bg-[#ffe17c] transition-colors"><I size={28}/></div><h3 className="text-2xl mt-4">{t}</h3><p className="mt-2 text-sm">{d}</p></div>)}</div></div></section>
 <section id="how" className="bg-[#171e19] text-white py-24 px-6 md:px-10"><div className="max-w-5xl mx-auto"><h2 className="text-5xl md:text-6xl mb-16">How it works</h2>
  <div className="relative grid md:grid-cols-3 gap-10"><div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-[#272727]"/>
   {[['Ask',S,'An employee describes the issue to the AI assistant.'],['Score',Y,'The platform summarizes, scores sentiment and priority.'],['Resolve','#fff','The right technician fixes it before the SLA clock runs out.']].map(([t,c,d])=><div key={t} className="relative text-center"><div className="w-24 h-24 mx-auto rounded-full bg-[#171e19] flex items-center justify-center font-display font-extrabold text-xl" style={{border:`4px solid ${c}`,color:c}}>{t}</div><p className="mt-4 text-sm text-gray-300">{d}</p></div>)}</div></div></section>
 <section id="who" className="bg-white py-24 px-6 md:px-10"><div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
  {[['Employees',S,'text-black','',"Get answers from a chat, track every ticket, never repeat yourself."],['Technicians',Y,'text-black','shadow-[8px_8px_0_0_#000]','A queue sorted by AI score with the SLA countdown front and centre.'],['IT admins','#272727','text-white','','Sentiment, escalation risk and reports across every department.']].map(([n,bg,tc,sh,d])=><div key={n} className={`rounded-2xl p-8 border-2 border-black ${sh} ${tc}`} style={{background:bg}}><span className="inline-block bg-white text-black border-2 border-black rounded-full px-3 py-0.5 text-sm font-bold">{n}</span><p className="font-display font-extrabold tracking-tighter text-2xl mt-6">{d}</p></div>)}</div></section>
 <section id="love" className="py-24 px-6 md:px-10" style={{background:S}}><div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
  {[['We cut first-response time in half in a month.','Priya N.','IT Manager, Globex'],['Frustrated users surface before they escalate.','Rohan S.','Service Desk Lead, Initech'],['The score tells my team what to open next.','Kavya M.','Technician, Acme']].map(([q,n,r])=><div key={n} className="bg-white border-2 border-black p-6 rounded-tr-3xl rounded-bl-3xl rounded-tl-[2px] rounded-br-[2px]"><div className="flex gap-1 mb-3">{[0,1,2,3,4].map(i=><Star key={i} size={18} fill="#ffbc2e" color="#ffbc2e"/>)}</div><p className="font-bold text-lg">“{q}”</p><p className="text-sm mt-4">{n}, {r}</p></div>)}</div></section>
 <section className="bg-[#ffe17c] border-y-2 border-black py-24 px-6 text-center"><h2 className="text-5xl md:text-7xl max-w-3xl mx-auto">Ready to run IT like a product?</h2><div className="mt-8 flex justify-center gap-4 flex-wrap"><Btn to="/admin" dark big>Start free trial</Btn><Btn to="/technician">View technician portal</Btn></div></section>
 <footer className="bg-[#171e19] text-[#b7c6c2] py-16 px-6 md:px-10"><div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
  <div className="col-span-2 md:col-span-1"><div className="flex items-center gap-2 text-white font-display font-extrabold text-xl tracking-tighter"><div className="w-10 h-10 bg-black border border-gray-500 flex items-center justify-center"><Zap size={18} fill={Y} color={Y}/></div>HelpDesk AI</div></div>
  {[['Product',['Admin','Technician','Employee']],['Company',['About','Careers','Contact']],['Legal',['Privacy','Terms']]].map(([h,l])=><div key={h}><div className="text-white font-bold mb-3">{h}</div>{l.map(x=><div key={x} className="py-1">{x}</div>)}</div>)}</div></footer></div>)}

// ===== App.jsx =====
function AppRoutes(){return (<Routes>
 <Route path="/admin" element={<Layout role="admin"/>}><Route index element={<Overview/>}/><Route path="ai" element={<AIIntelligence/>}/><Route path="tickets" element={<Tickets/>}/><Route path="conversations" element={<Conversations/>}/><Route path="users" element={<UsersPage/>}/><Route path="technicians" element={<Technicians/>}/><Route path="departments" element={<Departments/>}/><Route path="sla" element={<SLA/>}/><Route path="kb" element={<KnowledgeBase/>}/><Route path="reports" element={<Reports/>}/><Route path="settings" element={<SettingsPage/>}/></Route>
 <Route path="/employee" element={<Layout role="employee"/>}><Route index element={<EmployeeDashboard/>}/><Route path="chat" element={<AIChat/>}/><Route path="create" element={<CreateTicket/>}/><Route path="tickets" element={<Tickets scope="employee"/>}/><Route path="notifications" element={<Notifications/>}/><Route path="profile" element={<Profile/>}/></Route>
 <Route path="/technician" element={<Layout role="technician"/>}><Route index element={<TechnicianDashboard/>}/><Route path="tickets" element={<Tickets scope="technician"/>}/><Route path="kb" element={<KnowledgeBase/>}/></Route>
 <Route path="*" element={<Navigate to="/admin" replace/>}/></Routes>)}

function Setup(){const [ok,setOk]=useState(false)
 const dl=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([SEED_SQL],{type:'text/plain'}));a.download='ps4_it_helpdesk.sql';a.click()}
 return (<div className="min-h-screen bg-[#ffe17c] p-6"><div className="max-w-4xl mx-auto space-y-4"><h1 className="text-3xl">Database setup</h1>
  <p className="text-sm">Run this seed in the Supabase SQL editor. It creates the tables, loads the records and adds demo access policies (replace with auth-based policies before real use).</p>
  <div className="flex gap-2"><button className={btn} onClick={()=>{navigator.clipboard.writeText(SEED_SQL);setOk(true)}}>{ok?'Copied':'Copy SQL'}</button><button className={btn2} onClick={dl}>Download ps4_it_helpdesk.sql</button></div>
  <pre className="bg-white border-2 border-black rounded-xl p-4 text-xs overflow-auto max-h-[60vh]">{SEED_SQL.slice(0,2500)}{'\n…'}</pre></div></div>)}
export default function App(){return (<BrowserRouter><style>{CSS}</style><Routes><Route path="/" element={<Landing/>}/><Route path="/setup" element={<Setup/>}/><Route path="/*" element={<AppProvider><AppRoutes/></AppProvider>}/></Routes></BrowserRouter>)}
