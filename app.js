// Gantt Chart Application with Data Persistence
class GanttChart {
    constructor() {
        this.tasks = [];
        this.currentZoom = 'day';
        this.selectedTask = null;
        this.editingTask = null;
        this.dragState = null;
        this.collapsedTasks = new Set();
        
        this.timelineStart = new Date('2024-01-01');
        this.timelineEnd = new Date('2024-06-01');
        this.today = new Date();
        
        this.dayWidth = 40;
        this.rowHeight = 40;
        
        // Auto-save timeout
        this.saveTimeout = null;
        
        // Load saved data or initialize with sample data
        if (!this.loadFromLocalStorage()) {
            this.initializeData();
        }
        
        this.initializeEventListeners();
        this.render();
        
        // Show notification that data was loaded
        if (this.tasks.length > 0) {
            this.showNotification('Project data loaded successfully', 'success');
        }
    }
    
    initializeData() {
        const sampleData = {
            "tasks": [
                {
                    "id": "1",
                    "name": "Project Planning Phase",
                    "startDate": "2024-01-01",
                    "endDate": "2024-01-15",
                    "duration": 15,
                    "progress": 100,
                    "type": "summary",
                    "parent": null,
                    "dependencies": [],
                    "resources": ["Project Manager"],
                    "color": "#4CAF50"
                },
                {
                    "id": "2",
                    "name": "Requirements Gathering",
                    "startDate": "2024-01-01",
                    "endDate": "2024-01-08",
                    "duration": 8,
                    "progress": 100,
                    "type": "task",
                    "parent": "1",
                    "dependencies": [],
                    "resources": ["Business Analyst", "Product Manager"],
                    "color": "#2196F3"
                },
                {
                    "id": "3",
                    "name": "Project Charter Approval",
                    "startDate": "2024-01-10",
                    "endDate": "2024-01-10",
                    "duration": 0,
                    "progress": 100,
                    "type": "milestone",
                    "parent": "1",
                    "dependencies": ["2"],
                    "resources": ["Executive Team"],
                    "color": "#FF9800"
                },
                {
                    "id": "4",
                    "name": "Team Formation",
                    "startDate": "2024-01-08",
                    "endDate": "2024-01-15",
                    "duration": 8,
                    "progress": 100,
                    "type": "task",
                    "parent": "1",
                    "dependencies": ["2"],
                    "resources": ["HR Manager", "Project Manager"],
                    "color": "#9C27B0"
                },
                {
                    "id": "5",
                    "name": "Design Phase",
                    "startDate": "2024-01-16",
                    "endDate": "2024-02-15",
                    "duration": 30,
                    "progress": 75,
                    "type": "summary",
                    "parent": null,
                    "dependencies": ["3"],
                    "resources": ["Design Team"],
                    "color": "#4CAF50"
                },
                {
                    "id": "6",
                    "name": "User Research",
                    "startDate": "2024-01-16",
                    "endDate": "2024-01-25",
                    "duration": 10,
                    "progress": 100,
                    "type": "task",
                    "parent": "5",
                    "dependencies": ["3"],
                    "resources": ["UX Researcher"],
                    "color": "#E91E63"
                },
                {
                    "id": "7",
                    "name": "Wireframing",
                    "startDate": "2024-01-26",
                    "endDate": "2024-02-05",
                    "duration": 11,
                    "progress": 80,
                    "type": "task",
                    "parent": "5",
                    "dependencies": ["6"],
                    "resources": ["UX Designer"],
                    "color": "#673AB7"
                },
                {
                    "id": "8",
                    "name": "UI Design",
                    "startDate": "2024-02-06",
                    "endDate": "2024-02-15",
                    "duration": 10,
                    "progress": 60,
                    "type": "task",
                    "parent": "5",
                    "dependencies": ["7"],
                    "resources": ["UI Designer"],
                    "color": "#3F51B5"
                },
                {
                    "id": "9",
                    "name": "Design Review",
                    "startDate": "2024-02-16",
                    "endDate": "2024-02-16",
                    "duration": 0,
                    "progress": 0,
                    "type": "milestone",
                    "parent": "5",
                    "dependencies": ["8"],
                    "resources": ["Stakeholders"],
                    "color": "#FF9800"
                },
                {
                    "id": "10",
                    "name": "Development Phase",
                    "startDate": "2024-02-17",
                    "endDate": "2024-04-15",
                    "duration": 58,
                    "progress": 30,
                    "type": "summary",
                    "parent": null,
                    "dependencies": ["9"],
                    "resources": ["Development Team"],
                    "color": "#4CAF50"
                },
                {
                    "id": "11",
                    "name": "Frontend Development",
                    "startDate": "2024-02-17",
                    "endDate": "2024-03-20",
                    "duration": 32,
                    "progress": 45,
                    "type": "task",
                    "parent": "10",
                    "dependencies": ["9"],
                    "resources": ["Frontend Developer 1", "Frontend Developer 2"],
                    "color": "#00BCD4"
                },
                {
                    "id": "12",
                    "name": "Backend Development",
                    "startDate": "2024-02-17",
                    "endDate": "2024-03-25",
                    "duration": 37,
                    "progress": 35,
                    "type": "task",
                    "parent": "10",
                    "dependencies": ["9"],
                    "resources": ["Backend Developer 1", "Backend Developer 2"],
                    "color": "#009688"
                },
                {
                    "id": "13",
                    "name": "Integration Testing",
                    "startDate": "2024-03-26",
                    "endDate": "2024-04-10",
                    "duration": 16,
                    "progress": 10,
                    "type": "task",
                    "parent": "10",
                    "dependencies": ["11", "12"],
                    "resources": ["QA Engineer"],
                    "color": "#FF5722"
                },
                {
                    "id": "14",
                    "name": "Beta Release",
                    "startDate": "2024-04-15",
                    "endDate": "2024-04-15",
                    "duration": 0,
                    "progress": 0,
                    "type": "milestone",
                    "parent": "10",
                    "dependencies": ["13"],
                    "resources": ["Release Manager"],
                    "color": "#FF9800"
                },
                {
                    "id": "15",
                    "name": "Testing & Launch",
                    "startDate": "2024-04-16",
                    "endDate": "2024-05-15",
                    "duration": 30,
                    "progress": 0,
                    "type": "summary",
                    "parent": null,
                    "dependencies": ["14"],
                    "resources": ["QA Team"],
                    "color": "#4CAF50"
                },
                {
                    "id": "16",
                    "name": "User Acceptance Testing",
                    "startDate": "2024-04-16",
                    "endDate": "2024-04-30",
                    "duration": 15,
                    "progress": 0,
                    "type": "task",
                    "parent": "15",
                    "dependencies": ["14"],
                    "resources": ["QA Team", "Business Users"],
                    "color": "#795548"
                },
                {
                    "id": "17",
                    "name": "Production Deployment",
                    "startDate": "2024-05-01",
                    "endDate": "2024-05-10",
                    "duration": 10,
                    "progress": 0,
                    "type": "task",
                    "parent": "15",
                    "dependencies": ["16"],
                    "resources": ["DevOps Engineer"],
                    "color": "#607D8B"
                },
                {
                    "id": "18",
                    "name": "Project Launch",
                    "startDate": "2024-05-15",
                    "endDate": "2024-05-15",
                    "duration": 0,
                    "progress": 0,
                    "type": "milestone",
                    "parent": "15",
                    "dependencies": ["17"],
                    "resources": ["Marketing Team"],
                    "color": "#FF9800"
                }
            ]
        };
        
        this.tasks = sampleData.tasks.map(task => ({
            ...task,
            startDate: new Date(task.startDate),
            endDate: new Date(task.endDate)
        }));
    }
    
