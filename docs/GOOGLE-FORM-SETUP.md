# Google Form Setup Instructions for Home Anchor Feedback

## Step 1: Create a New Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Click "+ Blank" to create a new form
3. Title: **Home Anchor - User Feedback Survey**
4. Description: **Help us improve Home Anchor! Share your experience and let us know what features you love, what needs improvement, and what you'd like to see next.**

---

## Step 2: Add the Following Questions

### Section 1: About You

**Question 1: How long have you been using Home Anchor?**
- Type: Multiple choice
- Required: Yes
- Options:
  - Less than a week
  - 1-4 weeks
  - 1-3 months
  - 3-6 months
  - More than 6 months
  - Just trying the demo

**Question 2: How many family members do you have set up in Home Anchor?**
- Type: Multiple choice
- Required: Yes
- Options:
  - Just me (1)
  - 2-3 members
  - 4-5 members
  - 6+ members
  - Haven't added members yet

**Question 3: What types of family members are you managing?** *(Check all that apply)*
- Type: Checkboxes
- Required: No
- Options:
  - Adults/Parents
  - Kids (ages 8+)
  - Toddlers
  - Only using for myself

---

### Section 2: Feature Usage

**Question 4: Which features do you use MOST often?** *(Check up to 5)*
- Type: Checkboxes
- Required: Yes
- Options:
  - Task List
  - Meal Planning
  - Workout Tracker
  - Habit Tracker
  - Journal
  - Gratitude Log
  - Points System (Kids)
  - Rewards Store (Kids)
  - Achievements/Badges (Kids)
  - Chores Tracker
  - Toddler Routines
  - Activities (Toddler)
  - Milestones
  - Daily Log
  - Recipes
  - Grocery List
  - Vision Board
  - Circuit Timer
  - Family Calendar
  - Schedule/Reminders
  - Screen Time Tracker
  - Other (please specify in next question)

**Question 5: If you selected "Other" above, please specify:**
- Type: Short answer
- Required: No

**Question 6: Which feature is your ABSOLUTE FAVORITE?**
- Type: Short answer
- Required: No
- Hint: Tell us the one feature you can't live without!

---

### Section 3: Widget Feedback

**Question 7: Are there any widgets you DON'T use and consider unnecessary?**
- Type: Paragraph
- Required: No
- Description: If there are widgets that don't add value for you, let us know which ones and why.

**Question 8: What NEW widgets would you like to see added?**
- Type: Paragraph
- Required: No
- Description: Describe any features or widgets you wish Home Anchor had. Be as detailed as you'd like!

**Question 9: Rate the current widgets** *(Scale: 1 = Not useful, 5 = Extremely useful)*
- Type: Linear scale (1-5)
- Create separate questions for each major widget:
  - Task Management
  - Meal Planning
  - Workout Tracking
  - Habit Tracking
  - Points System (for kids)
  - Rewards System
  - Calendar & Scheduling
  - Journal/Gratitude
  - Recipes & Grocery

---

### Section 4: User Experience

**Question 10: How would you rate the overall ease of use?**
- Type: Linear scale
- Required: Yes
- Scale: 1 (Very Difficult) to 5 (Very Easy)

**Question 11: How would you rate the visual design and interface?**
- Type: Linear scale
- Required: Yes
- Scale: 1 (Poor) to 5 (Excellent)

**Question 12: Is there anything confusing or difficult to use?**
- Type: Paragraph
- Required: No
- Description: Help us identify pain points in the user experience.

**Question 13: What do you like MOST about Home Anchor?**
- Type: Paragraph
- Required: No

**Question 14: What do you like LEAST about Home Anchor?**
- Type: Paragraph
- Required: No

---

### Section 5: Feature Requests

**Question 15: Would you like multi-device sync (using Firebase/cloud)?**
- Type: Multiple choice
- Required: Yes
- Options:
  - Yes, definitely need this!
  - Maybe, if it's optional
  - No, I prefer local-only storage
  - Don't care either way

**Question 16: Which of these potential features interest you most?** *(Check all that apply)*
- Type: Checkboxes
- Required: No
- Options:
  - Import recipes from URLs
  - Recipe scaling (adjust servings)
  - Budget tracker
  - Allowance manager (for kids)
  - Photo attachments to journal entries
  - Weekly/monthly reports and insights
  - Shared family notes
  - Shopping list categories
  - Medication reminders
  - Pet care tracker
  - Customizable themes/colors
  - Print/export schedules
  - Widget reordering/customization
  - Mobile app version
  - Other (please specify below)

**Question 17: If you have other feature ideas, describe them here:**
- Type: Paragraph
- Required: No

---

### Section 6: Kids Features (If Applicable)

**Question 18: If you use the Kids features, are the points/rewards motivating for your child?**
- Type: Multiple choice
- Required: No
- Options:
  - Yes, very motivating!
  - Somewhat motivating
  - Not really
  - Not applicable / Don't use kid features

**Question 19: What improvements would you suggest for the kids' experience?**
- Type: Paragraph
- Required: No

---

### Section 7: Final Thoughts

**Question 20: How likely are you to recommend Home Anchor to other families?**
- Type: Linear scale
- Required: Yes
- Scale: 1 (Not at all likely) to 10 (Extremely likely)

**Question 21: Any additional comments, suggestions, or feedback?**
- Type: Paragraph
- Required: No

**Question 22: May we contact you for follow-up questions? (Optional)**
- Type: Short answer
- Required: No
- Description: If yes, please provide your email address. We'll only use it for Home Anchor feedback purposes.

---

## Step 3: Customize Form Settings

1. Click on the Settings (gear) icon
2. **General tab:**
   - ✓ Limit to 1 response (optional)
   - ✓ Allow response editing
3. **Presentation tab:**
   - ✓ Show progress bar
   - Confirmation message: "Thank you for your feedback! Your insights help us make Home Anchor better for families everywhere. 🏠⚓"
4. Click "Save"

---

## Step 4: Get the Embed Code

1. Click "Send" button (top right)
2. Click the `< >` (embed) icon
3. Copy the iframe URL (it will look like: `https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?embedded=true`)
4. Replace the iframe src in `feedback.html` with your form URL

---

## Step 5: Update feedback.html

Open `feedback.html` and find this line (around line 196):

```html
<iframe
    id="feedbackFrame"
    src="https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?embedded=true"
```

Replace `YOUR_FORM_ID` with your actual Google Form embed URL.

---

## Step 6: Add Links to Feedback Page

You may want to add a link to the feedback page in:
- Settings page
- Landing page footer
- App header (as a "Give Feedback" button)

---

## Optional: Form Theme Customization

In Google Forms:
1. Click the palette icon (Theme options)
2. Choose a color scheme that matches Home Anchor
3. Suggested colors:
   - Header color: `#667eea` (matches the app's primary purple)
   - Background color: `#f6f9fc` (light background)
   - Font: Default or "Basic"

---

## Analytics

Google Forms automatically provides:
- Response summary with charts
- Individual responses
- Export to Google Sheets for deeper analysis
- Download as CSV

Access responses by clicking "Responses" tab in your form.

---

## Questions?

If you need help setting up the form or have questions about the implementation, feel free to ask!
