# Home Anchor

Your Family's Digital Command Center - Organize schedules, track kids' activities, plan meals, and keep everyone on the same page.

![Home Anchor Dashboard](assets/app-preview.png)

## Features

### For Parents (Adults)
- **Tasks** - Daily task management with priorities
- **Meals** - Weekly meal planning and recipes
- **Workouts** - Exercise routines with circuit timer
- **Habits** - Track daily habits with streaks
- **Journal** - Personal journaling with prompts
- **Gratitude** - Daily gratitude logging
- **Vision Board** - Visual goal setting

### For Kids (Ages 4-17)
- **Points System** - Earn points for completing activities
- **Rewards Store** - Redeem points for custom rewards
- **Achievements** - Unlock badges and level up
- **Chores** - Track assigned chores
- **Schedule** - Visual daily schedule

### For Toddlers
- **Daily Routines** - Visual checklist for meals, naps, playtime
- **Activity Ideas** - Age-appropriate activity suggestions
- **Milestones** - Track developmental milestones
- **Daily Log** - Record feeding, sleep, diaper changes

### Family Features
- **Shared Calendar** - Family events and appointments
- **Member Schedules** - Each member's daily schedule
- **Family Dashboard** - Overview of all members at a glance

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Storage**: localStorage (offline-first)
- **Icons**: [Lucide Icons](https://lucide.dev)
- **Fonts**: Inter, Nunito (Google Fonts)

## Getting Started

### Quick Start (No Installation Required)

1. Clone or download the repository
2. Open `landing.html` in your browser
3. Click "Try Demo" to explore with sample data, or "Get Started" to begin fresh

### Local Development

```bash
# Clone the repository
git clone https://github.com/mohsinaav/home-anchor.git

# Navigate to the project
cd home-anchor

# Open in browser (no build step required)
open landing.html
# or
open index.html
```

### File Structure

```
home-anchor/
├── index.html          # Main app
├── landing.html        # Landing page
├── css/
│   ├── base.css        # Variables, reset, typography
│   ├── components.css  # Buttons, modals, forms
│   ├── pages.css       # Layout, header, tabs
│   ├── widgets.css     # Widget styles
│   ├── landing.css     # Landing page styles
│   └── tour.css        # Tutorial bubble styles
├── js/
│   ├── app.js          # Main app initialization
│   ├── storage.js      # localStorage management
│   ├── state.js        # UI state management
│   ├── components/     # Reusable components
│   │   ├── modal.js
│   │   ├── tabs.js
│   │   ├── toast.js
│   │   └── tour.js     # Tutorial system
│   └── features/       # Feature modules
│       ├── points.js
│       ├── rewards.js
│       ├── workout.js
│       ├── journal.js
│       └── ...
└── assets/
    └── app-preview.png
```

## Key Features

### Offline-First
All data is stored locally in your browser. No internet connection required after initial load.

### Privacy-Focused
Your data never leaves your device. No accounts, no tracking, no data collection.

### PIN Protection
Optional PIN lock to protect family data from accidental changes.

### Data Portability
Export your data as JSON anytime. Import on another device or browser.

### Dark Mode
Full dark mode support for comfortable viewing at night.

### Guided Tours
Interactive tutorials help new users learn the app features.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Roadmap

See [TODO-LATER.md](TODO-LATER.md) for planned features:

- [ ] Firebase authentication & multi-device sync
- [ ] Recipe scaling and cooking mode
- [ ] Import recipes from URL
- [ ] Widget reordering in focus mode

## Contributing

This is a personal project, but suggestions and feedback are welcome! Open an issue or submit a pull request.

## License

MIT License - feel free to use this for your own family or as a starting point for your own project.

---

Made with love for families everywhere.
