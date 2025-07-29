// src/components/common/Header.jsx
import React, { useContext } from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { FaUserTie, FaUserGraduate } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import './Header.css';
import uwLogo from '../../assets/uw-crest-color-web-digital.png'; // Assuming you have a UW logo image 
const Header = () => {
  const { isAdmin, toggleAdminMode } = useAppContext();

  return (
    <Navbar bg="white" expand="lg" className="mb-4 border-bottom">
      <Container>
        <Navbar.Brand href="#home">
          <img
            src={uwLogo}
            alt="University of Wisconsin-Madison"
            height="40"
            className="me-2"
            style={{ maxHeight: '40px', width: 'auto' }}
          />
          <span className="brand-text">TrustedToLead</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
        
          <div className="d-flex align-items-right">
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
