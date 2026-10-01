/**
 * Main Application Logic
 * Modular, DRY, and Functional architecture binding State, UI, Storage, and Timer.
 */

// --- 1. Initial State & Configuration ---
const STORAGE_KEY = 'deepFocusState';
const DEFAULT_STATE = {
    works: [], // { id, text, completed, completedAt, isSpoiler }
    thoughts: [], // { id, text, isSpoiler }
    trash: [], // { id, text, origin, deletedAt, completed, completedAt, isSpoiler }
    stats: { pomodorosCompleted: 0, lastDate: new Date().toDateString() },
    timerSettings: { workTime: 25, restTime: 5 },
    spoilerAll: { works: false, thoughts: false }
};

let appState = StorageHandler.load(STORAGE_KEY, DEFAULT_STATE);

// Backward-compatible state normalization
if (!Array.isArray(appState.works)) appState.works = [];
if (!Array.isArray(appState.thoughts)) appState.thoughts = [];
if (!Array.isArray(appState.trash)) appState.trash = [];
if (!appState.spoilerAll) appState.spoilerAll = { works: false, thoughts: false };

// Timer operational state
let currentTimer = {
    mode: 'work',
    timeLeft: appState.timerSettings.workTime * 60,
    totalTime: appState.timerSettings.workTime * 60,
    isRunning: false
};

// Drag & Drop transient state
let dragState = {
    groupKey: null,
    draggedId: null
};

// --- 2. DOM Elements & Modular Collection Rules ---
const DOM = {
    body: document.body,
    timeDisplay: document.getElementById('time-display'),
    modeDisplay: document.getElementById('mode-display'),
    dateShamsi: document.getElementById('date-shamsi'),
    dateGregorian: document.getElementById('date-gregorian'),
    timerCircle: document.getElementById('timer-circle'),
    btnToggle: document.getElementById('btn-toggle'),
    btnExportReport: document.getElementById('btn-export-report'),
    btnReset: document.getElementById('btn-reset'),
    statsCount: document.getElementById('stats-count'),
    inputWorkTime: document.getElementById('input-work-time'),
    inputRestTime: document.getElementById('input-rest-time'),
    spoilerGroupBtns: document.querySelectorAll('[data-spoiler-group]'),

    // Recycle Bin DOM Elements
    btnOpenTrash: document.getElementById('btn-open-trash'),
    btnCloseTrash: document.getElementById('btn-close-trash'),
    btnEmptyTrash: document.getElementById('btn-empty-trash'),
    trashModal: document.getElementById('trash-modal'),
    trashList: document.getElementById('trash-list'),
    trashCount: document.getElementById('trash-count'),
    
    // Collection-specific DOM references and rules mapped by collection key
    collections: {
        works: {
            listEl: document.getElementById('works-list'),
            formEl: document.getElementById('work-form'),
            inputEl: document.getElementById('work-input'),
            hasCheckbox: true,
            canConvert: false,
            isSortable: true,
            autoSortCompleted: true
        },
        thoughts: {
            listEl: document.getElementById('thoughts-list'),
            formEl: document.getElementById('thought-form'),
            inputEl: document.getElementById('thought-input'),
            hasCheckbox: false,
            canConvert: true,
            isSortable: true,
            autoSortCompleted: false
        }
    }
};

// --- 3. Pure Functional Helpers (DRY State Transformers) ---

const createId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// Pure function to format a Date object into Persian (Shamsi) and Gregorian strings
const getFormattedDates = (date = new Date()) => {
    const shamsi = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);

    const gregorian = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date);

    return { shamsi, gregorian };
};

// Toggle a boolean property on a specific item in any array immutably
const toggleItemProp = (list, id, prop) =>
    list.map(item => (item.id === id ? { ...item, [prop]: !item[prop] } : item));

// Toggle completion state and record exact completion timestamp immutably
const toggleTaskCompletion = (list, id) =>
    list.map(item => {
        if (item.id !== id) return item;
        const nextCompleted = !item.completed;
        return {
            ...item,
            completed: nextCompleted,
            completedAt: nextCompleted ? Date.now() : null
        };
    });

