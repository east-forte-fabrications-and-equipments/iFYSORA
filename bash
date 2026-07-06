# Using Docker Compose
docker-compose up -d

# Manual deployment
npm run build
npm run start
cd server
npm install cloudinary async-retry cookie-parser

cd ../client
npm install react-webcam

# For face detection (optional)
cd server
npm install @vladmandic/face-api
