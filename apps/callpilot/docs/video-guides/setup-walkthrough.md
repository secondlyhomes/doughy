# Video Script: Setup Walkthrough

**Duration:** 15 minutes
**Target Audience:** Developers new to React Native and Expo
**Prerequisites:** Basic JavaScript knowledge

---

## Pre-Production Checklist

### Materials Needed
- [ ] Screen recording software (OBS, QuickTime, etc.)
- [ ] Microphone for clear audio
- [ ] Text editor (VS Code) configured
- [ ] Terminal ready
- [ ] Mobile device or simulator
- [ ] Sample project ready
- [ ] Environment variables configured

### Recording Settings
- **Resolution:** 1920x1080 (1080p)
- **Frame rate:** 30 FPS
- **Audio:** 44.1 kHz, stereo
- **Format:** MP4 (H.264)

---

## Script

### INTRO (0:00 - 0:30)

**[ON SCREEN: Mobile App Blueprint logo with tagline]**

**NARRATOR:**
> "Welcome to the Mobile App Blueprint setup guide. In this video, we'll walk through everything you need to get your React Native development environment up and running. By the end, you'll have a fully functional app running on your device. Let's get started!"

**[TRANSITION: Fade to desktop with clean workspace]**

---

### SECTION 1: Prerequisites (0:30 - 2:00)

**[ON SCREEN: Split view - documentation on left, terminal on right]**

**NARRATOR:**
> "First, let's check if you have the required software installed. You'll need Node.js version 20 or higher, and npm version 10 or higher."

**[SHOW: Terminal command]**
```bash
node --version
npm --version
```

**NARRATOR:**
> "If you don't have these installed, pause the video and visit nodejs.org to download the latest LTS version. This includes both Node and npm."

**[ON SCREEN: Highlight Node.js download page with LTS highlighted]**

**NARRATOR:**
> "You'll also need Git for version control. Let's verify that's installed too."

**[SHOW: Terminal command]**
```bash
git --version
```

**NARRATOR:**
> "Great! With these basics in place, we can move on to installing the Expo tooling."

---

### SECTION 2: Installing Expo and EAS CLI (2:00 - 3:30)

**[ON SCREEN: Terminal full screen]**

**NARRATOR:**
> "Expo is the framework that makes React Native development much easier. We'll install the EAS CLI, which stands for Expo Application Services."

**[SHOW: Terminal command with typewriter effect]**
```bash
npm install -g eas-cli
```

**NARRATOR:**
> "While that installs, let me explain what EAS does. It handles building your app, submitting to app stores, and pushing over-the-air updates. All the complex native code compilation happens on Expo's servers, not your machine."

**[SHOW: Installation progress]**

**NARRATOR:**
> "Once installed, let's verify it works and log in to your Expo account."

**[SHOW: Terminal commands]**
```bash
eas --version
eas login
```

**NARRATOR:**
> "Enter your Expo account credentials. If you don't have an account, visit expo.dev to create one. It's free!"

---

### SECTION 3: Cloning the Project (3:30 - 5:00)

**[ON SCREEN: GitHub repository page]**

**NARRATOR:**
> "Now let's get the Mobile App Blueprint code. I've opened the GitHub repository at github.com/your-org/your-repo."

**[SHOW: Repository overview, highlighting features]**

**NARRATOR:**
> "This blueprint includes everything you need: authentication, database integration, theming, testing, and much more. Click the Code button and copy the repository URL."

**[SHOW: Clicking Code button, copying URL]**

**[ON SCREEN: Back to terminal]**

**NARRATOR:**
> "In your terminal, navigate to where you want to store your projects, then clone the repository."

**[SHOW: Terminal commands]**
```bash
cd ~/projects
git clone https://github.com/your-org/your-repo.git
cd mobile-app-blueprint
```

**NARRATOR:**
> "Perfect! Now let's install all the dependencies."

**[SHOW: Terminal command]**
```bash
npm install
```

**NARRATOR:**
> "This will take a minute or two. While we wait, let's take a look at the project structure."

---

