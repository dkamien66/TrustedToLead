import streamlit as st
import requests

# Initialize session state for different chat histories and profile
if "opportunity_messages" not in st.session_state:
    st.session_state["opportunity_messages"] = []

if "network_messages" not in st.session_state:
    st.session_state["network_messages"] = []

if "user_profile_text" not in st.session_state:
    st.session_state["user_profile_text"] = ""

if "user_mode" not in st.session_state:
    st.session_state["user_mode"] = "Student"

# --- Questionnaire specific session state ---
# Initialize session state for questionnaire progress and score
if "questionnaire_messages" not in st.session_state:
    st.session_state["questionnaire_messages"] = []
if "questionnaire_score" not in st.session_state:
    st.session_state["questionnaire_score"] = 0
if "questionnaire_completed" not in st.session_state:
    st.session_state["questionnaire_completed"] = False
if "current_question_index" not in st.session_state:
    st.session_state["current_question_index"] = 0

# Toggle button at top left
col1, col2, col3 = st.columns([1, 3, 1])
with col1:
    if st.button(f"Switch to {'Admin' if st.session_state['user_mode'] == 'Student' else 'Student'}", key="mode_toggle"):
        st.session_state["user_mode"] = "Admin" if st.session_state["user_mode"] == "Student" else "Student"
        st.rerun()

# Display current mode
with col2:
    st.markdown(f"**Current Mode: {st.session_state['user_mode']}**")

