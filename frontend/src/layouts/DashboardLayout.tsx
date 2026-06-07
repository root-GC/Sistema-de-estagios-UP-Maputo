// import { Outlet } from 'react-router-dom';
// import { Sidebar } from '../components/shared/Sidebar';
// import { useAuth } from '../context/AuthContext';
// import { useState } from 'react';

// export function DashboardLayout() {
//   const { user } = useAuth();
//   const [search, setSearch] = useState('');

//   return (
//     <div className="layout">
//       <Sidebar />

//       <div className="main">
//         {/* Header fixo */}
//         <header className="header">
//           <div className="header-left">
//             <div className="search-wrapper">
//               <span className="material-symbols-outlined">search</span>
//               <input
//                 className="search-input"
//                 type="text"
//                 placeholder="Pesquisar..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="header-right">
//             {/* Notificações */}
//             <button className="notification-btn" aria-label="Notificações">
//               <span className="material-symbols-outlined">notifications</span>
//               <span className="notification-badge">3</span>
//             </button>

//             <div className="divider" />

//             {/* Utilizador */}
//             <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
//               <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
//                 {user?.name?.charAt(0).toUpperCase()}
//               </div>
//               <div className="user-text" style={{ lineHeight: 1.2 }}>
//                 <div className="user-name">{user?.name}</div>
//                 <div className="user-role" style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.8)' }}>
//                   {user?.roles?.[0]}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Conteúdo da página */}
//         <div className="content">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// }