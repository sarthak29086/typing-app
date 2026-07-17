# Typing Test Application

A React-based typing test application with a custom timer, dynamic error calculation, and detailed reporting.

## Features

- **Custom Timer**: Configure the duration of your typing test.
- **Dynamic Scrolling**: The paragraph automatically scrolls line-by-line as you type, keeping your current line in view without scrolling prematurely.
- **Live Speed Tracking**: See your Gross WPM and Net WPM (Real Speed) in real-time below the typing box.
- **Detailed Reporting**: Get a comprehensive report with your Gross WPM, Real Speed, and a breakdown of errors (Spelling Mistakes, Omissions, Additions).
- **Evaluation Details**: Easily copy your evaluation report, which includes the exact text you attempted compared to what you typed.

## Evaluation Rules

- **Gross WPM**: (Total Keystrokes / 5) / Time (min)
- **Real Speed (Net WPM)**: ((Total Keystrokes - 2 * Errors) / 5) / Time (min)
- **Errors**: 
  - Every omission, extra word (addition), and misspelling (including capitalization and punctuation) is counted as 1 error. 
  - Errors are penalized by subtracting 2 keystrokes for each error from the total keystrokes.
- **Time**: Calculated up to the moment the 'Submit' button is clicked or the timer runs out.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Tech Stack
- React
- React Router DOM
- Vite