# Conditional content based on mode
if st.session_state["user_mode"] == "Student":
    # Create tabs for Student mode, including the new questionnaire tab
    tab1, tab2, tab3, tab4 = st.tabs(["Profile", "Opportunity Curator", "Network Curator", "Leadership Questionnaire"])

    # Tab 1: Profile
    with tab1:
        st.header("User Profile")
        st.subheader("Jirs")
        
        # Text input for user to write into
        user_text = st.text_area(
            "Write your thoughts here:", 
            value=st.session_state["user_profile_text"],
            height=200, 
            placeholder="Share your thoughts, goals, or any information you'd like to include...",
            key="profile_text_area"
        )
        
        # Resume upload
        uploaded_resume = st.file_uploader("Upload your resume", type=['pdf', 'docx', 'txt'], help="Upload your resume in PDF, DOCX, or TXT format")
        
        resume_content = ""
        if uploaded_resume is not None:
            st.success(f"Resume uploaded: {uploaded_resume.name}")
            
            # Display resume content if it's a text file
            if uploaded_resume.type == "text/plain":
                resume_content = uploaded_resume.read().decode()
                st.text_area("Resume Content:", value=resume_content, height=300, disabled=True)
            else:
                # For non-text files, create a placeholder
                resume_content = f"Resume file uploaded: {uploaded_resume.name} (Content not extracted - please convert to text format for full functionality)"
        
        # Save button for profile
        if st.button("Save Profile"):
            # Combine user text and resume content
            combined_profile = user_text
            if resume_content:
                combined_profile += f"\n\n--- RESUME ---\n{resume_content}"
            
            st.session_state["user_profile_text"] = combined_profile
            st.success("Profile saved successfully!")

    # Tab 2: Opportunity Curator
    with tab2:
        st.title("Opportunity Curator Chatbot (Gemini Model)")
        
        # Show profile context if available
        if st.session_state["user_profile_text"]:
            with st.expander("Profile Context (Click to view)"):
                st.write(st.session_state["user_profile_text"])
        
        user_input = st.text_input("You:", "", key="opportunity_input")
        
        if st.button("Send", key="opportunity_send") and user_input:
            st.session_state["opportunity_messages"].append(("user", user_input))
            try:
                response = requests.post(
                    "http://localhost:8000/chat",
                    json={
                        "message": user_input,
                        "system_prompt": f"You are an opportunity curator...",
                        "chat_type": "events" # ADD THIS LINE
                    },
                timeout=180
                )
                data = response.json()
                bot_reply = data.get("response") or data.get("error", "No response")
            except Exception as e:
                bot_reply = f"Error: {e}"
            st.session_state["opportunity_messages"].append(("bot", bot_reply))
            
        # Display opportunity curator chat history
        for role, msg in st.session_state["opportunity_messages"]:
            if role == "user":
                st.markdown(f"**You:** {msg}")
            else:
                st.markdown(f"**Gemini:** {msg}")

    # Tab 3: Network Curator
    with tab3:
        st.title("Network Curator Chatbot (Gemini Model)")
        
        # Show profile context if available
        if st.session_state["user_profile_text"]:
            with st.expander("Profile Context (Click to view)"):
                st.write(st.session_state["user_profile_text"])
        
        network_input = st.text_input("You:", "", key="network_input")
        
        if st.button("Send", key="network_send") and network_input:
            st.session_state["network_messages"].append(("user", network_input))
            try:
                response = requests.post(
                "http://localhost:8000/chat",
                json={
                    "message": network_input,
                    "system_prompt": f"You are a network curator...",
                    "chat_type": "networking" 
                },
                timeout=180
                )
                data = response.json()
                bot_reply = data.get("response") or data.get("error", "No response")
            except Exception as e:
                bot_reply = f"Error: {e}"
            st.session_state["network_messages"].append(("bot", bot_reply))
            
        # Display network curator chat history
        for role, msg in st.session_state["network_messages"]:
            if role == "user":
                st.markdown(f"**You:** {msg}")
            else:
                st.markdown(f"**Gemini:** {msg}")

    # Tab 4: Leadership Questionnaire (NEW FEATURE)
    with tab4:
        st.title("Leadership Self-Assessment Questionnaire")

        # Define the questions and their points
        questions = [
            {"text": "I actively seek and apply feedback from my peers and superiors.", "points_for_yes": 3},
            {"text": "I effectively delegate tasks to empower my team members.", "points_for_yes": 4},
            {"text": "I take initiative to mentor and develop others.", "points_for_yes": 5},
            {"text": "I can clearly articulate a vision and inspire others to follow it.", "points_for_yes": 5},
            {"text": "I remain composed and make sound decisions under pressure.", "points_for_yes": 3},
            {"text": "I foster an inclusive and collaborative environment within my team.", "points_for_yes": 4},
            {"text": "I am proactive in identifying and addressing potential conflicts.", "points_for_yes": 3},
            {"text": "I am adaptable and embrace change within my leadership approach.", "points_for_yes": 3},
            {"text": "I consistently set clear goals and hold myself and others accountable.", "points_for_yes": 4},
            {"text": "I celebrate team successes and acknowledge individual contributions.", "points_for_yes": 2}
        ]

        # Display current question or results if completed
        if not st.session_state["questionnaire_completed"]:
            st.subheader(f"Question {st.session_state['current_question_index'] + 1}/{len(questions)}")
            current_question = questions[st.session_state["current_question_index"]]
            st.write(current_question["text"])

            # Buttons for Yes/No answers
            col_q1, col_q2 = st.columns(2)
            with col_q1:
                if st.button("Yes", key=f"q_yes_{st.session_state['current_question_index']}"):
                    st.session_state["questionnaire_score"] += current_question["points_for_yes"]
                    st.session_state["current_question_index"] += 1
                    # Check if all questions are answered
                    if st.session_state["current_question_index"] >= len(questions):
                        st.session_state["questionnaire_completed"] = True
                    st.rerun() # Rerun to update UI
            with col_q2:
                if st.button("No", key=f"q_no_{st.session_state['current_question_index']}"):
                    st.session_state["current_question_index"] += 1
                    # Check if all questions are answered
                    if st.session_state["current_question_index"] >= len(questions):
                        st.session_state["questionnaire_completed"] = True
                    st.rerun() # Rerun to update UI
        else:
            # Display score and feedback options once questionnaire is complete
            st.success("You have completed the questionnaire!")
            total_possible_score = sum(q["points_for_yes"] for q in questions)
            st.subheader(f"Your Leadership Score: {st.session_state['questionnaire_score']} out of {total_possible_score}")

            # Button to get personalized feedback from Gemini
            if st.button("Get Personalized Feedback"):
                feedback_prompt = f"A user just completed a leadership questionnaire with a score of {st.session_state['questionnaire_score']} out of {total_possible_score}. Provide encouraging and actionable feedback based on this score, suggesting general areas of strength and areas for development in leadership skills. Assume higher scores indicate more developed skills."
                
                try:
                    # Send feedback request to the backend API's chat endpoint
                    response = requests.post(
                    "http://localhost:8000/chat",
                    json={
                        "message": feedback_prompt,
                        "system_prompt": "You are an encouraging leadership coach...",
                        "chat_type": "questionnaire" # ADD THIS LINE
                    },
                    timeout=600
                )
                    data = response.json()
                    feedback_text = data.get("response") or data.get("error", "Could not get feedback.")
                    st.markdown("---")
                    st.subheader("Personalized Feedback:")
                    st.write(feedback_text)
                except Exception as e:
                    st.error(f"Error getting feedback: {e}")
            
            # Button to restart the questionnaire
            if st.button("Restart Questionnaire"):
                st.session_state["questionnaire_completed"] = False
                st.session_state["current_question_index"] = 0
                st.session_state["questionnaire_score"] = 0
                st.rerun() # Rerun to reset the questionnaire

else: # Admin mode
    # Create single tab for Admin mode
    tab1, = st.tabs(["Input Opportunity"])
    
    with tab1:
        st.header("Input Opportunity")
        # Empty content as requested
