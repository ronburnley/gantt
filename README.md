# Interactive Gantt Chart

A fully-featured interactive Gantt chart application built with vanilla JavaScript, HTML, and CSS.

## Features

- Interactive task management (add, edit, delete tasks)
- Drag and drop to reschedule tasks
- Resize tasks by dragging edges
- Task dependencies with visual connections
- Multiple zoom levels (Day, Week, Month)
- Task types: Regular tasks, Milestones, and Summary tasks
- Progress tracking
- Resource assignment
- Collapsible task hierarchy
- Context menus and tooltips
- Dark mode support

## Running the Application

### Option 1: Using npm (with live reload)
```bash
npm run dev
```
This will start a development server with live reload on http://localhost:8080

### Option 2: Using npm (static server)
```bash
npm start
```
This will start a static HTTP server and open the application in your browser.

### Option 3: Direct file access
Simply open `index.html` in your web browser.

## Usage

- **Add Task**: Click the "+ Add Task" button in the toolbar
- **Edit Task**: Double-click on any task or use the right-click context menu
- **Delete Task**: Right-click on a task and select "Delete Task" or select a task and press Delete key
- **Drag Tasks**: Click and drag task bars to reschedule
- **Resize Tasks**: Drag the edges of task bars to change duration
- **Zoom**: Use the zoom controls to switch between Day, Week, and Month views
- **Expand/Collapse**: Click the arrow icons next to summary tasks or use the toolbar buttons

## Sample Data

The application includes sample project data to demonstrate the features. You can modify this data in the `initializeData()` method in `app.js`.