// Pure sorting rule: Undone tasks on top, earliest completed at the very bottom
const sortByCompletionRule = (list) =>
    [...list].sort((a, b) => {
        const aDone = Boolean(a.completed);
        const bDone = Boolean(b.completed);

        if (aDone !== bDone) {
            return aDone ? 1 : -1;
        }
        if (aDone && bDone) {
            return (b.completedAt || 0) - (a.completedAt || 0);
        }
        return 0;
    });

// Apply collection-specific sorting rules if enabled
const applyCollectionRules = (groupKey, list) => {
    const config = DOM.collections[groupKey];
    return config && config.autoSortCompleted ? sortByCompletionRule(list) : list;
};

// Set a property to a specific value across all items in any array immutably
const setAllItemsProp = (list, prop, value) =>
    list.map(item => ({ ...item, [prop]: value }));

// Remove an item by ID from any array immutably
const removeItemById = (list, id) =>
    list.filter(item => item.id !== id);

// Pure helper to archive an item from a source collection into the trash list
const archiveItemToTrash = (sourceList, trashList, groupKey, id) => {
    const item = sourceList.find(i => i.id === id);
    if (!item) return { nextSource: sourceList, nextTrash: trashList };

    const archivedEntry = {
        ...item,
        origin: groupKey,
        deletedAt: Date.now()
    };

    return {
        nextSource: removeItemById(sourceList, id),
        nextTrash: [archivedEntry, ...trashList]
    };
};

// Pure function to reorder an array immutably by moving draggedId before or after targetId
const reorderListById = (list, draggedId, targetId, insertAfter = false) => {
    if (draggedId === targetId) return list;
    const draggedIndex = list.findIndex(item => item.id === draggedId);
    const targetIndex = list.findIndex(item => item.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return list;

    const updated = [...list];
    const [movedItem] = updated.splice(draggedIndex, 1);
    const newTargetIndex = updated.findIndex(item => item.id === targetId);
    const insertionIndex = insertAfter ? newTargetIndex + 1 : newTargetIndex;

    updated.splice(insertionIndex, 0, movedItem);
    return updated;
};

// Determine if an item should be blurred based on individual or group spoiler state
const isItemBlurred = (item, groupSpoilerActive) =>
    Boolean(item.isSpoiler || groupSpoilerActive);

// Save state to LocalStorage
const persistState = () => StorageHandler.save(STORAGE_KEY, appState);

// --- 4. Timer, Dates & Stats Logic ---

const renderDates = () => {
    const { shamsi, gregorian } = getFormattedDates();
    if (DOM.dateShamsi) DOM.dateShamsi.textContent = shamsi;
    if (DOM.dateGregorian) DOM.dateGregorian.textContent = gregorian;
};

const checkDailyStats = () => {
    const today = new Date().toDateString();
    if (appState.stats.lastDate !== today) {
        appState.stats.pomodorosCompleted = 0;
        appState.stats.lastDate = today;
        persistState();
    }
    DOM.statsCount.textContent = appState.stats.pomodorosCompleted;
    renderDates();
};

const updateTimerUI = () => {
    DOM.timeDisplay.textContent = TimerEngine.formatTime(currentTimer.timeLeft);
    const degrees = TimerEngine.calculateProgress(currentTimer.timeLeft, currentTimer.totalTime);
    const color = currentTimer.mode === 'work' ? 'var(--accent-blue)' : 'var(--accent-purple)';
    
    DOM.timerCircle.style.background = `conic-gradient(${color} ${degrees}deg, rgba(255,255,255,0.05) ${degrees}deg)`;
    DOM.modeDisplay.textContent = currentTimer.mode === 'work' ? 'Work Mode' : 'Rest Mode';
    DOM.btnToggle.textContent = currentTimer.isRunning ? 'Pause' : 'Start';
    DOM.body.classList.toggle('rest-mode', currentTimer.mode === 'rest');
};

const handleTick = () => {
    currentTimer.timeLeft -= 1;
    updateTimerUI();
    return currentTimer.timeLeft <= 0;
};

const handleTimerEnd = () => {
    currentTimer.isRunning = false;
    if (currentTimer.mode === 'work') {
        appState.stats.pomodorosCompleted += 1;
        persistState();
        checkDailyStats();
        currentTimer.mode = 'rest';
        currentTimer.totalTime = appState.timerSettings.restTime * 60;
    } else {
        currentTimer.mode = 'work';
        currentTimer.totalTime = appState.timerSettings.workTime * 60;
    }
    currentTimer.timeLeft = currentTimer.totalTime;
    updateTimerUI();
};

// --- 5. Drag & Drop Event Handlers ---

const attachDragEvents = (li, groupKey, itemId) => {
    li.setAttribute('draggable', 'true');
    li.dataset.id = itemId;

    li.addEventListener('dragstart', (e) => {
        dragState = { groupKey, draggedId: itemId };
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => li.classList.add('dragging'), 0);
    });

    li.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (dragState.groupKey !== groupKey || dragState.draggedId === itemId) return;

        const rect = li.getBoundingClientRect();
        const isAfter = (e.clientY - rect.top) > (rect.height / 2);

        li.classList.toggle('drag-over-bottom', isAfter);
        li.classList.toggle('drag-over-top', !isAfter);
    });

    li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('drag-over-top', 'drag-over-bottom');
        if (dragState.groupKey !== groupKey || dragState.draggedId === itemId) return;

        const rect = li.getBoundingClientRect();
        const insertAfter = (e.clientY - rect.top) > (rect.height / 2);

        const reordered = reorderListById(appState[groupKey], dragState.draggedId, itemId, insertAfter);
        appState[groupKey] = applyCollectionRules(groupKey, reordered);
        persistState();
        renderCollection(groupKey);
    });

    li.addEventListener('dragend', () => {
        li.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
        dragState = { groupKey: null, draggedId: null };
    });
};

