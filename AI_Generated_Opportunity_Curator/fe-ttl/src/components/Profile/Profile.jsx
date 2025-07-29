// src/components/Profile/Profile.jsx
import React, { useState, useContext } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';
import './Profile.css';

const Profile = () => {
  const { userProfile, saveProfile, isAdmin } = useAppContext();
  const [text, setText] = useState(userProfile.text || '');
  const [resume, setResume] = useState(null);
  const [resumeContent, setResumeContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResume(file);

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setResumeContent(e.target.result);
      };
      reader.readAsText(file);
    } else {
      setResumeContent(`File uploaded: ${file.name} (Content not extracted - please convert to text format for full functionality)`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      const profileData = {
        text,
        resume: resume ? {
          name: resume.name,
          content: resumeContent
        } : null
      };
      
      saveProfile(profileData);
      setIsSaving(false);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <Card.Header as="h5">User Profile</Card.Header>
        <Card.Body>
          <Card.Title>Jirs</Card.Title>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="profileText">
              <Form.Label>Share your thoughts, goals, or any information you'd like to include:</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell us about yourself, your interests, and your goals..."
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="resumeUpload">
              <Form.Label>Upload your resume (PDF, DOCX, or TXT):</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="mb-2"
              />
              {resume && (
                <div className="text-muted small">
                  Selected file: {resume.name}
                </div>
              )}
            </Form.Group>

            {resumeContent && (
              <Form.Group className="mb-3">
                <Form.Label>Resume Content:</Form.Label>
                <div className="resume-preview">
                  <pre>{resumeContent}</pre>
                </div>
              </Form.Group>
            )}

            <Button 
              variant="primary" 
              type="submit" 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>

            {showSuccess && (
              <Alert 
                variant="success" 
                className="mt-3"
                onClose={() => setShowSuccess(false)}
                dismissible
              >
                Profile saved successfully!
              </Alert>
            )}
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Profile;
