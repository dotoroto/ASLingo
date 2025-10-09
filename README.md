# 👋 [ASLingo: The Smart Learning Platform](https://aslingo.study/)

![App Screenshot](https://github.com/dotoroto/ASLingo/blob/main/readme_imgs/aslingo_homepage.jpg?raw=true)

![App Screenshot](https://github.com/dotoroto/ASLingo/blob/main/readme_imgs/aslingo_dashboard.jpg?raw=true)



Built by: [Dorothy Zheng](https://github.com/dotoroto), [Edison Cai](https://github.com/EdisonCai2007), [Yaseman Nikoo](https://github.com/Yasinik85), and [Lily You](https://github.com/slurpingbroccoli)

> Jump into ASLingo, the gamified way to learn American Sign Language! Get instant feedback, crush mini-games, and level up your skills. No matter your level, this is your all-in-one ASL platform.

## 📋 Overview
Everyone deserves a voice; However, learning American Sign Language later in life can prove to be a challenge. Especially when so many words look so similar. You wanted to buy an apple, but instead you end up with... an onion?!

We're here to revolutionize how individuals learn ASL. No more looping videos trying to get that one word correct; instead, we walk the user through exact modifications they can make to learn their target word!

## ✨ Features

- **📚 Guided Lessons**: Lesson plans covering ASL signs with simple video demonstrations
- **🎥 Practice Mode**: Perform signs on camera and receive instant feedback
- **🤖 Real-Time AI Feedback**: Gesture recognition model provides feedback and coaching tips
- **📊 Progress Tracking**: Save your wins, XP, and learning journey to your profile
- **🎮 Gamification**: Streaks, leaderboards, and challenges to maintain motivation
- **🌍 Bilingual Support**: Available in English and French for accessibility

## 🔄 How It Works

1. **Watch**: Learn signs through short video demonstrations
2. **Practice**: Recreate the sign using your webcam
3. **Improve**: Receive specific feedback on hand position, finger curl, wrist rotation, and movement
4. **Progress**: Track your improvement and compete with others

## 🛠️ Tech Stack

### Frontend
- **React.js**: Modern React user interface
- **CSS**: Animated components and responsive design
- **Vercel**: Deployment and hosting

### Backend
- **Node.js/Express**: API routing, authentication, and session handling
- **MongoDB**: Storing user profiles, lesson state, and attempt history
- **Auth0**: Secure authentication and user management

### 🧠 AI Model Service (The Technical Powerhouse)
- **NumPy & TensorFlow**: Data preprocessing and model training
- **MediaPipe + OpenCV**: 3D hand landmark extraction from webcam
  - 21-point hand skeleton tracking
- **Python/FastAPI**: Fast API backend for real-time gestures
- **PyTorch BiLSTM/GRU**: Custom-trained deep learning model for ASL sign classification
  - Trained from scratch on custom ASL gesture data
  - Optimized hyperparameters (learning rate, batch size) for maximum accuracy
  - Supervised learning with model fitting
- **Docker & Render**: Python ML backend hosted on Render's Web Services
- **Gemini Integration**: Real-time feedback and tips for gesture accuracy

<p align="center">
  <img src="https://github.com/dotoroto/ASLingo/blob/main/readme_imgs/aslingo_gesture1.jpg?raw=true" width="45%"/>
  <img src="https://github.com/dotoroto/ASLingo/blob/main/readme_imgs/aslingo_gesture2.jpg?raw=true" width="45%"/>
</p>

## 💪 Key Challenges

- **🎯 Landmark Stabilization**: Addressed MediaPipe jitter and micro-tremors to provide smooth, noise-free feedback
- **📊 Model Training**: Acquired and processed large ASL gesture datasets with carefully tuned hyperparameters
- **🔗 Backend Integration**: Successfully connecting the Python ML backend with React frontend using Docker and Render middleware
- **⚡ Low Latency**: Achieved real-time performance for gesture recognition and feedback delivery
- **🔐 Authentication**: Implemented secure authentication with Auth0 across distributed services
- **🐳 DevOps**: Deployment across multiple services (Vercel + Render)


## 🙏 Acknowledgments

Special thanks to Hack The Valley (and all the mentors) for the opportinity to make this all possible!

---