// --- 6. Unified Collection & Trash Renderers ---

const updateGroupSpoilerBtnUI = (groupKey) => {
    const btn = document.querySelector(`[data-spoiler-group="${groupKey}"]`);
    if (!btn) return;
    const isActive = Boolean(appState.spoilerAll[groupKey]);
    btn.classList.toggle('active', isActive);
    btn.textContent = isActive ? '👾 Unspoiler All' : '👁️ Spoiler All';
};

const renderCollection = (groupKey) => {
    const config = DOM.collections[groupKey];
    appState[groupKey] = applyCollectionRules(groupKey, appState[groupKey]);
    const items = appState[groupKey];
    const groupSpoilerActive = appState.spoilerAll[groupKey];

    config.listEl.innerHTML = '';
    updateGroupSpoilerBtnUI(groupKey);

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = `list-item ${item.completed ? 'completed' : ''}`;

        const blurred = isItemBlurred(item, groupSpoilerActive);
        const textHtml = `<span class="task-text ${blurred ? 'spoiler-text' : ''}">${item.text}</span>`;
        const dragHandleHtml = config.isSortable
            ? `<span class="drag-handle" title="Drag to reorder priority">⠿</span>`
            : '';

        const innerContentHtml = config.hasCheckbox
            ? `<label class="checkbox-container">
                   <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="dispatchItemAction('${groupKey}', 'toggleComplete', '${item.id}')">
                   ${textHtml}
               </label>`
            : textHtml;

        const leftSectionHtml = `<div class="item-left">${dragHandleHtml}${innerContentHtml}</div>`;

        const convertBtnHtml = config.canConvert
            ? `<button class="action-btn convert-btn" onclick="dispatchItemAction('${groupKey}', 'convert', '${item.id}')" title="Move to Works">↗</button>`
            : '';

        li.innerHTML = `
            ${leftSectionHtml}
            <div class="item-actions">
                <button class="action-btn spoiler-btn ${blurred ? 'active' : ''}" onclick="dispatchItemAction('${groupKey}', 'toggleSpoiler', '${item.id}')" title="Toggle Spoiler">
                    ${blurred ? '👾' : '👁️'}
                </button>
                ${convertBtnHtml}
                <button class="action-btn delete-btn" onclick="dispatchItemAction('${groupKey}', 'delete', '${item.id}')" title="Move to Recycle Bin">×</button>
            </div>
        `;

        if (config.isSortable) {
            attachDragEvents(li, groupKey, item.id);
        }

        config.listEl.appendChild(li);
    });
};

