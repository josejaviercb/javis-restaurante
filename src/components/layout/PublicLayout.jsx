import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function PublicLayout() {
  const { pathname } = useLocation();

  // Al cambiar de página se vuelve arriba del todo.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 md:pt-28">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
