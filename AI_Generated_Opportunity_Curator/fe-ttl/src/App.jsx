import { useState, useEffect } from 'react';
import { Container, Tab, Tabs, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './bootstrap-custom.css';
import './App.css';

// Import components
import Header from './components/common/Header';
import Profile from './components/Profile/Profile';
import OpportunityTab from './components/Tabs/OpportunityTab';
import NetworkTab from './components/Tabs/NetworkTab';
import PlanTab from './components/Tabs/PlanTab';
import { AppProvider } from './context/AppContext';

function App() {
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Handle tab changes
  const handleTabSelect = (tab) => {
    if (tab) {
      setActiveTab(tab);
      // Update URL without page reload
      window.history.pushState({}, '', `#${tab}`);
    }
  };

  // Check URL for tab on initial load
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (['profile', 'opportunity', 'network', 'plan'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  // Toggle admin mode
  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
  };

  return (
    <AppProvider>
      <div className="app">
        <Header isAdmin={isAdmin} toggleAdminMode={toggleAdminMode} />
        
        <Container className="mt-4">
          {error && (
            <Alert 
              variant="danger" 
              dismissible 
              onClose={() => setError(null)}
              className="mb-4"
            >
              {error}
            </Alert>
          )}

          {isAdmin ? (
            <AdminView />
          ) : (
            <Tabs
              activeKey={activeTab}
              onSelect={handleTabSelect}
              id="main-tabs"
              className="mb-3"
              justify
            >
              <Tab eventKey="profile" title="Profile">
                <Profile />
              </Tab>
              <Tab eventKey="opportunity" title="Opportunities">
                <OpportunityTab />
              </Tab>
              <Tab eventKey="network" title="Network">
                <NetworkTab />
              </Tab>
              <Tab eventKey="plan" title="Plan">
                <PlanTab />
              </Tab>
            </Tabs>
          )}
        </Container>
      </div>
    </AppProvider>
  );
}

// Simple admin view component
const AdminView = () => (
  <div className="admin-view">
    <h2>Admin Dashboard</h2>
    <p>Admin features will be available here.</p>
  </div>
);

export default App;
