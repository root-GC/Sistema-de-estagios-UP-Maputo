// // src/layouts/AuthLayout.tsx
// import type { ReactNode } from 'react';

// interface AuthLayoutProps {
//   title: string;
//   subtitle?: string;
//   children: ReactNode;
// }

// export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
//   return (
//     <div className="auth-wrap">
//       <div className="auth-box">
//         <div className="auth-logo">
//           <div className="auth-logo-icon">
//             <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
//               school
//             </span>
//           </div>
//           <h1>{title}</h1>
//           {subtitle && <p>{subtitle}</p>}
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// }