### SECTION 4: Project Structure Overview (5:00 - 7:00)

**[ON SCREEN: VS Code opening project]**

**NARRATOR:**
> "Let's open the project in VS Code. Here's how the blueprint is organized."

**[SHOW: File explorer sidebar]**

**NARRATOR:**
> "The src directory contains all your source code. It's organized by function: components for reusable UI, screens for full pages, services for API calls, and hooks for shared logic."

**[EXPAND: src folder showing structure]**

**NARRATOR:**
> "The docs folder has comprehensive guides on every aspect of development. Whenever you're unsure about something, check here first."

**[SHOW: Docs folder]**

**NARRATOR:**
> "The supabase folder contains your database migrations and edge functions. We'll work with these in later tutorials."

**[SHOW: Supabase folder]**

**NARRATOR:**
> "And finally, the dot blueprint folder contains optional features you can activate later, like push notifications or PWA support."

**[SHOW: .blueprint folder]**

---

### SECTION 5: Environment Configuration (7:00 - 9:30)

**[ON SCREEN: VS Code terminal]**

**NARRATOR:**
> "Before we can run the app, we need to configure our environment variables. Let's copy the example file."

**[SHOW: Terminal command]**
```bash
cp .env.example .env
```

**NARRATOR:**
> "Now open the new .env file. We need to add our Supabase credentials."

**[SHOW: Opening .env file in editor]**

**[ON SCREEN: Split screen - Supabase dashboard on left, .env file on right]**

**NARRATOR:**
> "Head over to supabase.com and create a new project. If you don't have an account, sign up—it's free to get started."

**[SHOW: Creating new Supabase project]**
- Click "New Project"
- Enter project name: "mobile-app-dev"
- Generate strong password
- Select region
- Click "Create new project"

**NARRATOR:**
> "While the project sets up, which takes about two minutes, let me explain what Supabase gives us. It's an open-source Firebase alternative that provides a Postgres database, authentication, real-time subscriptions, storage, and serverless functions. All the backend infrastructure you need."

**[SHOW: Project created, navigating to Settings]**

**NARRATOR:**
> "Great, the project is ready! Navigate to Settings, then API. Here you'll find your project URL and anon key."

**[SHOW: Copying credentials to .env file]**
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**NARRATOR:**
> "Copy these values into your .env file. The anon key is safe to use in your mobile app—it's public. Never use the service_role key in client code though. That's for server-side only."

**[HIGHLIGHT: Comment in .env file explaining this]**

---

### SECTION 6: Running the App (9:30 - 12:00)

**[ON SCREEN: Terminal in VS Code]**

**NARRATOR:**
> "With environment configured, we're ready to run the app! Let's start the development server."

**[SHOW: Terminal command]**
```bash
npm start
```

**NARRATOR:**
> "Metro bundler is now running. You'll see a QR code and several options. Let's go through each one."

**[SHOW: Metro bundler output]**

**NARRATOR:**
> "Press 'i' to open the iOS simulator, 'a' for Android emulator, or scan the QR code with your phone using the Expo Go app."

**[ON SCREEN: Split screen showing both simulator and physical device options]**

**NARRATOR:**
> "For this demo, I'll use the iOS simulator. Press 'i'."

**[SHOW: Simulator launching]**

**NARRATOR:**
> "The simulator takes a moment to start. Once it's running, the app will automatically build and install."

**[SHOW: Build progress in terminal]**

**NARRATOR:**
> "There we go! The app is now running. Let's take a quick tour of what we're seeing."

**[SHOW: App running with home screen]**

**NARRATOR:**
> "This is the welcome screen. The blueprint comes with a basic navigation structure already set up. Notice how the theme is applied consistently—we're using a token-based design system."

---

### SECTION 7: Making Your First Change (12:00 - 14:00)

**[ON SCREEN: VS Code with home-screen.tsx open]**

**NARRATOR:**
> "Let's make a quick change to verify everything's working. Open src/screens/home-screen.tsx."

**[SHOW: File opening]**

**NARRATOR:**
> "Find the welcome text and change it to include your name."

