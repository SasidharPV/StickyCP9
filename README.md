# StickyCP9 - Modern Sticky Notes with Cloud Sync

A sleek, modern sticky notes application that runs in your browser with built-in copy functionality and cloud sync for each note.

## Live Demo

Try the application live at [https://SasidharPV.github.io/StickyCP9/](https://SasidharPV.github.io/StickyCP9/)

## Features

- Create, edit, and delete sticky notes
- Copy the content of any note with a single click
- Customize note colors
- Light and dark themes
- Cloud synchronization with Google Drive and OneDrive
- Notes are automatically saved to your browser's local storage and cloud
- Responsive design that works on desktop and mobile
- Clean, modern interface

## How to Use

### Running the Application Locally

1. Double-click the `run_sticky_notes.bat` file to open the application in your default browser
2. Alternatively, you can open the `index.html` file directly in any web browser

### Deploying to GitHub Pages

1. Make your changes to the application
2. Run the `deploy_to_github_pages.bat` file
3. Enter a commit message when prompted (or press Enter for the default message)
4. The script will push your changes to GitHub
5. GitHub Actions will automatically deploy your updated site
6. Once complete, your application will be available at: https://SasidharPV.github.io/StickyCP9/

### Using the Application

- **Create a new note**: Click the "+ New Note" button
- **Edit a note**: Click on the note title or content to edit
- **Change color**: Click the palette icon and select a color
- **Copy note content**: Click the copy icon to copy both title and content
- **Delete a note**: Click the trash icon
- **Toggle theme**: Click the moon/sun icon to switch between light and dark themes
- **Sync to cloud**: Click the cloud icon to sign in with Google or Microsoft and sync your notes

## Setting Up Cloud Sync

### Google Drive Integration

1. Go to the [Google Developer Console](https://console.developers.google.com/)
2. Create a new project
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: Add your domain (e.g., https://yourdomain.com or http://localhost)
   - Authorized redirect URIs: Same as origins
5. Copy the Client ID and API Key
6. Edit `src/config.js` and replace `YOUR_GOOGLE_CLIENT_ID` and `YOUR_GOOGLE_API_KEY` with your values

### Microsoft OneDrive Integration

1. Go to the [Microsoft Azure Portal](https://portal.azure.com/)
2. Register a new application in Azure Active Directory
3. Set platform as SPA (Single Page Application)
4. Add redirects to your domain (e.g., https://yourdomain.com or http://localhost)
5. Add Microsoft Graph permissions: Files.ReadWrite.AppFolder, offline_access
6. Copy the Client ID
7. Edit `src/config.js` and replace `YOUR_MICROSOFT_CLIENT_ID` with your value

## Deployment to GitHub Pages

### Automatic Deployment

1. Fork or clone this repository to your GitHub account
2. Enable GitHub Pages in your repository settings (Settings > Pages)
3. Set the source branch to `gh-pages`
4. The workflow in `.github/workflows/deploy.yml` will automatically deploy your changes when you push to the main branch

### Manual Deployment

1. Edit `src/config.js` with your OAuth credentials
2. Run the `push_to_github.bat` script to push changes to GitHub
3. Go to your repository on GitHub
4. Enable GitHub Pages in repository settings
5. Your app will be available at `https://username.github.io/StickyCP9`

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses Google Drive API and Microsoft Graph API for cloud sync
- Uses browser's localStorage for offline storage
- Authentication with OAuth 2.0
- Font Awesome icons for the user interface

## Browser Compatibility

The application works best in modern browsers:
- Chrome 60+
- Firefox 60+
- Safari 10+
- Edge 79+

## License

This project is open source and available for personal or commercial use.

---

Created by StickyCP9 Team, 2025
