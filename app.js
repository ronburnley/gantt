// Gantt Chart Application with Firestore Persistence
class GanttChart {
    constructor() {
        this.initiatives = [];
        this.currentInitiativeId = null;
        this.tasks = [];
        this.currentZoom = 'day';
        this.selectedTask = null;
        this.editingTask = null;
        this.dragState = null;
        this.collapsedTasks = new Set();
        
        this.today = new Date();
        
        // Set timeline to start 3 months before today and end 9 months after
        this.timelineStart = new Date(this.today);
        this.timelineStart.setMonth(this.timelineStart.getMonth() - 3);
        this.timelineStart.setDate(1); // Start at beginning of month
        
        this.timelineEnd = new Date(this.today);
        this.timelineEnd.setMonth(this.timelineEnd.getMonth() + 9);
        this.timelineEnd.setDate(new Date(this.timelineEnd.getFullYear(), this.timelineEnd.getMonth() + 1, 0).getDate()); // End at end of month
        
        this.dayWidth = 40;
        this.rowHeight = 40;
        this.barHeightOffset = 4; // Offset from top of row
        
        // Auto-save timeout
        this.saveTimeout = null;
        
        // Firestore collection reference
        this.projectId = 'default-project'; // Can be made configurable later
        this.firestoreEnabled = false;
        
        // Initialize Firebase after DOM is ready
        this.initializeFirestore().then(() => {
            // Load saved data or initialize with sample data
            this.loadData().then(() => {
                // Ensure timeline bounds are properly calculated before first render
                this.updateTimelineBounds();
                
                this.initializeEventListeners();
                this.render();
                
                // Debug initiatives after loading
                this.debugInitiatives();
                
                // Show notification that data was loaded
                if (this.tasks.length > 0) {
                    this.showNotification('Project data loaded successfully', 'success');
                } else {
                    this.showNotification('No tasks found - timeline ready for new tasks', 'info');
                }
                
                // Scroll timeline to show current date
                this.scrollToToday();
            });
        });
    }
    
    async initializeFirestore() {
        try {
            // Check if Firebase is available
            if (typeof window.db !== 'undefined') {
                this.db = window.db;
                this.firestoreEnabled = true;
                // Firestore initialized successfully
            } else {
                console.warn('Firestore not available, falling back to localStorage');
                this.firestoreEnabled = false;
            }
        } catch (error) {
            console.error('Failed to initialize Firestore:', error);
            this.firestoreEnabled = false;
        }
    }
    
