# Typing Test Application

A responsive, frontend-only typing test application built using React and Vite. It replicates the classic layout of official typing test software with custom timer options, custom paragraph inputs, play/pause controls, auto-scrolling, and detailed performance report analytics.

## 🚀 Live Demo & Hosting
This project is configured to be hosted on platforms like **Vercel** or **Netlify**.

## ✨ Features
1. **Custom Test Setup**:
   - Enter candidate name and practice/test number.
   - Configure a custom timer using both minutes and seconds.
   - Paste any custom paragraph of choice (short or long).
   - Toggle **Fullscreen mode** to automatically launch the test in fullscreen when starting.

2. **Official Layout Replication (Test Screen)**:
   - Designed to mimic official typing test interfaces.
   - Left-aligned text areas taking up 58% page width, leaving space for repeating watermarks.
   - Background watermark displaying candidate ID/roll number (`4437380389921`) across the page and textboxes.
   - Plain text view in display box with **no distracting moving highlights**.

3. **Active Mechanics**:
   - **Pause / Resume**: Stop the test timer and freeze typing at any point during the test.
   - **Auto-Scrolling**: The display text automatically scrolls down line-by-line as the candidate completes typing lines in the input box.
   - **Looping Text**: If the custom paragraph is short, it seamlessly appends and repeats so typing never halts.

4. **Performance Report**:
   - **Gross WPM**: Standard typing speed calculation: `(Total Keystrokes / 5) / Time (in minutes)`.
   - **Real Speed (WPM)**: Accurate Net Speed using your exact calculation: `((Total Keystrokes - 2 * Errors) / 5) / Time (in minutes)`.
   - **Error Classification**: Uses a sequence-alignment algorithm to group errors into **Spelling Mistakes**, **Omissions** (skipped words), and **Additions** (extra typed words).

---

## 🛠️ Local Development Setup

To run this project locally, ensure you have [Node.js](https://nodejs.org/) installed.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sarthak29086/typing-app.git
   cd typing-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open the local URL (typically `http://localhost:5173`) in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```
   This compiles optimized production files into the `/dist` folder.

---

## ☁️ Deploying to Vercel

### Continuous Deployment (Git-integrated)
1. Import this repository into Vercel.
2. If this project sits in a sub-folder (e.g., `typing-app`), specify it as the **Root Directory** in Vercel settings.
3. Click **Deploy**. Vercel will automatically build and deploy the app on every push to GitHub.

### Direct Deployment (Vercel CLI)
Deploy directly from your terminal using `npx vercel`:
```bash
npx vercel
```
Follow the CLI prompt instructions to finish deployment.
