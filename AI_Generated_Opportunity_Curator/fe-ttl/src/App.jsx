import { useState, useEffect } from 'react';
import { Container, Alert, Nav, NavDropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './bootstrap-custom.css';
import './App.css';

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

  const handleTabSelect = (tab) => {
    if (tab) {
      setActiveTab(tab);
      window.history.pushState({}, '', `#${tab}`);
    }
  };

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (['profile', 'opportunity', 'network', 'plan'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

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
          <Nav
            variant="tabs"
            activeKey={activeTab}
            onSelect={handleTabSelect}
            className="mb-3"
          >
            <Nav.Item>
              <Nav.Link eventKey="profile">Profile</Nav.Link>
            </Nav.Item>
            <NavDropdown title="More" id="nav-dropdown-more">
              <NavDropdown.Item eventKey="opportunity">Opportunities</NavDropdown.Item>
              <NavDropdown.Item eventKey="network">Network</NavDropdown.Item>
              <NavDropdown.Item eventKey="plan">Plan</NavDropdown.Item>
            </NavDropdown>
          </Nav>
          {activeTab === "profile" && <Profile />}
          {activeTab === "opportunity" && <OpportunityTab />}
          {activeTab === "network" && <NetworkTab />}
          {activeTab === "plan" && <PlanTab />}
        </Container>
      </div>
    </AppProvider>
  );
}

const AdminView = () => (
  <div className="admin-view">
    <h2>Admin Dashboard</h2>
    <p>Admin features will be available here.</p>
  </div>
);

export default App;