    async loadData() {
        try {
            let loaded = false;
            
            if (this.firestoreEnabled) {
                loaded = await this.loadFromFirestore();
            }
            
            // Fallback to localStorage if Firestore fails or is unavailable
            if (!loaded) {
                loaded = this.loadFromLocalStorage();
            }
            
            // Clear old data if it's from before 2025 (temporary fix)
            if (loaded && this.tasks.length > 0) {
                const firstTaskYear = this.tasks[0].startDate.getFullYear();
                if (firstTaskYear < 2025) {
                    localStorage.removeItem('ganttChartData');
                    loaded = false;
                }
            }
            
            // If no data found anywhere, initialize with sample data
            if (!loaded) {
                this.initializeData();
            } else {
                // Ensure loaded tasks have proper initiative assignments
                this.ensureTaskInitiativeAssignments();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.initializeData();
        }
    }
    
    getDateString(baseDate, daysToAdd) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + daysToAdd);
        return date.toISOString().split('T')[0];
    }
    
    initializeData() {
        // Create initiatives for June-December 2025
        const initiative1 = {
            id: 'init-product-launch',
            name: 'Product Launch Q3 2025',
            description: 'New product launch initiative for Q3 2025',
            createdAt: new Date().toISOString(),
            projects: []
        };
        
        const initiative2 = {
            id: 'init-infrastructure',
            name: 'Infrastructure Upgrade',
            description: 'Major infrastructure upgrade and migration project',
            createdAt: new Date().toISOString(),
            projects: []
        };
        
        const initiative3 = {
            id: 'init-team-expansion',
            name: 'Team Expansion',
            description: 'Hiring and onboarding new team members',
            createdAt: new Date().toISOString(),
            projects: []
        };
        
        const initiative4 = {
            id: 'init-year-end',
            name: 'Year-End Planning',
            description: 'Strategic planning and reviews for year-end',
            createdAt: new Date().toISOString(),
            projects: []
        };
        
        this.initiatives = [initiative1, initiative2, initiative3, initiative4];
        this.currentInitiativeId = initiative1.id;
        
        // Create elaborate test project data for June-December 2025
        this.tasks = [
            // Initiative 1: Product Launch Q3 2025
            {
                id: "pl-1",
                name: "Product Launch Q3 2025",
                startDate: new Date("2025-06-01"),
                endDate: new Date("2025-10-31"),
                duration: 152,
                progress: 25,
                type: "summary",
                parent: null,
                dependencies: [],
                resources: ["Product Team"],
                color: "#4CAF50",
                isProject: true,
                initiativeId: initiative1.id
            },
            {
                id: "pl-2",
                name: "Market Research",
                startDate: new Date("2025-06-01"),
                endDate: new Date("2025-06-30"),
                duration: 30,
                progress: 85,
                type: "task",
                parent: "pl-1",
                dependencies: [],
                resources: ["Research Team", "Analytics"],
                color: "#2196F3",
                initiativeId: initiative1.id
            },
            {
                id: "pl-3",
                name: "Product Design Phase",
                startDate: new Date("2025-06-15"),
                endDate: new Date("2025-07-31"),
                duration: 47,
                progress: 65,
                type: "task",
                parent: "pl-1",
                dependencies: [],
                resources: ["Design Team", "UX Designer"],
                color: "#00BCD4",
                initiativeId: initiative1.id
            },
            {
                id: "pl-4",
                name: "Development Sprint 1",
                startDate: new Date("2025-07-01"),
                endDate: new Date("2025-07-31"),
                duration: 31,
                progress: 40,
                type: "task",
                parent: "pl-1",
                dependencies: ["pl-3"],
                resources: ["Dev Team Alpha", "Backend Team"],
                color: "#3F51B5",
                initiativeId: initiative1.id
            },
            {
                id: "pl-5",
                name: "Development Sprint 2",
                startDate: new Date("2025-08-01"),
                endDate: new Date("2025-08-31"),
                duration: 31,
                progress: 10,
                type: "task",
                parent: "pl-1",
                dependencies: ["pl-4"],
                resources: ["Dev Team Beta", "Frontend Team"],
                color: "#673AB7",
                initiativeId: initiative1.id
            },
            {
                id: "pl-6",
                name: "Testing & QA",
                startDate: new Date("2025-09-01"),
                endDate: new Date("2025-09-15"),
                duration: 15,
                progress: 0,
                type: "task",
                parent: "pl-1",
                dependencies: ["pl-5"],
                resources: ["QA Team", "Test Automation"],
                color: "#9C27B0",
                initiativeId: initiative1.id
            },
            {
                id: "pl-7",
                name: "Marketing Campaign",
                startDate: new Date("2025-08-15"),
                endDate: new Date("2025-09-30"),
                duration: 47,
                progress: 20,
                type: "task",
                parent: "pl-1",
                dependencies: ["pl-2"],
                resources: ["Marketing Team", "Content Creators"],
                color: "#E91E63",
                initiativeId: initiative1.id
            },
            {
                id: "pl-8",
                name: "Launch Event",
                startDate: new Date("2025-10-01"),
                endDate: new Date("2025-10-01"),
                duration: 0,
                progress: 0,
                type: "milestone",
                parent: "pl-1",
                dependencies: ["pl-6", "pl-7"],
                resources: ["Event Team"],
                color: "#F44336",
                initiativeId: initiative1.id
            },
            {
                id: "pl-9",
                name: "Post-Launch Support",
                startDate: new Date("2025-10-02"),
                endDate: new Date("2025-10-31"),
                duration: 30,
                progress: 0,
                type: "task",
                parent: "pl-1",
                dependencies: ["pl-8"],
                resources: ["Support Team", "DevOps"],
                color: "#FF5722",
                initiativeId: initiative1.id
            },
            
            // Initiative 2: Infrastructure Upgrade
            {
                id: "iu-1",
                name: "Infrastructure Upgrade",
                startDate: new Date("2025-06-01"),
                endDate: new Date("2025-09-30"),
                duration: 122,
                progress: 30,
                type: "summary",
                parent: null,
                dependencies: [],
                resources: ["Infrastructure Team"],
                color: "#FF9800",
                isProject: true,
                initiativeId: initiative2.id
            },
            {
                id: "iu-2",
                name: "Infrastructure Assessment",
                startDate: new Date("2025-06-01"),
                endDate: new Date("2025-06-15"),
                duration: 15,
                progress: 100,
                type: "task",
                parent: "iu-1",
                dependencies: [],
                resources: ["System Architects", "DevOps"],
                color: "#FFC107",
                initiativeId: initiative2.id
            },
            {
                id: "iu-3",
                name: "Migration Planning",
                startDate: new Date("2025-06-16"),
                endDate: new Date("2025-06-30"),
                duration: 15,
                progress: 90,
                type: "task",
                parent: "iu-1",
                dependencies: ["iu-2"],
                resources: ["Project Managers", "Tech Leads"],
                color: "#FFEB3B",
                initiativeId: initiative2.id
            },
            {
                id: "iu-4",
                name: "Server Upgrades",
                startDate: new Date("2025-07-01"),
                endDate: new Date("2025-07-31"),
                duration: 31,
                progress: 50,
                type: "task",
                parent: "iu-1",
                dependencies: ["iu-3"],
                resources: ["Infrastructure Team", "Network Engineers"],
                color: "#CDDC39",
                initiativeId: initiative2.id
            },
            {
                id: "iu-5",
                name: "Database Migration",
                startDate: new Date("2025-08-01"),
                endDate: new Date("2025-08-15"),
                duration: 15,
                progress: 15,
                type: "task",
                parent: "iu-1",
                dependencies: ["iu-4"],
                resources: ["Database Team", "Data Engineers"],
                color: "#8BC34A",
                initiativeId: initiative2.id
            },
            {
                id: "iu-6",
                name: "Performance Testing",
                startDate: new Date("2025-08-16"),
                endDate: new Date("2025-08-31"),
                duration: 16,
                progress: 0,
                type: "task",
                parent: "iu-1",
                dependencies: ["iu-5"],
                resources: ["Performance Team", "QA Engineers"],
                color: "#4CAF50",
                initiativeId: initiative2.id
            },
            {
                id: "iu-7",
                name: "Monitoring Setup",
                startDate: new Date("2025-09-01"),
                endDate: new Date("2025-09-15"),
                duration: 15,
                progress: 0,
                type: "task",
                parent: "iu-1",
                dependencies: ["iu-6"],
                resources: ["DevOps", "SRE Team"],
                color: "#009688",
                initiativeId: initiative2.id
            },
            {
                id: "iu-8",
                name: "Documentation",
                startDate: new Date("2025-09-16"),
                endDate: new Date("2025-09-30"),
                duration: 15,
                progress: 0,
                type: "task",
                parent: "iu-1",
                dependencies: ["iu-7"],
                resources: ["Technical Writers", "DevOps"],
                color: "#00BCD4",
                initiativeId: initiative2.id
            },
            
            // Initiative 3: Team Expansion
            {
                id: "te-1",
                name: "Team Expansion",
                startDate: new Date("2025-06-01"),
                endDate: new Date("2025-11-30"),
                duration: 183,
                progress: 35,
                type: "summary",
                parent: null,
                dependencies: [],
                resources: ["HR Team"],
                color: "#3F51B5",
                isProject: true,
                initiativeId: initiative3.id
            },
            {
                id: "te-2",
                name: "Hiring Planning",
                startDate: new Date("2025-06-01"),
                endDate: new Date("2025-06-15"),
                duration: 15,
                progress: 100,
                type: "task",
                parent: "te-1",
                dependencies: [],
                resources: ["HR Team", "Department Heads"],
                color: "#2196F3",
                initiativeId: initiative3.id
            },
            {
                id: "te-3",
                name: "Job Postings",
                startDate: new Date("2025-06-16"),
                endDate: new Date("2025-07-15"),
                duration: 30,
                progress: 80,
                type: "task",
                parent: "te-1",
                dependencies: ["te-2"],
                resources: ["HR Team", "Recruiting"],
                color: "#03A9F4",
                initiativeId: initiative3.id
            },
            {
                id: "te-4",
                name: "Interview Process",
                startDate: new Date("2025-07-01"),
                endDate: new Date("2025-08-31"),
                duration: 62,
                progress: 45,
                type: "task",
                parent: "te-1",
                dependencies: ["te-3"],
                resources: ["Hiring Managers", "Technical Interviewers"],
                color: "#00BCD4",
                initiativeId: initiative3.id
            },
            {
                id: "te-5",
                name: "Onboarding Program",
                startDate: new Date("2025-09-01"),
                endDate: new Date("2025-09-30"),
                duration: 30,
                progress: 0,
                type: "task",
                parent: "te-1",
                dependencies: ["te-4"],
                resources: ["HR Team", "Team Leads"],
                color: "#009688",
                initiativeId: initiative3.id
            },
            {
                id: "te-6",
                name: "Training Sessions",
                startDate: new Date("2025-10-01"),
                endDate: new Date("2025-10-31"),
                duration: 31,
                progress: 0,
                type: "task",
                parent: "te-1",
                dependencies: ["te-5"],
                resources: ["Training Team", "Senior Engineers"],
                color: "#4CAF50",
                initiativeId: initiative3.id
            },
            {
                id: "te-7",
                name: "Team Integration",
                startDate: new Date("2025-11-01"),
                endDate: new Date("2025-11-30"),
                duration: 30,
                progress: 0,
                type: "task",
                parent: "te-1",
                dependencies: ["te-6"],
                resources: ["Team Leads", "Mentors"],
                color: "#8BC34A",
                initiativeId: initiative3.id
            },
            
            // Initiative 4: Year-End Planning
            {
                id: "ye-1",
                name: "Year-End Planning",
                startDate: new Date("2025-10-01"),
                endDate: new Date("2025-12-31"),
                duration: 92,
                progress: 0,
                type: "summary",
                parent: null,
                dependencies: [],
                resources: ["Executive Team"],
                color: "#795548",
                isProject: true,
                initiativeId: initiative4.id
            },
            {
                id: "ye-2",
                name: "Budget Review",
                startDate: new Date("2025-10-01"),
                endDate: new Date("2025-10-15"),
                duration: 15,
                progress: 0,
                type: "task",
                parent: "ye-1",
                dependencies: [],
                resources: ["Finance Team", "Department Heads"],
                color: "#9E9E9E",
                initiativeId: initiative4.id
            },
            {
                id: "ye-3",
                name: "Strategic Planning",
                startDate: new Date("2025-10-16"),
                endDate: new Date("2025-10-31"),
                duration: 16,
                progress: 0,
                type: "task",
                parent: "ye-1",
                dependencies: ["ye-2"],
                resources: ["Executive Team", "Strategy Consultants"],
                color: "#607D8B",
                initiativeId: initiative4.id
            },
            {
                id: "ye-4",
                name: "Department Reviews",
                startDate: new Date("2025-11-01"),
                endDate: new Date("2025-11-15"),
                duration: 15,
                progress: 0,
                type: "task",
                parent: "ye-1",
                dependencies: ["ye-3"],
                resources: ["Department Heads", "HR Team"],
                color: "#455A64",
                initiativeId: initiative4.id
            },
            {
                id: "ye-5",
                name: "2026 Roadmap",
                startDate: new Date("2025-11-16"),
                endDate: new Date("2025-11-30"),
                duration: 15,
                progress: 0,
                type: "task",
                parent: "ye-1",
                dependencies: ["ye-4"],
                resources: ["Product Team", "Engineering Leads"],
                color: "#37474F",
                initiativeId: initiative4.id
            },
            {
                id: "ye-6",
                name: "Holiday Schedule",
                startDate: new Date("2025-12-01"),
                endDate: new Date("2025-12-15"),
                duration: 15,
                progress: 0,
                type: "task",
                parent: "ye-1",
                dependencies: [],
                resources: ["HR Team", "Operations"],
                color: "#263238",
                initiativeId: initiative4.id
            },
            {
                id: "ye-7",
                name: "Year-End Celebration",
                startDate: new Date("2025-12-20"),
                endDate: new Date("2025-12-20"),
                duration: 0,
                progress: 0,
                type: "milestone",
                parent: "ye-1",
                dependencies: ["ye-5", "ye-6"],
                resources: ["Event Planning", "All Teams"],
                color: "#B71C1C",
                initiativeId: initiative4.id
            }
        ];
        
        // Ensure all tasks have proper initiative assignments
        this.ensureTaskInitiativeAssignments();
    }
    
    ensureTaskInitiativeAssignments() {
        // Ensure we have at least one initiative
        if (this.initiatives.length === 0) {
            const defaultInitiative = {
                id: 'default-initiative',
                name: 'Default Project',
                description: 'Default initiative for all tasks',
                createdAt: new Date().toISOString(),
                projects: []
            };
            this.initiatives = [defaultInitiative];
            this.currentInitiativeId = defaultInitiative.id;
        }
        
        // Get the default initiative ID
        const defaultInitiativeId = this.currentInitiativeId || this.initiatives[0].id;
        
        // Assign initiative IDs to tasks that don't have them
        this.tasks.forEach(task => {
            if (!task.initiativeId) {
                task.initiativeId = defaultInitiativeId;
            }
        });
    }
    
    initializeEventListeners() {
        // Toolbar events
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('expandAllBtn').addEventListener('click', () => this.expandAll());
        document.getElementById('collapseAllBtn').addEventListener('click', () => this.collapseAll());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());
        
        // Initiative events
        document.getElementById('newInitiativeBtn').addEventListener('click', () => this.showInitiativeModal());
        document.getElementById('initiativeSelector').addEventListener('change', (e) => this.switchInitiative(e.target.value));
        
        // Zoom controls
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setZoom(e.target.dataset.zoom));
        });
        
        // Modal events
        document.getElementById('modalClose').addEventListener('click', () => this.hideTaskModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.hideTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.saveTask(e));
        document.getElementById('modalDelete').addEventListener('click', () => this.deleteTask());
        
        // Initiative modal events
        document.getElementById('initiativeModalClose').addEventListener('click', () => this.hideInitiativeModal());
        document.getElementById('initiativeModalCancel').addEventListener('click', () => this.hideInitiativeModal());
        document.getElementById('initiativeForm').addEventListener('submit', (e) => this.saveInitiative(e));
        document.getElementById('initiativeModalDelete').addEventListener('click', () => this.deleteInitiative());
        
        // Close modal on overlay click
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideTaskModal();
        });
        
        document.getElementById('initiativeModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.hideInitiativeModal();
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

        // ---- START: Add this new code for scroll synchronization ----
        const taskListBody = document.getElementById('taskListBody');

        let isSyncingScroll = false;

        taskListBody.addEventListener('scroll', () => {
            if (!isSyncingScroll) {
                isSyncingScroll = true;
                timelineBody.scrollTop = taskListBody.scrollTop;
                isSyncingScroll = false;
            }
        });

        timelineBody.addEventListener('scroll', () => {
            if (!isSyncingScroll) {
                isSyncingScroll = true;
                taskListBody.scrollTop = timelineBody.scrollTop;
                isSyncingScroll = false;
            }
        });
        // ---- END: Add this new code ----
        
        // Initialize resize functionality
        this.initializeResize();
    }
    
    render() {
        this.renderInitiativeSelector();
        this.renderTaskList();
        this.renderTimeline();
        this.renderTimelineHeader();
        this.renderTimelineBars();
        this.renderTodayLine();
    }
    
    renderInitiativeSelector() {
        const selector = document.getElementById('initiativeSelector');
        selector.innerHTML = '';
        
        // Ensure we have initiatives and a current initiative selected
        if (this.initiatives.length === 0) {
            const defaultInitiative = {
                id: 'default-initiative',
                name: 'Default Project',
                description: 'Default initiative for all tasks',
                createdAt: new Date().toISOString(),
                projects: []
            };
            this.initiatives = [defaultInitiative];
            this.currentInitiativeId = defaultInitiative.id;
        }
        
        // Ensure current initiative is valid
        if (!this.currentInitiativeId || !this.initiatives.find(i => i.id === this.currentInitiativeId)) {
            this.currentInitiativeId = this.initiatives[0].id;
        }
        
        this.initiatives.forEach(initiative => {
            const option = document.createElement('option');
            option.value = initiative.id;
            option.textContent = initiative.name;
            option.selected = initiative.id === this.currentInitiativeId;
            selector.appendChild(option);
        });
        
        // Update the selector value to ensure it shows the current initiative
        selector.value = this.currentInitiativeId;
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
        
        // Ensure we have a valid current initiative
        if (!this.currentInitiativeId && this.initiatives.length > 0) {
            this.currentInitiativeId = this.initiatives[0].id;
        }
        
        // Filter tasks by current initiative with fallback
        const initiativeTasks = this.tasks.filter(task => {
            // FALLBACK: If no initiatives exist or no current initiative, show all tasks
            if (!this.currentInitiativeId || this.initiatives.length === 0) {
                return true;
            }
            
            // Direct initiative match
            if (task.initiativeId === this.currentInitiativeId) {
                return true;
            }
            
            // Check inherited initiative from parent
            const inheritedInitiative = this.getTaskInitiative(task);
            if (inheritedInitiative === this.currentInitiativeId) {
                return true;
            }
            
            // FALLBACK: If task has no initiative ID, include it to avoid hiding orphaned tasks
            if (!task.initiativeId) {
                return true;
            }
            
            return false;
        });
        
        const rootTasks = initiativeTasks.filter(task => !task.parent);
        
        const addTaskAndChildren = (task, level = 0) => {
            result.push({ ...task, level });
            
            if (!this.collapsedTasks.has(task.id)) {
                const children = initiativeTasks.filter(t => t.parent === task.id);
                children.forEach(child => addTaskAndChildren(child, level + 1));
            }
        };
        
        rootTasks.forEach(task => addTaskAndChildren(task));
        
        return result;
    }
    
    getTaskInitiative(task) {
        if (task.initiativeId) return task.initiativeId;
        
        // Find parent's initiative
        let currentTask = task;
        while (currentTask.parent) {
            const parent = this.tasks.find(t => t.id === currentTask.parent);
            if (!parent) break;
            if (parent.initiativeId) return parent.initiativeId;
            currentTask = parent;
        }
        return null;
    }
    
    createTaskRow(task, index) {
        const row = document.createElement('div');
        row.className = `task-row ${task.type}`;
        row.dataset.taskId = task.id;
        row.style.paddingLeft = `${task.level * 20 + 8}px`;
        row.style.height = `${this.rowHeight}px`;
        row.style.minHeight = `${this.rowHeight}px`;
        
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
            <span class="task-name-text">${task.name}${task.isProject ? ' (Project)' : ''}</span>
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
        
        // Add month row for day and week views
        if (this.currentZoom === 'day' || this.currentZoom === 'week') {
            const monthRow = document.createElement('div');
            monthRow.className = 'timeline-header-row timeline-month-row';
            
            const monthsData = this.getMonthsInRange();
            monthsData.forEach(monthData => {
                const monthCell = document.createElement('div');
                monthCell.className = 'timeline-header-month';
                monthCell.style.width = `${monthData.width}px`;
                monthCell.textContent = monthData.label;
                monthRow.appendChild(monthCell);
            });
            
            header.appendChild(monthRow);
            header.style.minHeight = '80px'; // Adjust height for two rows
        } else {
            header.style.minHeight = '48px'; // Single row height
        }
        
        // Regular header row (days/weeks/months)
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
        
        // Set the total width on the header rows to match timeline width
        const totalWidth = totalDays * this.dayWidth;
        headerRow.style.width = `${totalWidth}px`;
        headerRow.style.minWidth = `${totalWidth}px`;
        if (monthRow) {
            monthRow.style.width = `${totalWidth}px`;
            monthRow.style.minWidth = `${totalWidth}px`;
        }
    }
    
    getMonthsInRange() {
        const months = [];
        const current = new Date(this.timelineStart);
        current.setDate(1); // Start from the first day of the month
        
        while (current <= this.timelineEnd) {
            const monthStart = new Date(current);
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            
            // Calculate the visible start and end for this month
            const visibleStart = monthStart < this.timelineStart ? this.timelineStart : monthStart;
            const visibleEnd = monthEnd > this.timelineEnd ? this.timelineEnd : monthEnd;
            
            // Calculate the width based on visible days
            const visibleDays = Math.ceil((visibleEnd - visibleStart) / (1000 * 60 * 60 * 24)) + 1;
            const width = visibleDays * this.dayWidth;
            
            months.push({
                label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                width: width
            });
            
            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }
        
        return months;
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
                // Show day and month for better visibility
                if (date.getDate() === 1 || date.getDay() === 1) {
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
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
        
        // Debug logging
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
        
        // Set minimum width for scrolling on the grid and bars containers
        const timelineBody = document.getElementById('timelineBody');
        const timelineBars = document.getElementById('timelineBars');
        const totalWidth = `${totalDays * this.dayWidth}px`;
        
        // Set width on the inner containers to enable scrolling
        timelineGrid.style.width = totalWidth;
        timelineGrid.style.minWidth = totalWidth;
        timelineBars.style.width = totalWidth;
        timelineBars.style.minWidth = totalWidth;
    }
    
    renderTimelineBars() {
        const timelineBars = document.getElementById('timelineBars');
        const timelineBody = document.getElementById('timelineBody');
        timelineBars.innerHTML = '';
        
        const visibleTasks = this.getVisibleTasks();
        
        // Only log if there's an issue
        if (visibleTasks.length === 0) {
            console.warn('No visible tasks to render');
        }
        
        // Ensure timeline containers have proper dimensions
        const totalDays = Math.ceil((this.timelineEnd - this.timelineStart) / (1000 * 60 * 60 * 24));
        const totalWidth = `${totalDays * this.dayWidth}px`;
        
        // Force dimensions with minimum height to prevent zero-height container
        timelineBars.style.width = totalWidth;
        timelineBars.style.minWidth = totalWidth;
        timelineBars.style.position = 'relative';
        
        const calculatedHeight = Math.max(visibleTasks.length * this.rowHeight, 200); // Minimum 200px height
        timelineBars.style.height = `${calculatedHeight}px`;
        timelineBars.style.minHeight = `200px`;
        
        // Timeline dimensions set
        
        if (visibleTasks.length === 0) {
            // Still show the timeline grid even with no tasks
            return;
        }
        
        
        visibleTasks.forEach((task, index) => {
            const bar = this.createTimelineBar(task, index);
            if (bar) {
                timelineBars.appendChild(bar);
            }
        });
        
        // Force a layout recalculation
        timelineBody.offsetHeight;
        
        // Ensure timeline body has proper dimensions
        const timelineBodyRect = timelineBody.getBoundingClientRect();
        if (timelineBodyRect.height === 0) {
            timelineBody.style.minHeight = '300px';
        }
    }
    
    
    createTimelineBar(task, rowIndex) {
        const bar = document.createElement('div');
        bar.className = `timeline-bar ${task.type}`;
        bar.dataset.taskId = task.id;
        bar.style.backgroundColor = task.color;
        
        let startOffset = this.getDateOffset(task.startDate);
        const duration = task.type === 'milestone' ? 0 : Math.max(1, Math.ceil((task.endDate - task.startDate) / (1000 * 60 * 60 * 24)) + 1);
        const width = task.type === 'milestone' ? 16 : duration * this.dayWidth;
        
        // Validate bar positioning
        const timelineWidth = Math.ceil((this.timelineEnd - this.timelineStart) / (1000 * 60 * 60 * 24)) * this.dayWidth;
        
        // Only log issues, not every bar
        if (startOffset < -width || startOffset > timelineWidth) {
            console.warn(`Bar for task '${task.name}' is outside timeline range:`, {
                startOffset: startOffset,
                timelineWidth: timelineWidth,
                taskStart: task.startDate.toLocaleDateString(),
                taskEnd: task.endDate.toLocaleDateString()
            });
        }
        
        bar.style.left = `${startOffset}px`;
        bar.style.top = `${rowIndex * this.rowHeight + this.barHeightOffset}px`;
        bar.style.width = `${width}px`;
        bar.style.height = '32px';
        bar.style.position = 'absolute';
        
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
        
        // Re-render to update the task list and adjust timeline range
        this.updateTimelineBounds();
        this.render();
        this.autoSave();
    }
    
    renderDependencies() {
        const dependenciesContainer = document.getElementById('timelineDependencies');
        dependenciesContainer.innerHTML = '';
        
        // Set the container width to match timeline
        const totalDays = Math.ceil((this.timelineEnd - this.timelineStart) / (1000 * 60 * 60 * 24));
        const totalWidth = totalDays * this.dayWidth;
        dependenciesContainer.style.width = `${totalWidth}px`;
        dependenciesContainer.style.minWidth = `${totalWidth}px`;
        
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
        
        // Ensure today line is within the scrollable area
        const totalDays = Math.ceil((this.timelineEnd - this.timelineStart) / (1000 * 60 * 60 * 24));
        const totalWidth = totalDays * this.dayWidth;
        
        // If today is beyond the timeline bounds, hide it
        if (todayOffset < 0 || todayOffset > totalWidth) {
            todayLine.style.display = 'none';
        } else {
            todayLine.style.display = 'block';
        }
    }
    
    scrollToToday() {
        // Scroll the timeline to center on today's date
        setTimeout(() => {
            const timelineBody = document.getElementById('timelineBody');
            const todayOffset = this.getDateOffset(this.today);
            const viewportWidth = timelineBody.clientWidth;
            
            // Center today in the viewport
            const scrollPosition = todayOffset - (viewportWidth / 2);
            timelineBody.scrollLeft = Math.max(0, scrollPosition);
        }, 100); // Small delay to ensure rendering is complete
    }
    
    getDateOffset(date) {
        // Validate inputs
        if (!date || !this.timelineStart) {
            return 0;
        }
        
        // Ensure we're working with Date objects
        const inputDate = new Date(date);
        const startDate = new Date(this.timelineStart);
        
        // Validate that dates are valid
        if (isNaN(inputDate.getTime()) || isNaN(startDate.getTime())) {
            return 0;
        }
        
        const diffTime = inputDate - startDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const offset = diffDays * this.dayWidth;
        
        // Validate result
        if (!isFinite(offset)) {
            return 0;
        }
        
        return offset;
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
        
        // Auto-scroll to the selected task in the timeline
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                this.scrollToTask(task);
            }
        }
    }
    
    scrollToTask(task) {
        setTimeout(() => {
            const timelineBody = document.getElementById('timelineBody');
            
            if (!timelineBody) {
                return;
            }
            
            const taskStartOffset = this.getDateOffset(task.startDate);
            const taskEndOffset = this.getDateOffset(task.endDate);
            const taskCenterOffset = (taskStartOffset + taskEndOffset) / 2;
            const viewportWidth = timelineBody.clientWidth;
            
            // Center the task in the viewport
            const scrollPosition = taskCenterOffset - (viewportWidth / 2);
            const finalScrollPosition = Math.max(0, scrollPosition);
            
            // Smooth scroll to the position
            try {
                if (timelineBody.scrollWidth > timelineBody.clientWidth) {
                    timelineBody.scrollTo({
                        left: finalScrollPosition,
                        behavior: 'smooth'
                    });
                }
            } catch (error) {
                // Fallback to direct assignment
                timelineBody.scrollLeft = finalScrollPosition;
            }
        }, 100); // Small delay to ensure rendering is complete
    }
    
    fixTaskInitiatives() {
        let fixedCount = 0;
        
        this.tasks.forEach(task => {
            if (!task.initiativeId && this.currentInitiativeId) {
                task.initiativeId = this.currentInitiativeId;
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            this.autoSave();
        }
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
            
            // Associate all new tasks with current initiative
            newTask.initiativeId = this.currentInitiativeId;
            
            // If it's a top-level summary task, mark it as a project
            if (!newTask.parent && newTask.type === 'summary') {
                newTask.isProject = true;
            }
            
            this.tasks.push(newTask);
        }
        
        this.hideTaskModal();
        // Update timeline bounds in case task dates moved outside the current range
        this.updateTimelineBounds();
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
            // Adjust timeline in case removing this task shrinks the range
            this.updateTimelineBounds();
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
                    this.updateTimelineBounds();
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
        } else if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Press 't' to scroll to today
            this.scrollToToday();
            this.showNotification('Scrolled to today', 'info', 1000);
        } else if (e.key === 'ArrowLeft' && e.shiftKey) {
            // Shift+Left to scroll left by one month
            const timelineBody = document.getElementById('timelineBody');
            const scrollAmount = 30 * this.dayWidth; // Approximately one month
            timelineBody.scrollLeft = Math.max(0, timelineBody.scrollLeft - scrollAmount);
        } else if (e.key === 'ArrowRight' && e.shiftKey) {
            // Shift+Right to scroll right by one month
            const timelineBody = document.getElementById('timelineBody');
            const scrollAmount = 30 * this.dayWidth; // Approximately one month
            timelineBody.scrollLeft = Math.min(timelineBody.scrollWidth - timelineBody.clientWidth, timelineBody.scrollLeft + scrollAmount);
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
    
    exportData() {
        try {
            const dataToExport = {
                version: '1.1',
                exportDate: new Date().toISOString(),
                projectName: 'Gantt Chart Export',
                initiatives: this.initiatives,
                currentInitiativeId: this.currentInitiativeId,
                tasks: this.tasks.map(task => ({
                    ...task,
                    startDate: task.startDate.toISOString(),
                    endDate: task.endDate.toISOString()
                })),
                collapsedTasks: Array.from(this.collapsedTasks),
                currentZoom: this.currentZoom
            };
            
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gantt-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Failed to export data', 'error');
        }
    }
    
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.tasks || !Array.isArray(data.tasks)) {
                    throw new Error('Invalid data format');
                }
                
                // Check version and handle initiatives
                if (data.version === '1.0' || !data.initiatives) {
                    // Migrate old data to new format with initiatives
                    const defaultInitiative = {
                        id: 'init-' + Date.now(),
                        name: 'Imported Initiative',
                        description: 'Imported from file',
                        createdAt: new Date().toISOString(),
                        projects: []
                    };
                    this.initiatives = [defaultInitiative];
                    this.currentInitiativeId = defaultInitiative.id;
                    
                    // Add initiative ID to all top-level projects
                    data.tasks.forEach(task => {
                        if (!task.parent && task.type === 'summary') {
                            task.isProject = true;
                            task.initiativeId = defaultInitiative.id;
                        }
                    });
                } else {
                    // Import initiatives
                    this.initiatives = data.initiatives;
                    this.currentInitiativeId = data.currentInitiativeId || this.initiatives[0].id;
                }
                
                // Import tasks
                this.tasks = data.tasks.map(task => ({
                    ...task,
                    startDate: new Date(task.startDate),
                    endDate: new Date(task.endDate)
                }));
                
                // Import other settings
                this.collapsedTasks = new Set(data.collapsedTasks || []);
                if (data.currentZoom) {
                    this.currentZoom = data.currentZoom;
                }
                
                // Update timeline bounds and render
                this.updateTimelineBounds();
                this.render();
                this.autoSave();
                
                this.showNotification('Data imported successfully', 'success');
            } catch (error) {
                console.error('Import failed:', error);
                this.showNotification('Failed to import data. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }
    
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
    
    // Firestore persistence methods
    async saveToFirestore() {
        try {
            if (!this.firestoreEnabled || !this.db) {
                return false;
            }
            
            const dataToSave = {
                version: '1.1',
                lastSaved: new Date().toISOString(),
                initiatives: this.initiatives,
                currentInitiativeId: this.currentInitiativeId,
                tasks: this.tasks.map(task => ({
                    ...task,
                    startDate: task.startDate.toISOString(),
                    endDate: task.endDate.toISOString()
                })),
                collapsedTasks: Array.from(this.collapsedTasks),
                currentZoom: this.currentZoom,
                selectedTask: this.selectedTask
                // Don't save timeline bounds - they should be calculated fresh each time
            };
            
            await this.db.collection('gantt-projects').doc(this.projectId).set(dataToSave);
            return true;
        } catch (error) {
            console.error('Failed to save to Firestore:', error);
            return false;
        }
    }
    
    async loadFromFirestore() {
        try {
            if (!this.firestoreEnabled || !this.db) {
                return false;
            }
            
            const doc = await this.db.collection('gantt-projects').doc(this.projectId).get();
            
            if (!doc.exists) {
                return false;
            }
            
            const data = doc.data();
            
            // Check version and migrate if needed
            if (data.version === '1.0' || !data.initiatives) {
                // Migrate old data to new format with initiatives
                const defaultInitiative = {
                    id: 'init-' + Date.now(),
                    name: 'Default Initiative',
                    description: 'Migrated from previous version',
                    createdAt: new Date().toISOString(),
                    projects: []
                };
                this.initiatives = [defaultInitiative];
                this.currentInitiativeId = defaultInitiative.id;
                
                // Add initiative ID to all tasks
                data.tasks.forEach(task => {
                    task.initiativeId = defaultInitiative.id;
                    if (!task.parent && task.type === 'summary') {
                        task.isProject = true;
                    }
                });
            } else {
                // Load initiatives
                this.initiatives = data.initiatives || [];
                this.currentInitiativeId = data.currentInitiativeId || (this.initiatives[0] && this.initiatives[0].id);
            }
            
            // Restore tasks with proper date objects
            this.tasks = data.tasks.map(task => {
                const restoredTask = {
                    ...task,
                    startDate: new Date(task.startDate),
                    endDate: new Date(task.endDate),
                    // Ensure all tasks have an initiativeId
                    initiativeId: task.initiativeId || this.currentInitiativeId
                };
                
                // Fix any tasks that might have invalid initiative IDs
                const validInitiativeIds = this.initiatives.map(i => i.id);
                if (restoredTask.initiativeId && !validInitiativeIds.includes(restoredTask.initiativeId)) {
                    console.warn(`Task '${restoredTask.name}' has invalid initiative ID '${restoredTask.initiativeId}', reassigning to current initiative`);
                    restoredTask.initiativeId = this.currentInitiativeId;
                }
                
                return restoredTask;
            });
            
            // Restore other settings
            this.collapsedTasks = new Set(data.collapsedTasks || []);
            
            if (data.currentZoom) {
                this.currentZoom = data.currentZoom;
            }
            
            if (data.selectedTask) {
                this.selectedTask = data.selectedTask;
            }
            
            // Always update timeline bounds to ensure they include current date
            // Don't restore old bounds as they might be from previous years
            this.updateTimelineBounds();
            
            return true;
        } catch (error) {
            console.error('Failed to load from Firestore:', error);
            return false;
        }
    }
    
    // Local storage persistence methods (fallback)
    saveToLocalStorage() {
        try {
            const dataToSave = {
                version: '1.1',
                lastSaved: new Date().toISOString(),
                initiatives: this.initiatives,
                currentInitiativeId: this.currentInitiativeId,
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
            
            // Check version and migrate if needed
            if (data.version === '1.0' || !data.initiatives) {
                // Migrate old data to new format with initiatives
                const defaultInitiative = {
                    id: 'init-' + Date.now(),
                    name: 'Default Initiative',
                    description: 'Migrated from previous version',
                    createdAt: new Date().toISOString(),
                    projects: []
                };
                this.initiatives = [defaultInitiative];
                this.currentInitiativeId = defaultInitiative.id;
                
                // Add initiative ID to all tasks
                data.tasks.forEach(task => {
                    task.initiativeId = defaultInitiative.id;
                    if (!task.parent && task.type === 'summary') {
                        task.isProject = true;
                    }
                });
            } else {
                // Load initiatives
                this.initiatives = data.initiatives || [];
                this.currentInitiativeId = data.currentInitiativeId || (this.initiatives[0] && this.initiatives[0].id);
            }
            
            // Restore tasks with proper date objects
            this.tasks = data.tasks.map(task => {
                const restoredTask = {
                    ...task,
                    startDate: new Date(task.startDate),
                    endDate: new Date(task.endDate),
                    // Ensure all tasks have an initiativeId
                    initiativeId: task.initiativeId || this.currentInitiativeId
                };
                
                // Fix any tasks that might have invalid initiative IDs
                const validInitiativeIds = this.initiatives.map(i => i.id);
                if (restoredTask.initiativeId && !validInitiativeIds.includes(restoredTask.initiativeId)) {
                    console.warn(`Task '${restoredTask.name}' has invalid initiative ID '${restoredTask.initiativeId}', reassigning to current initiative`);
                    restoredTask.initiativeId = this.currentInitiativeId;
                }
                
                return restoredTask;
            });
            
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
            
            // Fix any tasks without initiative ID
            this.fixTaskInitiatives();
            
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
        this.saveTimeout = setTimeout(async () => {
            try {
                let saved = false;
                
                if (this.firestoreEnabled) {
                    saved = await this.saveToFirestore();
                }
                
                // Also save to localStorage as backup
                this.saveToLocalStorage();
                
                if (saved || !this.firestoreEnabled) {
                    this.showNotification('Changes saved', 'success', 1000);
                }
            } catch (error) {
                console.error('Auto-save failed:', error);
                this.showNotification('Auto-save failed', 'error', 2000);
            }
        }, 500);
    }
    
    updateTimelineBounds() {
        const today = new Date();
        
        // Default timeline bounds - 3 months before to 12 months after today
        let minDate = new Date(today);
        minDate.setMonth(minDate.getMonth() - 3);
        minDate.setDate(1);
        
        let maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 12);
        maxDate.setDate(new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0).getDate());
        
        // If we have tasks, expand the timeline to include ALL of them
        if (this.tasks.length > 0) {
            // Only consider tasks for the current initiative or all tasks if no initiative filter
            const relevantTasks = this.tasks.filter(task => {
                if (!this.currentInitiativeId) return true;
                return task.initiativeId === this.currentInitiativeId || 
                       this.getTaskInitiative(task) === this.currentInitiativeId ||
                       !task.initiativeId; // Include orphaned tasks
            });
            
            relevantTasks.forEach(task => {
                if (task.startDate && task.startDate < minDate) {
                    minDate = new Date(task.startDate);
                }
                if (task.endDate && task.endDate > maxDate) {
                    maxDate = new Date(task.endDate);
                }
            });
            
            // Add padding to task dates to ensure visibility
            minDate.setDate(minDate.getDate() - 14); // 2 weeks before
            maxDate.setDate(maxDate.getDate() + 60); // 2 months after
        }
        
        // Always ensure the timeline includes today with proper padding
        const todayWithPadding = new Date(today);
        todayWithPadding.setMonth(todayWithPadding.getMonth() - 2);
        if (minDate > todayWithPadding) {
            minDate = todayWithPadding;
        }
        
        const todayWithFuturePadding = new Date(today);
        todayWithFuturePadding.setMonth(todayWithFuturePadding.getMonth() + 6);
        if (maxDate < todayWithFuturePadding) {
            maxDate = todayWithFuturePadding;
        }
        
        // Ensure we're setting proper Date objects and they're valid
        this.timelineStart = new Date(minDate);
        this.timelineEnd = new Date(maxDate);
        
        // Validation check
        if (this.timelineStart >= this.timelineEnd) {
            this.timelineEnd = new Date(this.timelineStart);
            this.timelineEnd.setFullYear(this.timelineEnd.getFullYear() + 1);
        }
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
    
    debugInitiatives() {
        // Kept for debugging purposes but simplified
        const orphanedTasks = this.tasks.filter(task => {
            const validInitiativeIds = this.initiatives.map(i => i.id);
            return task.initiativeId && !validInitiativeIds.includes(task.initiativeId);
        });
        
        if (orphanedTasks.length > 0) {
            console.warn('Orphaned tasks (invalid initiative ID):', orphanedTasks);
        }
    }
    
    async clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            try {
                // Clear Firestore data
                if (this.firestoreEnabled && this.db) {
                    await this.db.collection('gantt-projects').doc(this.projectId).delete();
                }
                
                // Clear localStorage data
                localStorage.removeItem('ganttChartData');
                
                // Reset application state
                this.tasks = [];
                this.collapsedTasks.clear();
                this.selectedTask = null;
                this.initializeData();
                this.render();
                this.showNotification('All data cleared', 'info');
            } catch (error) {
                console.error('Failed to clear data:', error);
                this.showNotification('Failed to clear all data', 'error');
            }
        }
    }
    
    // Initiative methods
    showInitiativeModal(initiative = null) {
        this.editingInitiative = initiative;
        const modal = document.getElementById('initiativeModal');
        const form = document.getElementById('initiativeForm');
        const title = document.getElementById('initiativeModalTitle');
        const deleteBtn = document.getElementById('initiativeModalDelete');
        const saveBtn = document.getElementById('initiativeModalSave');
        
        title.textContent = initiative ? 'Edit Initiative' : 'Create New Initiative';
        saveBtn.textContent = initiative ? 'Update Initiative' : 'Create Initiative';
        deleteBtn.style.display = initiative && this.initiatives.length > 1 ? 'block' : 'none';
        
        if (initiative) {
            document.getElementById('initiativeName').value = initiative.name;
            document.getElementById('initiativeDescription').value = initiative.description || '';
        } else {
            form.reset();
        }
        
        modal.classList.add('active');
        
        setTimeout(() => {
            document.getElementById('initiativeName').focus();
        }, 100);
    }
    
    hideInitiativeModal() {
        document.getElementById('initiativeModal').classList.remove('active');
        this.editingInitiative = null;
    }
    
    saveInitiative(e) {
        e.preventDefault();
        
        const initiativeData = {
            name: document.getElementById('initiativeName').value.trim(),
            description: document.getElementById('initiativeDescription').value.trim()
        };
        
        if (!initiativeData.name) {
            alert('Please enter an initiative name');
            return;
        }
        
        if (this.editingInitiative) {
            // Update existing initiative
            const index = this.initiatives.findIndex(i => i.id === this.editingInitiative.id);
            if (index !== -1) {
                this.initiatives[index] = { ...this.initiatives[index], ...initiativeData };
            }
        } else {
            // Create new initiative
            const newInitiative = {
                id: 'init-' + Date.now(),
                createdAt: new Date().toISOString(),
                projects: [],
                ...initiativeData
            };
            this.initiatives.push(newInitiative);
            
            // Switch to the new initiative
            this.currentInitiativeId = newInitiative.id;
        }
        
        this.hideInitiativeModal();
        this.render();
        this.autoSave();
        this.showNotification('Initiative saved successfully', 'success');
    }
    
    deleteInitiative() {
        if (this.editingInitiative && this.initiatives.length > 1 && 
            confirm('Are you sure you want to delete this initiative? All associated projects and tasks will be removed.')) {
            
            // Remove initiative
            this.initiatives = this.initiatives.filter(i => i.id !== this.editingInitiative.id);
            
            // Remove all tasks associated with this initiative
            this.tasks = this.tasks.filter(task => 
                task.initiativeId !== this.editingInitiative.id && 
                this.getTaskInitiative(task) !== this.editingInitiative.id
            );
            
            // Switch to first available initiative
            if (this.currentInitiativeId === this.editingInitiative.id) {
                this.currentInitiativeId = this.initiatives[0].id;
            }
            
            this.hideInitiativeModal();
            this.render();
            this.autoSave();
            this.showNotification('Initiative deleted successfully', 'info');
        }
    }
    
    switchInitiative(initiativeId) {
        this.currentInitiativeId = initiativeId;
        this.render();
        this.autoSave();
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