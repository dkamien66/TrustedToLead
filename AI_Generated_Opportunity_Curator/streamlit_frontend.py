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

if "plan_messages" not in st.session_state:
    st.session_state["plan_messages"] = []

if "internship_details" not in st.session_state:
    st.session_state["internship_details"] = ""

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
    # Create tabs for Student mode
    tab1, tab2, tab3, tab4 = st.tabs(["Profile", "Opportunity Curator", "Network Curator", "Plan Curator"])

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
                        "message": user_input + " " + st.session_state['user_profile_text'],
                        "system_prompt": f"""
                            You are an opportunity curator that gives specific opportunity recommendations 
                            based on the context of retrieved events, so you must include all of the 
                            information of the event (the title, type, dates, description, related 
                            business majors, and leadership skills developed). Use the given user profile and 
                            resume information to provide a supportive, friendly response of 3 
                            recommendations and what they can do to prepare.
                        """
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
                        "message": network_input + " " + st.session_state['user_profile_text'],
                        "system_prompt": f"""
                            You are a network curator that gives recommendations of specific people to 
                            connect with according to the given context of retrieved people, so you must 
                            include all of the information of the person (name, role, related_fields, 
                            leadership_counseling, email) in your response. Use this user profile and resume 
                            information to provide a few people to talk to.
                        """
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

    with tab4:
        st.title("Plan Curator Chatbot (Gemini Model)")
        # Show profile context if available
        if st.session_state["user_profile_text"]:
            with st.expander("Profile Context (Click to view)"):
                st.write(st.session_state["user_profile_text"])
        # Internship details textbox
        internship_details = st.text_area(
            "Insert internship details:",
            value=st.session_state["internship_details"],
            height=100,
            key="internship_details_textarea"
        )
        st.session_state["internship_details"] = internship_details
        if internship_details:
            st.markdown(f"**Internship Details:** {internship_details}")
        plan_input = st.text_input("You:", "", key="plan_input")
        if st.button("Send", key="plan_send") and plan_input:
            st.session_state["plan_messages"].append(("user", plan_input))
            try:
                response = requests.post(
                    "http://localhost:8000/chat",
                    json={
                        "message": plan_input + " " + st.session_state['user_profile_text'] + " " + st.session_state['internship_details'],
                        "system_prompt": f"""
                            You are a plan curator that helps the user create actionable plans based on 
                            who they are and what job responsibilities, skills, and knowledge are all 
                            needed for the internship the user inputs.

                            Use the given opportunities and events to provide a step-by-step plan that's 
                            reasonable to do in one month, like a roadmap tailored to their goals and 
                            interests, to help them prepare for the internship.

                            The plan must include opportunities and people to connect with.
                            You must include all of the information of the event (the title, type, dates, 
                            description, related business majors, and leadership skills developed).
                            You must include all of the information of the person (name, role, related_fields, 
                            leadership_counseling, email).

                            Make the plan diverse, not having to follow the order of the opportunities 
                            and people in the given context, but also have a main purpose. Make it fun!
                        """
                    },
                    timeout=180
                )
                data = response.json()
                bot_reply = data.get("response") or data.get("error", "No response")
            except Exception as e:
                bot_reply = f"Error: {e}"
            st.session_state["plan_messages"].append(("bot", bot_reply))
        # Display plan curator chat history
        for role, msg in st.session_state["plan_messages"]:
            if role == "user":
                st.markdown(f"**You:** {msg}")
            else:
                st.markdown(f"**Gemini:** {msg}")

else:  # Admin mode
    # Create single tab for Admin mode
    tab1, = st.tabs(["Input Opportunity"])
    
    with tab1:
        st.header("Input Opportunity")
        # Empty content as requested 