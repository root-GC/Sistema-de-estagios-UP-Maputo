import { createContext, useContext, useState } from 'react';

interface NavContextType {
  page: string;
  params: Record<string, any>;
  go: (page: string, params?: Record<string, any>) => void;
}

const NavCtx = createContext<NavContextType>(null!);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState('dashboard');
  const [params, setParams] = useState<Record<string, any>>({});

  const go = (p: string, ps: Record<string, any> = {}) => {
    setPage(p);
    setParams(ps);
  };

  return (
    <NavCtx.Provider value={{ page, params, go }}>
      {children}
    </NavCtx.Provider>
  );
}

export const useNav = () => useContext(NavCtx);