// Render Recycle Bin Modal List & Counter Badge
const renderTrash = () => {
    if (DOM.trashCount) DOM.trashCount.textContent = appState.trash.length;
    if (!DOM.trashList) return;

    DOM.trashList.innerHTML = '';

    if (appState.trash.length === 0) {
        DOM.trashList.innerHTML = `<li class="empty-state">Recycle bin is empty.</li>`;
        return;
    }

    appState.trash.forEach(item => {
        const li = document.createElement('li');
        li.className = `list-item ${item.completed ? 'completed' : ''}`;
        const originLabel = item.origin === 'works' ? 'Work' : 'Thought';
        const blurred = Boolean(item.isSpoiler);

        li.innerHTML = `
            <div class="item-left">
                <span class="origin-badge origin-${item.origin}">${originLabel}</span>
                <span class="task-text ${blurred ? 'spoiler-text' : ''}">${item.text}</span>
            </div>
            <div class="item-actions">
                <button class="action-btn restore-btn" onclick="dispatchTrashAction('restore', '${item.id}')" title="Restore to ${originLabel}s">↩</button>
                <button class="action-btn delete-btn" onclick="dispatchTrashAction('permanentDelete', '${item.id}')" title="Delete Permanently">×</button>
            </div>
        `;
        DOM.trashList.appendChild(li);
    });
};

const renderAllCollections = () => {
    Object.keys(DOM.collections).forEach(renderCollection);
    renderTrash();
};

// --- 7. Unified Action Dispatchers ---

window.dispatchItemAction = (groupKey, action, id) => {
    switch (action) {
        case 'toggleComplete':
            const toggled = toggleTaskCompletion(appState[groupKey], id);
            appState[groupKey] = applyCollectionRules(groupKey, toggled);
            break;

        case 'toggleSpoiler':
            appState[groupKey] = toggleItemProp(appState[groupKey], id, 'isSpoiler');
            if (appState.spoilerAll[groupKey]) {
                appState.spoilerAll[groupKey] = false;
            }
            break;

        case 'delete':
            // Soft delete: Move item from active collection into Recycle Bin
            const { nextSource, nextTrash } = archiveItemToTrash(appState[groupKey], appState.trash, groupKey, id);
            appState[groupKey] = nextSource;
            appState.trash = nextTrash;
            renderTrash();
            break;

        case 'convert':
            const itemToMove = appState[groupKey].find(i => i.id === id);
            if (itemToMove) {
                const updatedWorks = [
                    ...appState.works,
                    {
                        id: createId(),
                        text: itemToMove.text,
                        completed: false,
                        completedAt: null,
                        isSpoiler: Boolean(itemToMove.isSpoiler || appState.spoilerAll.works)
                    }
                ];
                appState.works = applyCollectionRules('works', updatedWorks);
                appState[groupKey] = removeItemById(appState[groupKey], id);
                renderCollection('works');
            }
            break;
    }

    persistState();
    renderCollection(groupKey);
};

// Handle Recycle Bin Actions (Restore, Permanent Delete, Empty All)
window.dispatchTrashAction = (action, id = null) => {
    switch (action) {
        case 'restore':
            const itemToRestore = appState.trash.find(i => i.id === id);
            if (itemToRestore) {
                const targetGroup = DOM.collections[itemToRestore.origin] ? itemToRestore.origin : 'works';
                const { origin, deletedAt, ...cleanItem } = itemToRestore;
                appState[targetGroup] = applyCollectionRules(targetGroup, [...appState[targetGroup], cleanItem]);
                appState.trash = removeItemById(appState.trash, id);
                renderCollection(targetGroup);
            }
            break;

        case 'permanentDelete':
            appState.trash = removeItemById(appState.trash, id);
            break;

        case 'emptyAll':
            appState.trash = [];
            break;
    }

    persistState();
    renderTrash();
};

