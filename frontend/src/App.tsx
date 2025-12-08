import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BookOpen, Settings, LucideIcon } from 'lucide-react';
import Home from './pages/Home';
import Article from './pages/Article';
import Admin from './pages/Admin';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon?: LucideIcon;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, icon: Icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link to={to} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive ? 'bg-black text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}>
      {Icon && <Icon size={18} />}
      <span className="font-medium">{children}</span>
    </Link>
  );
};

const NavBar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          AutoBlog.ai
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/" icon={BookOpen}>Read</NavLink>
          <NavLink to="/admin" icon={Settings}>Admin</NavLink>
        </nav>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<div className="text-center py-20"><h1 className="text-4xl font-bold text-gray-300">404</h1></div>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
};

export default App;
