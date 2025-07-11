# DiveShare - Scuba Diving Photo Sharing Platform

DiveShare is a modern web application that allows scuba divers to share their underwater adventures with photos on an interactive map. Built with Next.js, Firebase, and Google Maps, it provides a seamless platform for the diving community to discover and share dive sites around the world.

## 🌊 Features

### Core Functionality
- **Interactive Map**: View dive locations from around the world on an interactive Google Maps interface
- **Photo Sharing**: Upload and share underwater photos with detailed dive information
- **Dive Logging**: Record comprehensive dive details including depth, duration, visibility, and water temperature
- **User Authentication**: Secure login with email/password or Google OAuth
- **Real-time Data**: All dive logs and photos are stored and synced in real-time using Firebase

### User Experience
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Drag & Drop Photo Upload**: Easy photo uploading with preview functionality
- **Location Selection**: Click-to-select dive locations directly on the map
- **Dive Details**: Rich dive information including location, date, conditions, and photos
- **User Profiles**: Each dive log includes diver information and profile photos

### Technical Features
- **TypeScript**: Fully typed codebase for better development experience
- **Firebase Integration**: Authentication, Firestore database, and Storage
- **Google Maps API**: Interactive maps with custom markers and info windows
- **Modern UI**: Built with Tailwind CSS and Lucide React icons
- **Image Optimization**: Efficient photo storage and display

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project
- Google Cloud Platform account (for Maps API)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dive
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password and Google providers
   - Create a Firestore database in production mode
   - Enable Firebase Storage
   - Copy your Firebase configuration

4. **Set up Google Maps API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API and Places API
   - Create an API key and restrict it to your domain

5. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Google Maps API Key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

   Or copy the template file:
   ```bash
   cp env.template .env.local
   ```
   Then edit `.env.local` with your actual API keys.

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
dive/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout with AuthProvider
│   │   └── page.tsx            # Main homepage
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   │   ├── AuthModal.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── forms/              # Form components
│   │   │   └── DiveLogForm.tsx
│   │   ├── map/                # Map components
│   │   │   └── DiveMap.tsx
│   │   └── upload/             # Photo upload components
│   │       └── PhotoUpload.tsx
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication state management
│   ├── lib/                    # Utility libraries
│   │   ├── firebase.ts         # Firebase configuration
│   │   ├── firestore.ts        # Firestore database operations
│   │   ├── maps.ts             # Google Maps utilities
│   │   └── storage.ts          # Firebase Storage operations
│   └── types/                  # TypeScript type definitions
│       └── index.ts
├── public/                     # Static assets
├── README.firebase.md          # Firebase setup guide
└── package.json               # Dependencies and scripts
```

## 📱 Usage

### For Divers
1. **Sign Up/Login**: Create an account or sign in with Google
2. **Log a Dive**: Click "Log Dive" to add a new dive entry
3. **Select Location**: Click on the map to choose your dive location
4. **Add Details**: Fill in dive information (depth, duration, conditions)
5. **Upload Photos**: Drag and drop or select underwater photos
6. **Share**: Your dive will appear on the map for others to discover

### For Visitors
1. **Explore Map**: Browse dive locations and photos from the community
2. **View Details**: Click on map markers to see dive information and photos
3. **Discover Locations**: Find new dive sites and inspiration for your next trip

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Maps**: Google Maps JavaScript API
- **File Upload**: React Dropzone
- **Deployment**: Vercel (recommended)

## 🔒 Security & Privacy

- User authentication is handled securely by Firebase Auth
- All user data is stored in Firestore with proper security rules
- Photos are stored in Firebase Storage with access controls
- API keys are properly configured for production use

## 🚀 Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy automatically with each commit

### Environment Variables for Production
Make sure to add all environment variables from `.env.local` to your deployment platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the Firebase setup guide in `README.firebase.md`
2. Ensure all environment variables are correctly configured
3. Verify Firebase services are enabled
4. Check Google Maps API permissions and billing

## 🌍 Future Enhancements

- Advanced search and filtering capabilities
- Social features (following divers, comments)
- Dive certification tracking
- Weather and tide information integration
- Mobile app development
- Dive shop and equipment marketplace

---

Built with ❤️ for the diving community. Happy diving! 🤿
