// src/components/Profile/Profile.jsx
import React, { useState, useContext } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAppContext } from '../../context/AppContext';
import './Profile.css';

const Profile = () => {
  const { userProfile, saveProfile, isAdmin } = useAppContext();
  const [major, setMajor] = useState(userProfile.major || '');
  const [leadershipSkills, setLeadershipSkills] = useState(userProfile.leadershipSkills || '');
  const [bigPictureGoals, setBigPictureGoals] = useState(userProfile.bigPictureGoals || '');
  const [experiences, setExperiences] = useState(userProfile.experiences || ''); 
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
    
    // Combine all input information (Major, Leadership Skills, Big picture goals, and experiences)
    // Simulate API call
    setTimeout(() => {
      const profileData = {
        text: "The student's major is " + major + ". The student is interested in developing the following leadership skills: " + leadershipSkills + ". The student has the following big picture goals: " + bigPictureGoals + ". The student has already had the following experiences: " + experiences + ". The student's resume contains the following information: " + resumeContent
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
              <Form.Label>What's your major?</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="e.g. I'm a Finance major"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileText">
              <Form.Label>What leadership skills do you want to develop?</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={leadershipSkills}
                onChange={(e) => setLeadershipSkills(e.target.value)}
                placeholder="e.g. I want to develop my executive presence and empathy"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileText">
              <Form.Label>What bigger picture goals do you have?</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={bigPictureGoals}
                onChange={(e) => setBigPictureGoals(e.target.value)}
                placeholder="e.g. I want to grow my network and learn more about finance. I want to land a finance internship."
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="profileText">
              <Form.Label>What experiences have you already had?</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={experiences}
                onChange={(e) => setExperiences(e.target.value)}
                placeholder="e.g. I attended the Leadership & Inclusion Speaker Series: Building Equitable Workplaces. I'm in the Society for Human Resource Management. I attended the Madison Startup Fair."
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
