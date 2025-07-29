// src/components/common/Header.jsx
import React, { useContext } from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { FaUserTie, FaUserGraduate } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './Header.css';

const Header = () => {
  const { isAdmin, toggleAdminMode } = useAppContext();

  return (
    <Navbar bg="white" expand="lg" className="mb-4 border-bottom">
      <Container>
        <Navbar.Brand href="#home">
          <span className="brand-text">TrustedToLead</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#profile">Profile</Nav.Link>
            <Nav.Link href="#opportunities">Opportunities</Nav.Link>
            <Nav.Link href="#network">Network</Nav.Link>
            <Nav.Link href="#plan">Plan</Nav.Link>
          </Nav>
          <div className="d-flex align-items-center">
            <span className="me-2">
              {isAdmin ? 'Admin Mode' : 'Student Mode'}
            </span>
            <Button 
              variant={isAdmin ? 'primary' : 'outline-primary'} 
              size="sm"
              onClick={toggleAdminMode}
              className="mode-toggle"
            >
              {isAdmin ? (
                <>
                  <FaUserGraduate className="me-1" />
                  Switch to Student
                </>
              ) : (
                <>
                  <FaUserTie className="me-1" />
                  Switch to Admin
                </>
              )}
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