**[SHOW: Editing code]**
```typescript
<Text>Hello, Sarah! Welcome to Mobile App Blueprint</Text>
```

**NARRATOR:**
> "Save the file. Watch the simulator—the change appears instantly thanks to Fast Refresh."

**[SHOW: Simulator updating automatically]**

**NARRATOR:**
> "Fast Refresh is one of React Native's best features. Most changes apply instantly without losing your app's state. This makes development incredibly fast."

**[SHOW: Making another change to demonstrate]**

**NARRATOR:**
> "Let's verify our code quality tools are working. Run the type checker."

**[SHOW: Terminal command]**
```bash
npm run type-check
```

**NARRATOR:**
> "No errors! TypeScript is ensuring our code is type-safe. Let's also run the linter."

**[SHOW: Terminal command]**
```bash
npm run lint
```

**NARRATOR:**
> "All clean. These checks run automatically before every commit thanks to our pre-commit hooks."

---

### CLOSING (14:00 - 15:00)

**[ON SCREEN: App running on simulator]**

**NARRATOR:**
> "Congratulations! You now have a fully functional React Native development environment. Your app is running, hot reload is working, and you've made your first change."

**[ON SCREEN: Text overlay with next steps]**

**NARRATOR:**
> "In the next video, we'll build your first feature: a task list. You'll learn about components, state management, and Supabase integration."

**[SHOW: Project structure one more time]**

**NARRATOR:**
> "Remember, comprehensive documentation is available in the docs folder. If you get stuck, check the troubleshooting guide or common issues documentation."

**[ON SCREEN: Links to resources]**
- docs/tutorials/
- docs/troubleshooting/
- GitHub issues
- Discord community

**NARRATOR:**
> "Thanks for watching! If you found this helpful, give it a thumbs up and subscribe for more tutorials. See you in the next video!"

**[FADE OUT: Mobile App Blueprint logo]**

---

## Post-Production Checklist

### Editing
- [ ] Remove long pauses
- [ ] Add background music (subtle, non-distracting)
- [ ] Add text overlays for commands
- [ ] Add annotations for important points
- [ ] Add chapter markers

### Quality Check
- [ ] Audio levels consistent
- [ ] No background noise
- [ ] Screen recording clear and readable
- [ ] Transitions smooth
- [ ] Length within target (15 min ± 1 min)

### YouTube Upload
- [ ] Title: "React Native Setup Guide - Mobile App Blueprint Tutorial #1"
- [ ] Description with timestamps
- [ ] Tags: react-native, expo, tutorial, mobile-development
- [ ] Thumbnail: Clear, professional, includes title text
- [ ] Add to playlist: "Mobile App Blueprint Tutorials"
- [ ] Cards to related videos
- [ ] End screen with subscribe and next video

### Accessibility
- [ ] Auto-generated captions reviewed and corrected
- [ ] Transcript provided in description
- [ ] Clear, moderate speaking pace
- [ ] Visual examples for all code

---

## Timestamps for Description

```
0:00 Introduction
0:30 Prerequisites Check
2:00 Installing Expo & EAS CLI
3:30 Cloning the Project
5:00 Project Structure Overview
7:00 Environment Configuration
9:30 Running the App
12:00 Making Your First Change
14:00 Next Steps & Resources
```

---

## Common Questions to Address in Comments

**Q: Do I need a Mac for iOS development?**
A: EAS Build can build iOS apps without a Mac! But for running the iOS simulator, yes, you need macOS.

**Q: What if I don't have a physical device?**
A: Simulators/emulators work great for development. You can download iOS Simulator with Xcode (Mac) or Android Emulator with Android Studio (any OS).

**Q: Is Expo Go required?**
A: For quick testing, Expo Go is easiest. For full features, you'll eventually create a development build.

**Q: How much does Expo cost?**
A: Expo has a generous free tier. Most solo developers and small teams never need to pay.

**Q: Can I use this for production apps?**
A: Absolutely! This blueprint follows production best practices and includes everything needed for real apps.
