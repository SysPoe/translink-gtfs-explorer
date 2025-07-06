Instructions for use

## Development

- Install dependencies:
  ```fish
  npm install
  ```
- Start the dev server (listens on port 5000, all interfaces):
  ```fish
  npm run dev
  ```

## Production/Deployment (e.g. EC2)

1. **Install dependencies:**
   ```fish
   npm install
   ```
2. **Build the app:**
   ```fish
   npm run build
   ```
3. **Install pm2 globally (recommended):**
   ```fish
   npm install -g pm2
   ```
4. **Start the app with pm2:**
   ```fish
   pm2 start npm --name "translink-gtfs" -- run preview
   ```
5. **Check status and logs:**
   ```fish
   pm2 status
   pm2 logs translink-gtfs
   ```
6. **Auto-start on reboot:**
   ```fish
   pm2 startup
   pm2 save
   ```

- The app will be available on port 5000
- The GTFS feed will auto-refresh at 3am UTC+10, regardless of server timezone.
