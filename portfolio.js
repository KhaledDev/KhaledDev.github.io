/**
 * Portfolio Expandable Projects Manager
 * Handles expand/collapse functionality for project items
 */
class PortfolioManager {
    constructor() {
        this.expandableItems = [];
        this.init();
    }

    /**
     * Initialize the portfolio manager
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    /**
     * Set up all expandable functionality
     */
    setup() {
        this.findExpandableItems();
        this.attachEventListeners();
        this.setupAccessibility();
    }

    /**
     * Find all expandable project items in the DOM
     */
    findExpandableItems() {
        this.expandableItems = document.querySelectorAll('.expandable[data-expandable="true"]');
        console.log(`Found ${this.expandableItems.length} expandable project items`);
    }

    /**
     * Attach event listeners to expandable items
     */
    attachEventListeners() {
        // Add click listeners to expand buttons
        this.expandableItems.forEach(item => {
            const expandBtn = item.querySelector('.expand-btn');
            
            if (expandBtn) {
                expandBtn.addEventListener('click', (e) => this.handleExpandClick(e, item));
            }
        });

        // Close expanded items when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    /**
     * Set up accessibility attributes
     */
    setupAccessibility() {
        this.expandableItems.forEach(item => {
            const expandBtn = item.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.setAttribute('aria-expanded', 'false');
                expandBtn.setAttribute('tabindex', '0');
            }
        });
    }

    /**
     * Handle expand button click
     * @param {Event} e - Click event
     * @param {Element} item - The expandable item
     */
    handleExpandClick(e, item) {
        e.preventDefault();
        e.stopPropagation();
        
        const wasExpanded = item.classList.contains('expanded');
        
        // Close all other expanded items first
        this.collapseAll();
        
        // Toggle current item if it wasn't expanded
        if (!wasExpanded) {
            this.expandItem(item);
        }
    }

    /**
     * Handle clicks outside expandable items
     * @param {Event} e - Click event
     */
    handleOutsideClick(e) {
        if (!e.target.closest('.expandable')) {
            this.collapseAll();
        }
    }

    /**
     * Handle keyboard navigation
     * @param {Event} e - Keydown event
     */
    handleKeydown(e) {
        // Handle Enter and Space keys on expand buttons
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('expand-btn')) {
            e.preventDefault();
            const item = e.target.closest('.expandable');
            if (item) {
                this.handleExpandClick(e, item);
            }
        }
        
        // Handle Escape key to close all expanded items
        if (e.key === 'Escape') {
            this.collapseAll();
        }
    }

    /**
     * Expand a specific item
     * @param {Element} item - The item to expand
     */
    expandItem(item) {
        const expandBtn = item.querySelector('.expand-btn');
        
        item.classList.add('expanded');
        
        if (expandBtn) {
            expandBtn.setAttribute('aria-expanded', 'true');
            expandBtn.setAttribute('aria-label', 'Collapse project details');
        }

        // Scroll item into view if needed
        this.scrollIntoViewIfNeeded(item);
        
        // Trigger custom event
        this.dispatchCustomEvent('projectExpanded', item);
    }

    /**
     * Collapse a specific item
     * @param {Element} item - The item to collapse
     */
    collapseItem(item) {
        const expandBtn = item.querySelector('.expand-btn');
        
        item.classList.remove('expanded');
        
        if (expandBtn) {
            expandBtn.setAttribute('aria-expanded', 'false');
            expandBtn.setAttribute('aria-label', 'Expand project details');
        }

        // Trigger custom event
        this.dispatchCustomEvent('projectCollapsed', item);
    }

    /**
     * Collapse all expanded items
     */
    collapseAll() {
        this.expandableItems.forEach(item => {
            if (item.classList.contains('expanded')) {
                this.collapseItem(item);
            }
        });
    }

    /**
     * Expand all items (utility method)
     */
    expandAll() {
        this.expandableItems.forEach(item => {
            if (!item.classList.contains('expanded')) {
                this.expandItem(item);
            }
        });
    }

    /**
     * Scroll item into view if it's not fully visible
     * @param {Element} item - The item to scroll into view
     */
    scrollIntoViewIfNeeded(item) {
        const rect = item.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
        
        if (!isVisible) {
            item.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }
    }

    /**
     * Dispatch custom events for external listeners
     * @param {string} eventName - Name of the event
     * @param {Element} item - The affected item
     */
    dispatchCustomEvent(eventName, item) {
        const event = new CustomEvent(eventName, {
            detail: { item },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Add a new expandable item dynamically
     * @param {Element} item - The new expandable item
     */
    addExpandableItem(item) {
        if (item.hasAttribute('data-expandable') && item.getAttribute('data-expandable') === 'true') {
            const expandBtn = item.querySelector('.expand-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', (e) => this.handleExpandClick(e, item));
                expandBtn.setAttribute('aria-expanded', 'false');
                expandBtn.setAttribute('tabindex', '0');
            }
            
            // Add to our tracked items
            this.expandableItems = document.querySelectorAll('.expandable[data-expandable="true"]');
        }
    }

    /**
     * Remove an expandable item
     * @param {Element} item - The item to remove
     */
    removeExpandableItem(item) {
        this.collapseItem(item);
        this.expandableItems = document.querySelectorAll('.expandable[data-expandable="true"]');
    }

    /**
     * Get current state of all expandable items
     * @returns {Array} Array of objects with item info and state
     */
    getState() {
        return Array.from(this.expandableItems).map(item => ({
            element: item,
            expanded: item.classList.contains('expanded'),
            projectName: item.querySelector('.project-name')?.textContent || 'Unknown'
        }));
    }

    /**
     * Refresh the manager (re-scan for items and re-attach listeners)
     */
    refresh() {
        this.setup();
    }
}

// Initialize the portfolio manager when script loads
const portfolioManager = new PortfolioManager();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioManager;
}

// Make available globally for debugging
window.portfolioManager = portfolioManager;
