/**
 * Storage Module
 * Handles interactions with browser localStorage.
 * Uses functional principles (pure functions without side effects outside its scope).
 */

const StorageHandler = (() => {
    // Save data safely to localStorage
    const save = (key, data) => {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(key, serializedData);
        } catch (error) {
            console.error("Error saving to localStorage", error);
        }
    };

    // Load data from localStorage with a fallback default value
    const load = (key, defaultValue) => {
        try {
            const serializedData = localStorage.getItem(key);
            if (serializedData === null) return defaultValue;
            return JSON.parse(serializedData);
        } catch (error) {
            console.error("Error loading from localStorage", error);
            return defaultValue;
        }
    };

    return { save, load };
})();