const toggleGroupSpoiler = (groupKey) => {
    const nextState = !appState.spoilerAll[groupKey];
    appState.spoilerAll[groupKey] = nextState;
    appState[groupKey] = setAllItemsProp(appState[groupKey], 'isSpoiler', nextState);
    persistState();
    renderCollection(groupKey);
};

const handleAddItem = (groupKey, e) => {
    e.preventDefault();
    const { inputEl, hasCheckbox } = DOM.collections[groupKey];
    const text = inputEl.value.trim();
    if (!text) return;

    const newItem = {
        id: createId(),
        text,
        isSpoiler: Boolean(appState.spoilerAll[groupKey]),
        ...(hasCheckbox ? { completed: false, completedAt: null } : {})
    };

    const updatedList = [...appState[groupKey], newItem];
    appState[groupKey] = applyCollectionRules(groupKey, updatedList);
    inputEl.value = '';
    persistState();
    renderCollection(groupKey);
};

// --- 8. Event Listeners Initialization ---

const setupEvents = () => {
    DOM.spoilerGroupBtns.forEach(btn => {
        const groupKey = btn.dataset.spoilerGroup;
        btn.addEventListener('click', () => toggleGroupSpoiler(groupKey));
    });

    Object.keys(DOM.collections).forEach(groupKey => {
        DOM.collections[groupKey].formEl.addEventListener('submit', (e) => handleAddItem(groupKey, e));
    });

    // Recycle Bin Modal Events
    if (DOM.btnOpenTrash) {
        DOM.btnOpenTrash.addEventListener('click', () => DOM.trashModal.classList.remove('hidden'));
    }
    if (DOM.btnCloseTrash) {
        DOM.btnCloseTrash.addEventListener('click', () => DOM.trashModal.classList.add('hidden'));
    }
    if (DOM.btnEmptyTrash) {
        DOM.btnEmptyTrash.addEventListener('click', () => window.dispatchTrashAction('emptyAll'));
    }
    if (DOM.trashModal) {
        DOM.trashModal.addEventListener('click', (e) => {
            if (e.target === DOM.trashModal) DOM.trashModal.classList.add('hidden');
        });
    }

    // Timer Controls
    DOM.btnToggle.addEventListener('click', () => {
        currentTimer.isRunning = !currentTimer.isRunning;
        if (currentTimer.isRunning) {
            TimerEngine.start(handleTick, handleTimerEnd);
        } else {
            TimerEngine.stop();
        }
        updateTimerUI();
    });

    DOM.btnReset.addEventListener('click', () => {
        TimerEngine.stop();
        currentTimer.isRunning = false;
        currentTimer.mode = 'work';
        currentTimer.totalTime = appState.timerSettings.workTime * 60;
        currentTimer.timeLeft = currentTimer.totalTime;
        updateTimerUI();
    });

    const bindTimeInput = (inputEl, settingKey, targetMode) => {
        inputEl.value = appState.timerSettings[settingKey];
        inputEl.addEventListener('change', (e) => {
            const val = Math.max(1, parseInt(e.target.value) || DEFAULT_STATE.timerSettings[settingKey]);
            appState.timerSettings[settingKey] = val;
            if (currentTimer.mode === targetMode && !currentTimer.isRunning) {
                currentTimer.totalTime = val * 60;
                currentTimer.timeLeft = val * 60;
                updateTimerUI();
            }
            persistState();
        });
    };
    // Export Daily Report Image (PNG)
    if (DOM.btnExportReport) {
        DOM.btnExportReport.addEventListener('click', () => {
            ReportExporter.exportDailyReport({
                works: appState.works,
                stats: appState.stats,
                dates: getFormattedDates(),
                spoilerAllWorks: appState.spoilerAll.works
            });
        });
    }

    bindTimeInput(DOM.inputWorkTime, 'workTime', 'work');
    bindTimeInput(DOM.inputRestTime, 'restTime', 'rest');
};

// --- 9. Initialization ---
const initApp = () => {
    checkDailyStats();
    setupEvents();
    renderAllCollections();
    updateTimerUI();
};

initApp();