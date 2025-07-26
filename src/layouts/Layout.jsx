// src/layouts/Layout.jsx
import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center px-2 py-2  w-24 h-16 text-xs ${
      isActive ? 'bg-[#FF9D23] text-white' : 'text-white'
    }`;

  return (
    <div className="h-screen flex flex-col font-sans">
      <header className="bg-[#C14600] flex items-center justify-end px-2">
        <nav className="flex">
          <NavLink to="/pasajeros" className={linkClass}>
            {<svg xmlns="http://www.w3.org/2000/svg" width={512} height={512} viewBox="0 0 512 512"><circle cx={152} cy={184} r={72} fill="currentColor"></circle><path fill="currentColor" d="M234 296c-28.16-14.3-59.24-20-82-20c-44.58 0-136 27.34-136 82v42h150v-16.07c0-19 8-38.05 22-53.93c11.17-12.68 26.81-24.45 46-34"></path><path fill="currentColor" d="M340 288c-52.07 0-156 32.16-156 96v48h312v-48c0-63.84-103.93-96-156-96"></path><circle cx={340} cy={168} r={88} fill="currentColor"></circle></svg>}
            <span className="mt-1 font-inter">Pasajeros</span>
          </NavLink>
          <NavLink to="/paqueteria" className={linkClass}>
            {<svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 48 48"><path fill="currentColor" d="M26.321 4.832a6.25 6.25 0 0 0-4.642 0l-5.29 2.116l18.738 7.505l7.344-2.938a4.3 4.3 0 0 0-1.143-.68zm5.442 10.967L13.024 8.294l-6.352 2.54c-.422.17-.806.4-1.143.681L24 18.904zM4 14.78c0-.386.052-.764.151-1.124l18.599 7.44v22.391a6 6 0 0 1-1.071-.32L6.672 37.163A4.25 4.25 0 0 1 4 33.219zm22.321 28.386q-.524.21-1.071.321V21.096l18.599-7.44c.099.361.151.739.151 1.125v18.438a4.25 4.25 0 0 1-2.672 3.945z"></path></svg>}
            <span className="mt-1 font-inter">Paquetería</span>
          </NavLink>
          <NavLink to="/despachos" className={linkClass}>
            {<svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 24 24"><path fill="currentColor" fillRule="evenodd" d="M14.25 2.5a.25.25 0 0 0-.25-.25H7A2.75 2.75 0 0 0 4.25 5v14A2.75 2.75 0 0 0 7 21.75h10A2.75 2.75 0 0 0 19.75 19V9.147a.25.25 0 0 0-.25-.25H15a.75.75 0 0 1-.75-.75zm.75 9.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5zm0 4a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5z" clipRule="evenodd"></path><path fill="currentColor" d="M15.75 2.824c0-.184.193-.301.336-.186q.182.147.323.342l3.013 4.197c.068.096-.006.22-.124.22H16a.25.25 0 0 1-.25-.25z"></path></svg>}
            <span className="mt-1 font-inter">Despachos</span>
          </NavLink>
          <NavLink to="/choferes" className={linkClass}>
            {<svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 48 48"><path fill="currentColor" fillRule="evenodd" d="M15 9.5c0-.437 4.516-3.5 9-3.5s9 3.063 9 3.5c0 1.56-.166 2.484-.306 2.987c-.093.33-.402.513-.745.513H16.051c-.343 0-.652-.183-.745-.513C15.166 11.984 15 11.06 15 9.5m7.5-.5a1 1 0 1 0 0 2h3a1 1 0 0 0 0-2zm-6.462 10.218c-3.33-1.03-2.49-2.87-1.22-4.218H33.46c1.016 1.298 1.561 3.049-1.51 4.097q.05.445.05.903a8 8 0 1 1-15.962-.782m7.69.782c2.642 0 4.69-.14 6.26-.384q.012.19.012.384a6 6 0 1 1-11.992-.315c1.463.202 3.338.315 5.72.315m8.689 14.6A9.99 9.99 0 0 0 24 30a9.99 9.99 0 0 0-8.42 4.602a2.5 2.5 0 0 0-1.447-1.05l-1.932-.517a2.5 2.5 0 0 0-3.062 1.767L8.363 37.7a2.5 2.5 0 0 0 1.768 3.062l1.931.518A2.5 2.5 0 0 0 14 41.006A1 1 0 0 0 16 41v-1q0-.572.078-1.123l5.204 1.395a3 3 0 0 0 5.436 0l5.204-1.395q.077.551.078 1.123v1a1 1 0 0 0 2 .01c.56.336 1.252.453 1.933.27l1.932-.517a2.5 2.5 0 0 0 1.768-3.062l-.777-2.898a2.5 2.5 0 0 0-3.062-1.767l-1.932.517a2.5 2.5 0 0 0-1.445 1.046m-15.814 2.347A8.01 8.01 0 0 1 23 32.062v4.109a3 3 0 0 0-1.88 1.987zm14.794 0A8.01 8.01 0 0 0 25 32.062v4.109c.904.32 1.61 1.06 1.88 1.987zM24 40a1 1 0 1 0 0-2a1 1 0 0 0 0 2" clipRule="evenodd"></path></svg>}
            <span className="mt-1 font-inter">Choferes</span>
          </NavLink>
          <NavLink to="/ajustes" className={linkClass}>
            {<svg xmlns="http://www.w3.org/2000/svg" width={48} height={48} viewBox="0 0 24 24"><path fill="currentColor" d="M10.825 22q-.675 0-1.162-.45t-.588-1.1L8.85 18.8q-.325-.125-.612-.3t-.563-.375l-1.55.65q-.625.275-1.25.05t-.975-.8l-1.175-2.05q-.35-.575-.2-1.225t.675-1.075l1.325-1Q4.5 12.5 4.5 12.337v-.675q0-.162.025-.337l-1.325-1Q2.675 9.9 2.525 9.25t.2-1.225L3.9 5.975q.35-.575.975-.8t1.25.05l1.55.65q.275-.2.575-.375t.6-.3l.225-1.65q.1-.65.588-1.1T10.825 2h2.35q.675 0 1.163.45t.587 1.1l.225 1.65q.325.125.613.3t.562.375l1.55-.65q.625-.275 1.25-.05t.975.8l1.175 2.05q.35.575.2 1.225t-.675 1.075l-1.325 1q.025.175.025.338v.674q0 .163-.05.338l1.325 1q.525.425.675 1.075t-.2 1.225l-1.2 2.05q-.35.575-.975.8t-1.25-.05l-1.5-.65q-.275.2-.575.375t-.6.3l-.225 1.65q-.1.65-.587 1.1t-1.163.45zm1.225-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5"></path></svg>}
            <span className="mt-1 font-inter">Ajustes</span>
          </NavLink>

          <button
          onClick={handleLogout}
          className="text-white text-sm px-4 hover:text-gray-200 font-inter"
        >
          Cerrar sesión
        </button>
        </nav>
      </header>

      <main className="flex-1 overflow-auto bg-gray-100 p-4">
        <Outlet />
      </main>
    </div>
  );
}
