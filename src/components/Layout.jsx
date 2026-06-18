import React from 'react';
import Sidebar from './Sidebar';
import AIAssistant from './AIAssistant';
import GlobalSearch from './GlobalSearch';

const Layout = ({ children }) => (
  <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden transition-colors duration-200">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
    <AIAssistant />
    <GlobalSearch />
  </div>
);

export default Layout;
