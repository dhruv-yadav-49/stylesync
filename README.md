# StyleSync | Living Design Systems

StyleSync is a web-based design tool that transforms any website into an interactive, living design system. By analyzing a URL, it extracts core design tokens—color palettes, typographic scales, and spacing rhythms—and generates a professional, Figma-like dashboard for editing and visualization.

## ✨ Features

- **Intelligent Extraction**: Uses Puppeteer for headless browser automation to analyze computed styles, DOM structures, and dominant colors from image assets.
- **Living Dashboard**: A premium "Glassmorphism" interface for real-time token editing and visualization.
- **Time Machine (Version History)**: Full audit log of token changes, allowing you to view and restore previous design states.
- **Token Locking**: Secure specific tokens to prevent them from being overridden during re-scrapes.
- **Component Preview Grid**: A live Design System playground featuring:
    - Primary, Secondary, and Ghost button variations.
    - Form elements with distinct states (Default, Focus, Error).
    - Multiple Card surface variations (Elevated, Soft, Branded).
    - Full typographic hierarchy specimens.
- **Multi-Format Export**: Export your design system as CSS Variables, JSON tokens, or a Tailwind configuration.

## 🚀 Tech Stack

- **Frontend**: EJS Templates, Vanilla JavaScript, CSS3 (Glassmorphism design system).
- **Backend**: Node.js, Express.
- **Analysis**: Puppeteer (Scraping), Sharp/Vibrant (Image Analysis), Custom Heuristic Engines.
- **Database**: PostgreSQL (Site storage, Token management, and Version history).

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL

### Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd stylesync
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stylesync
   ```

4. **Initialize Database**:
   The application automatically handles table creation on the first run using the migrations provided in `/migrations/init.sql`.

5. **Start the Application**:
   ```bash
   npm start
   ```
   Visit `http://localhost:3000` to begin.

## 📝 Assignment Requirements (Assessment 1)

This project fulfills all core and merit requirements for Assessment 1, including:
- **Requirement B**: "Parsing Visualization" during the scraping process.
- **Requirement C**: Fully relational PostgreSQL schema for persistence.
- **UX Requirements**: Skeleton screens, satisfying lock animations, and <100ms real-time feedback loops.

---
Built with pride for **Purple Merit Technologies**.