    initializeEventListeners() {
        // Toolbar events
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('expandAllBtn').addEventListener('click', () => this.expandAll());
        document.getElementById('collapseAllBtn').addEventListener('click', () => this.collapseAll());
        
        // Zoom controls
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setZoom(e.target.dataset.zoom));
        });
        
        // Modal events
        document.getElementById('modalClose').addEventListener('click', () => this.hideTaskModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.hideTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.saveTask(e));
        document.getElementById('modalDelete').addEventListener('click', () => this.deleteTask());
        
        // Close modal on overlay click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideTaskModal();
        });
        
        // Context menu
        document.addEventListener('click', () => this.hideContextMenu());
        document.getElementById('contextMenu').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleContextMenuAction(e.target.dataset.action);
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Timeline scroll synchronization
        const timelineHeader = document.getElementById('timelineHeader');
        const timelineBody = document.getElementById('timelineBody');
        
        timelineBody.addEventListener('scroll', () => {
            timelineHeader.scrollLeft = timelineBody.scrollLeft;
        });
        
        // Initialize resize functionality
        this.initializeResize();
    }
    
    render() {
        this.renderTaskList();
        this.renderTimeline();
        this.renderTimelineHeader();
        this.renderTimelineBars();
        // this.renderDependencies(); // Commented out to remove dependency lines
        this.renderTodayLine();
    }
    
    renderTaskList() {
        const taskListBody = document.getElementById('taskListBody');
        taskListBody.innerHTML = '';
        
        const visibleTasks = this.getVisibleTasks();
        
        visibleTasks.forEach((task, index) => {
            const taskRow = this.createTaskRow(task, index);
            taskListBody.appendChild(taskRow);
        });
    }
    
    getVisibleTasks() {
        const result = [];
        const rootTasks = this.tasks.filter(task => !task.parent);
        
        const addTaskAndChildren = (task, level = 0) => {
            result.push({ ...task, level });
            
            if (!this.collapsedTasks.has(task.id)) {
                const children = this.tasks.filter(t => t.parent === task.id);
                children.forEach(child => addTaskAndChildren(child, level + 1));
            }
        };
        
        rootTasks.forEach(task => addTaskAndChildren(task));
        return result;
    }
    
    createTaskRow(task, index) {
        const row = document.createElement('div');
        row.className = `task-row ${task.type}`;
        row.dataset.taskId = task.id;
        row.style.paddingLeft = `${task.level * 20 + 8}px`;
        
        if (this.selectedTask === task.id) {
            row.classList.add('selected');
        }
        
        const hasChildren = this.tasks.some(t => t.parent === task.id);
        const isCollapsed = this.collapsedTasks.has(task.id);
        
        // Create task name with proper indentation
        const nameDiv = document.createElement('div');
        nameDiv.className = 'task-name';
        nameDiv.innerHTML = `
            ${hasChildren ? `<button class="task-expand-toggle">${isCollapsed ? '▶' : '▼'}</button>` : '<span class="task-indent"></span>'}
            <div class="task-type-indicator ${task.type}" style="background-color: ${task.color}"></div>
            <span class="task-name-text">${task.name}</span>
        `;
        row.appendChild(nameDiv);
        
        // Start date
        const startDate = document.createElement('div');
        startDate.className = 'task-start-date';
        startDate.textContent = this.formatDate(task.startDate);
        row.appendChild(startDate);
        
        // End date
        const endDate = document.createElement('div');
        endDate.className = 'task-end-date';
        endDate.textContent = this.formatDate(task.endDate);
        row.appendChild(endDate);
        
        // Duration
        const duration = document.createElement('div');
        duration.className = 'task-duration';
        duration.textContent = `${task.duration}d`;
        row.appendChild(duration);
        
        // Progress
        const progress = document.createElement('div');
        progress.className = 'task-progress';
        progress.innerHTML = `
            <div class="task-progress-bar">
                <div class="task-progress-fill" style="width: ${task.progress}%"></div>
            </div>
        `;
        row.appendChild(progress);
        
        // Resources
        const resources = document.createElement('div');
        resources.className = 'task-resources';
        resources.textContent = task.resources.join(', ');
        row.appendChild(resources);
        
        // Event listeners
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectTask(task.id);
        });
        
        row.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.showTaskModal(task);
        });
        
        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, task);
        });
        
        // Expand/collapse toggle
        const toggleBtn = row.querySelector('.task-expand-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTaskCollapse(task.id);
            });
        }
        
        return row;
    }
    
    renderTimelineHeader() {
        const header = document.getElementById('timelineHeader');
        header.innerHTML = '';
        
        const headerRow = document.createElement('div');
        headerRow.className = 'timeline-header-row';
        
        const totalDays = Math.ceil((this.timelineEnd - this.timelineStart) / (1000 * 60 * 60 * 24));
        
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(this.timelineStart);
            date.setDate(date.getDate() + i);
            
            if (this.shouldShowDate(date, i)) {
                const cell = document.createElement('div');
                cell.className = 'timeline-header-cell';
                cell.style.width = `${this.getDateCellWidth(date)}px`;
                cell.textContent = this.formatHeaderDate(date);
                
                if (date.getDay() === 0 || date.getDay() === 6) {
                    cell.classList.add('weekend');
                }
                
                headerRow.appendChild(cell);
            }
        }
        
        header.appendChild(headerRow);
    }
    
    shouldShowDate(date, index) {
        switch (this.currentZoom) {
            case 'day':
                return true;
            case 'week':
                return date.getDay() === 1; // Monday
            case 'month':
                return date.getDate() === 1;
            default:
                return true;
        }
    }
    
    getDateCellWidth(date) {
        switch (this.currentZoom) {
            case 'day':
                return this.dayWidth;
            case 'week':
                return this.dayWidth * 7;
            case 'month':
                const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                return this.dayWidth * daysInMonth;
            default:
                return this.dayWidth;
        }
    }
    
    formatHeaderDate(date) {
        switch (this.currentZoom) {
            case 'day':
                return date.getDate().toString();
            case 'week':
                return `Week ${this.getWeekNumber(date)}`;
            case 'month':
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            default:
                return date.getDate().toString();
        }
    }
    
    renderTimeline() {
        const timelineGrid = document.getElementById('timelineGrid');
        timelineGrid.innerHTML = '';
        
        const totalDays = Math.ceil((this.timelineEnd - this.timelineStart) / (1000 * 60 * 60 * 24));
        
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(this.timelineStart);
            date.setDate(date.getDate() + i);
            
            const gridLine = document.createElement('div');
            gridLine.className = 'timeline-grid-line';
            gridLine.style.left = `${i * this.dayWidth}px`;
            
            if (date.getDay() === 0 || date.getDay() === 6) {
                gridLine.classList.add('weekend');
            }
            
            timelineGrid.appendChild(gridLine);
        }
        
        // Set minimum width for scrolling
        const timelineBody = document.getElementById('timelineBody');
        timelineBody.style.minWidth = `${totalDays * this.dayWidth}px`;
    }
    
    renderTimelineBars() {
        const timelineBars = document.getElementById('timelineBars');
        timelineBars.innerHTML = '';
        
        const visibleTasks = this.getVisibleTasks();
        
        visibleTasks.forEach((task, index) => {
            const bar = this.createTimelineBar(task, index);
            timelineBars.appendChild(bar);
        });
    }
    
    createTimelineBar(task, rowIndex) {
        const bar = document.createElement('div');
        bar.className = `timeline-bar ${task.type}`;
        bar.dataset.taskId = task.id;
        bar.style.backgroundColor = task.color;
        
        const startOffset = this.getDateOffset(task.startDate);
        const duration = task.type === 'milestone' ? 0 : Math.max(1, Math.ceil((task.endDate - task.startDate) / (1000 * 60 * 60 * 24)));
        const width = task.type === 'milestone' ? 16 : duration * this.dayWidth;
        
        bar.style.left = `${startOffset}px`;
        bar.style.top = `${rowIndex * this.rowHeight + 4}px`;
        bar.style.width = `${width}px`;
        
        if (this.selectedTask === task.id) {
            bar.classList.add('selected');
        }
        
        // Progress bar
        if (task.type !== 'milestone' && task.progress > 0) {
            const progressBar = document.createElement('div');
            progressBar.className = 'timeline-bar-progress';
            progressBar.style.width = `${task.progress}%`;
            bar.appendChild(progressBar);
        }
        
        // Task text
        if (task.type !== 'milestone') {
            const text = document.createElement('div');
            text.className = 'timeline-bar-text';
            text.textContent = task.name;
            bar.appendChild(text);
            
            // Resize handles
            const leftHandle = document.createElement('div');
            leftHandle.className = 'timeline-bar-resize-handle left';
            bar.appendChild(leftHandle);
            
            const rightHandle = document.createElement('div');
            rightHandle.className = 'timeline-bar-resize-handle right';
            bar.appendChild(rightHandle);
        }
        
        // Event listeners
        bar.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectTask(task.id);
        });
        
        bar.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.showTaskModal(task);
        });
        
        bar.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, task);
        });
        
        bar.addEventListener('mouseenter', (e) => {
            this.showTooltip(e, task);
        });
        
        bar.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // Drag functionality
        this.addDragListeners(bar, task);
        
        return bar;
    }
    
    addDragListeners(bar, task) {
        let isDragging = false;
        let isResizing = false;
        let resizeDirection = null;
        let startX = 0;
        let startLeft = 0;
        let startWidth = 0;
        
        const onMouseDown = (e) => {
            if (task.type === 'milestone') return;
            
            e.preventDefault();
            e.stopPropagation();
            startX = e.clientX;
            startLeft = parseInt(bar.style.left);
            startWidth = parseInt(bar.style.width);
            
            if (e.target.classList.contains('timeline-bar-resize-handle')) {
                isResizing = true;
                resizeDirection = e.target.classList.contains('left') ? 'left' : 'right';
            } else {
                isDragging = true;
            }
            
            bar.classList.add('dragging');
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        
        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            
            if (isDragging) {
                const newLeft = Math.max(0, startLeft + deltaX);
                bar.style.left = `${newLeft}px`;
            } else if (isResizing) {
                if (resizeDirection === 'right') {
                    const newWidth = Math.max(this.dayWidth, startWidth + deltaX);
                    bar.style.width = `${newWidth}px`;
                } else {
                    const newLeft = Math.max(0, startLeft + deltaX);
                    const newWidth = Math.max(this.dayWidth, startWidth - deltaX);
                    bar.style.left = `${newLeft}px`;
                    bar.style.width = `${newWidth}px`;
                }
            }
        };
        
        const onMouseUp = () => {
            if (isDragging || isResizing) {
                this.updateTaskFromDrag(task, bar, isDragging, resizeDirection);
            }
            
            isDragging = false;
            isResizing = false;
            resizeDirection = null;
            bar.classList.remove('dragging');
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        bar.addEventListener('mousedown', onMouseDown);
    }
    
    updateTaskFromDrag(task, bar, wasDragging, resizeDirection) {
        const newLeft = parseInt(bar.style.left);
        const newWidth = parseInt(bar.style.width);
        
        const newStartDate = this.getDateFromOffset(newLeft);
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + Math.round(newWidth / this.dayWidth) - 1);
        
        // Update task data
        const taskIndex = this.tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].startDate = newStartDate;
            this.tasks[taskIndex].endDate = newEndDate;
            this.tasks[taskIndex].duration = Math.round(newWidth / this.dayWidth);
        }
        
        // Re-render to update the task list
        this.renderTaskList();
        // this.renderDependencies(); // Removed dependency rendering
        this.autoSave();
    }
    
    renderDependencies() {
        const dependenciesContainer = document.getElementById('timelineDependencies');
        dependenciesContainer.innerHTML = '';
        
        // Create SVG for drawing lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        
        // Add arrow marker
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', '#626C71');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);
        
        const visibleTasks = this.getVisibleTasks();
        
        visibleTasks.forEach((task, taskIndex) => {
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(depId => {
                    const depTaskIndex = visibleTasks.findIndex(t => t.id === depId);
                    if (depTaskIndex !== -1) {
                        const line = this.createDependencyLine(visibleTasks[depTaskIndex], task, depTaskIndex, taskIndex);
                        svg.appendChild(line);
                    }
                });
            }
        });
        
        dependenciesContainer.appendChild(svg);
    }
    
    createDependencyLine(fromTask, toTask, fromIndex, toIndex) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.setAttribute('class', 'dependency-line');
        
        const fromX = this.getDateOffset(fromTask.endDate) + (fromTask.type === 'milestone' ? 8 : fromTask.duration * this.dayWidth);
        const fromY = fromIndex * this.rowHeight + 20;
        const toX = this.getDateOffset(toTask.startDate);
        const toY = toIndex * this.rowHeight + 20;
        
        // Create a path with right angles
        const midX = fromX + 20;
        const pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;
        
        line.setAttribute('d', pathData);
        
        return line;
    }
    
    renderTodayLine() {
        const todayLine = document.getElementById('todayLine');
        const todayOffset = this.getDateOffset(this.today);
        todayLine.style.left = `${todayOffset}px`;
    }
    
    getDateOffset(date) {
        const diffTime = date - this.timelineStart;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * this.dayWidth;
    }
    
    getDateFromOffset(offset) {
        const days = Math.round(offset / this.dayWidth);
        const date = new Date(this.timelineStart);
        date.setDate(date.getDate() + days);
        return date;
    }
    
    setZoom(zoom) {
        this.currentZoom = zoom;
        
        // Update active button
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.zoom === zoom);
        });
        
        // Adjust day width based on zoom
        switch (zoom) {
            case 'day':
                this.dayWidth = 40;
                break;
            case 'week':
                this.dayWidth = 20;
                break;
            case 'month':
                this.dayWidth = 10;
                break;
        }
        
        this.render();
        this.autoSave();
    }
    
    selectTask(taskId) {
        this.selectedTask = taskId;
        this.render();
    }
    
    toggleTaskCollapse(taskId) {
        if (this.collapsedTasks.has(taskId)) {
            this.collapsedTasks.delete(taskId);
        } else {
            this.collapsedTasks.add(taskId);
        }
        this.render();
        this.autoSave();
    }
    
    expandAll() {
        this.collapsedTasks.clear();
        this.render();
        this.autoSave();
    }
    
    collapseAll() {
        const summaryTasks = this.tasks.filter(task => task.type === 'summary');
        summaryTasks.forEach(task => this.collapsedTasks.add(task.id));
        this.render();
        this.autoSave();
    }
    
    showTaskModal(task = null) {
        this.editingTask = task;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('modalDelete');
        
        title.textContent = task ? 'Edit Task' : 'Add New Task';
        deleteBtn.style.display = task ? 'block' : 'none';
        
        if (task) {
            document.getElementById('taskName').value = task.name;
            document.getElementById('taskStartDate').value = this.formatDateForInput(task.startDate);
            document.getElementById('taskEndDate').value = this.formatDateForInput(task.endDate);
            document.getElementById('taskProgress').value = task.progress;
            document.getElementById('taskType').value = task.type;
            document.getElementById('taskResources').value = task.resources.join(', ');
            document.getElementById('taskColor').value = task.color;
        } else {
            form.reset();
            document.getElementById('taskColor').value = '#2196F3';
            document.getElementById('taskProgress').value = '0';
        }
        
        this.populateDependenciesSelect(task);
        modal.classList.add('active');
        
        // Focus the task name input
        setTimeout(() => {
            document.getElementById('taskName').focus();
        }, 100);
    }
    
    populateDependenciesSelect(currentTask) {
        const select = document.getElementById('taskDependencies');
        select.innerHTML = '';
        
        this.tasks.forEach(task => {
            if (!currentTask || task.id !== currentTask.id) {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.name;
                option.selected = currentTask && currentTask.dependencies.includes(task.id);
                select.appendChild(option);
            }
        });
    }
    
    hideTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
        this.editingTask = null;
    }
    
    saveTask(e) {
        e.preventDefault();
        
        const taskData = {
            name: document.getElementById('taskName').value.trim(),
            startDate: new Date(document.getElementById('taskStartDate').value),
            endDate: new Date(document.getElementById('taskEndDate').value),
            progress: parseInt(document.getElementById('taskProgress').value) || 0,
            type: document.getElementById('taskType').value,
            resources: document.getElementById('taskResources').value.split(',').map(r => r.trim()).filter(r => r),
            color: document.getElementById('taskColor').value,
            dependencies: Array.from(document.getElementById('taskDependencies').selectedOptions).map(opt => opt.value)
        };
        
        // Validate required fields
        if (!taskData.name) {
            alert('Please enter a task name');
            return;
        }
        
        if (taskData.startDate > taskData.endDate) {
            alert('Start date cannot be after end date');
            return;
        }
        
        // Calculate duration
        taskData.duration = taskData.type === 'milestone' ? 0 : Math.ceil((taskData.endDate - taskData.startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        if (this.editingTask) {
            // Update existing task
            const taskIndex = this.tasks.findIndex(t => t.id === this.editingTask.id);
            if (taskIndex !== -1) {
                this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
            }
        } else {
            // Add new task
            const newTask = {
                id: Date.now().toString(),
                parent: null,
                ...taskData
            };
            this.tasks.push(newTask);
        }
        
        this.hideTaskModal();
        this.render();
        this.autoSave();
        this.showNotification('Task saved successfully', 'success');
    }
    
    deleteTask() {
        if (this.editingTask && confirm('Are you sure you want to delete this task?')) {
            // Remove task and any dependencies
            this.tasks = this.tasks.filter(task => task.id !== this.editingTask.id);
            
            // Remove dependencies on this task from other tasks
            this.tasks.forEach(task => {
                task.dependencies = task.dependencies.filter(depId => depId !== this.editingTask.id);
            });
            
            this.hideTaskModal();
            this.render();
            this.autoSave();
            this.showNotification('Task deleted successfully', 'info');
        }
    }
    
    showContextMenu(e, task) {
        e.preventDefault();
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.dataset.taskId = task.id;
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.classList.add('active');
    }
    
    hideContextMenu() {
        document.getElementById('contextMenu').classList.remove('active');
    }
    
    handleContextMenuAction(action) {
        const taskId = document.getElementById('contextMenu').dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        switch (action) {
            case 'edit':
                this.showTaskModal(task);
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this task?')) {
                    this.tasks = this.tasks.filter(t => t.id !== taskId);
                    // Remove dependencies on this task from other tasks
                    this.tasks.forEach(t => {
                        t.dependencies = t.dependencies.filter(depId => depId !== taskId);
                    });
                    this.render();
                    this.autoSave();
                }
                break;
            case 'add-child':
                // Create a child task
                this.showTaskModal();
                break;
            case 'mark-complete':
                const taskIndex = this.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex].progress = 100;
                    this.render();
                    this.autoSave();
                }
                break;
        }
        
        this.hideContextMenu();
    }
    
    showTooltip(e, task) {
        const tooltip = document.getElementById('tooltip');
        const content = tooltip.querySelector('.tooltip-content');
        
        content.innerHTML = `
            <strong>${task.name}</strong><br>
            Start: ${this.formatDate(task.startDate)}<br>
            End: ${this.formatDate(task.endDate)}<br>
            Duration: ${task.duration} days<br>
            Progress: ${task.progress}%<br>
            Resources: ${task.resources.join(', ')}
        `;
        
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
        tooltip.classList.add('active');
    }
    
    hideTooltip() {
        document.getElementById('tooltip').classList.remove('active');
    }
    
    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.hideTaskModal();
            this.hideContextMenu();
            this.hideTooltip();
        } else if (e.key === 'Delete' && this.selectedTask) {
            const task = this.tasks.find(t => t.id === this.selectedTask);
            if (task && confirm('Are you sure you want to delete this task?')) {
                this.tasks = this.tasks.filter(t => t.id !== this.selectedTask);
                // Remove dependencies on this task from other tasks
                this.tasks.forEach(t => {
                    t.dependencies = t.dependencies.filter(depId => depId !== this.selectedTask);
                });
                this.selectedTask = null;
                this.render();
                this.autoSave();
            }
        }
    }
    
    formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }
    
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    // Data persistence methods
    saveToLocalStorage() {
        try {
            const dataToSave = {
                version: '1.0',
                lastSaved: new Date().toISOString(),
                tasks: this.tasks.map(task => ({
                    ...task,
                    startDate: task.startDate.toISOString(),
                    endDate: task.endDate.toISOString()
                })),
                collapsedTasks: Array.from(this.collapsedTasks),
                currentZoom: this.currentZoom,
                selectedTask: this.selectedTask
            };
            
            localStorage.setItem('ganttChartData', JSON.stringify(dataToSave));
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            this.showNotification('Failed to save data', 'error');
            return false;
        }
    }
    
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('ganttChartData');
            if (!savedData) return false;
            
            const data = JSON.parse(savedData);
            
            // Restore tasks with proper date objects
            this.tasks = data.tasks.map(task => ({
                ...task,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
            }));
            
            // Restore collapsed tasks
            this.collapsedTasks = new Set(data.collapsedTasks || []);
            
            // Restore zoom level
            if (data.currentZoom) {
                this.currentZoom = data.currentZoom;
            }
            
            // Restore selected task
            if (data.selectedTask) {
                this.selectedTask = data.selectedTask;
            }
            
            // Update timeline bounds based on tasks
            this.updateTimelineBounds();
            
            return true;
        } catch (error) {
            console.error('Failed to load data:', error);
            return false;
        }
    }
    
    autoSave() {
        // Clear any existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Set a new timeout to save after 500ms of inactivity
        this.saveTimeout = setTimeout(() => {
            if (this.saveToLocalStorage()) {
                this.showNotification('Changes saved', 'success', 1000);
            }
        }, 500);
    }
    
    updateTimelineBounds() {
        if (this.tasks.length === 0) return;
        
        // Find earliest and latest dates
        let minDate = new Date(this.tasks[0].startDate);
        let maxDate = new Date(this.tasks[0].endDate);
        
        this.tasks.forEach(task => {
            if (task.startDate < minDate) minDate = new Date(task.startDate);
            if (task.endDate > maxDate) maxDate = new Date(task.endDate);
        });
        
        // Add some padding
        minDate.setDate(minDate.getDate() - 7);
        maxDate.setDate(maxDate.getDate() + 30);
        
        this.timelineStart = minDate;
        this.timelineEnd = maxDate;
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.removeItem('ganttChartData');
            this.tasks = [];
            this.collapsedTasks.clear();
            this.selectedTask = null;
            this.initializeData();
            this.render();
            this.showNotification('All data cleared', 'info');
        }
    }
    
    initializeResize() {
        const resizeHandle = document.getElementById('resizeHandle');
        const taskListPanel = document.getElementById('taskListPanel');
        const ganttMain = document.querySelector('.gantt-main');
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = taskListPanel.offsetWidth;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - startX;
            const newWidth = Math.max(300, Math.min(startWidth + deltaX, ganttMain.offsetWidth * 0.6));
            taskListPanel.style.width = `${newWidth}px`;
            
            // Trigger a resize event to update timeline if needed
            window.dispatchEvent(new Event('resize'));
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                // Save the new width to localStorage
                localStorage.setItem('taskListPanelWidth', taskListPanel.offsetWidth);
            }
        });
        
        // Restore saved width if available
        const savedWidth = localStorage.getItem('taskListPanelWidth');
        if (savedWidth) {
            taskListPanel.style.width = `${savedWidth}px`;
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GanttChart();
});