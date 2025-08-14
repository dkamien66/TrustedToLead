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
import LeadershipQuestionnaire from './components/LeadershipQuestionnaire/LeadershipQuestionnaire';
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
    if (['profile', 'opportunity', 'network', 'plan', 'questionnaire'].includes(hash)) {
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
            <NavDropdown title="Select Plans" id="nav-dropdown-more">
              <NavDropdown.Item eventKey="opportunity">Discover Opportunities</NavDropdown.Item>
              <NavDropdown.Item eventKey="network">Networking Opportunities</NavDropdown.Item>
              <NavDropdown.Item eventKey="plan">Career Planner</NavDropdown.Item>
            </NavDropdown>
            <Nav.Item>
              <Nav.Link eventKey="questionnaire">Leadership Questionnaire</Nav.Link>
            </Nav.Item>
          </Nav>
          {activeTab === "profile" && <Profile />}
          {activeTab === "opportunity" && <OpportunityTab />}
          {activeTab === "network" && <NetworkTab />}
          {activeTab === "plan" && <PlanTab />}
          {activeTab === "questionnaire" && <LeadershipQuestionnaire />}
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
