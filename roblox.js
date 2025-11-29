/**
 * Roblox Projects Page Manager
 * Handles dynamic content loading, slideshow functionality, and project display
 */
class RobloxProjectsManager {
    constructor() {
        this.projects = [];
        this.commissions = [];
        this.currentSlideshow = null;
        this.currentSlideIndex = 0;
        this.slideshowMedia = [];
        this.currentPlayingVideo = null; // Track currently playing video
        this.videoObserver = null; // Intersection observer for videos
        this.init();
    }

    /**
     * Initialize the Roblox projects manager
     */
    async init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }

    /**
     * Set up the projects manager
     */
    async setup() {
        try {
            await this.loadProjectData();
            this.renderProjects();
            this.renderCommissions();
            this.setupEventListeners();
            this.setupSlideshowControls();
            this.setupVideoViewportObserver();
        } catch (error) {
            console.error('Failed to setup Roblox projects:', error);
            this.showErrorMessage();
        }
    }

    /**
     * Load project data from JSON file
     */
    async loadProjectData() {
        try {
            const response = await fetch('roblox-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.projects = data.projects || [];
            this.commissions = data.commissions || [];
            console.log(`Loaded ${this.projects.length} projects and ${this.commissions.length} commissions`);
        } catch (error) {
            console.error('Error loading project data:', error);
            throw error;
        }
    }

    /**
     * Render projects section
     */
    renderProjects() {
        const container = document.getElementById('projects-container');
        if (!container) return;

        container.innerHTML = '';
        this.projects.forEach((project, index) => {
            const projectElement = this.createProjectElement(project, 'project', index);
            container.appendChild(projectElement);
        });
    }

    /**
     * Render commissions section
     */
    renderCommissions() {
        const container = document.getElementById('commissions-container');
        if (!container) return;

        container.innerHTML = '';
        this.commissions.forEach((commission, index) => {
            const commissionElement = this.createProjectElement(commission, 'commission', index);
            container.appendChild(commissionElement);
        });
    }

    /**
     * Create a project element from template
     */
    createProjectElement(data, type, index) {
        const template = document.getElementById('project-template');
        const clone = template.content.cloneNode(true);
        const projectItem = clone.querySelector('.project-item');

        // Set basic project information
        this.setProjectBasicInfo(clone, data);
        
        // Set media content
        this.setProjectMedia(clone, data, type, index);
        
        // Set project-specific content
        if (type === 'project') {
            this.setProjectSpecificContent(clone, data);
        } else {
            this.setCommissionSpecificContent(clone, data);
        }

        // Set tech stack
        this.setTechStack(clone, data);
        
        // Set project links
        this.setProjectLinks(clone, data);

        return clone;
    }

    /**
     * Set basic project information
     */
    setProjectBasicInfo(element, data) {
        const title = element.querySelector('.project-title');
        const role = element.querySelector('.project-role');
        const status = element.querySelector('.project-status');
        const description = element.querySelector('.project-description');

        if (title) title.textContent = data.title;
        if (role) role.textContent = data.role;
        if (status) status.textContent = data.status;
        if (description) description.textContent = data.description;
    }

    /**
     * Set project media content
     */
    setProjectMedia(element, data, type, index) {
        const mediaPreview = element.querySelector('.media-preview');
        const mediaCounter = element.querySelector('.media-counter');
        const viewSlideshowBtn = element.querySelector('.view-slideshow-btn');

        if (!data.media || data.media.length === 0) {
            // Create placeholder if no media
            const mediaItem = element.querySelector('.media-item');
            mediaItem.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: var(--background-primary); color: var(--text-muted);">
                    <i class="fas fa-image" style="font-size: 3rem;"></i>
                </div>
            `;
            mediaCounter.style.display = 'none';
            viewSlideshowBtn.style.display = 'none';
            return;
        }

        // Set media counter
        const totalMedia = element.querySelector('.total-media');
        if (totalMedia) totalMedia.textContent = data.media.length;

        // Set first media item
        const firstMediaItem = element.querySelector('.media-item');
        this.setMediaContent(firstMediaItem, data.media[0]);

        // Store media data for slideshow
        mediaPreview.setAttribute('data-project-type', type);
        mediaPreview.setAttribute('data-project-index', index);

        // Setup slideshow button
        if (viewSlideshowBtn) {
            viewSlideshowBtn.addEventListener('click', () => {
                this.openSlideshow(data.media, 0);
            });
        }

        // If multiple media items, setup preview cycling
        if (data.media.length > 1) {
            this.setupMediaPreviewCycling(mediaPreview, data.media);
        }
    }

    /**
     * Set media content for a media item
     */
    setMediaContent(mediaItem, media, isLazy = true) {
        let content = '';
        
        switch (media.type) {
            case 'image':
                content = `<img src="${media.url}" alt="${media.alt || ''}" loading="lazy">`;
                break;
            case 'video':
                if (media.url.includes('youtube.com') || media.url.includes('youtu.be')) {
                    // YouTube embed - use thumbnail for lazy loading
                    const videoId = this.extractYouTubeId(media.url);
                    if (isLazy) {
                        content = `
                            <div class="video-thumbnail" data-video-id="${videoId}" data-video-type="youtube">
                                <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" alt="${media.alt || ''}" loading="lazy">
                                <div class="play-button">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                        `;
                    } else {
                        content = `<iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen></iframe>`;
                    }
                } else {
                    // Direct video - use poster image for lazy loading
                    if (isLazy) {
                        content = `
                            <div class="video-thumbnail" data-video-url="${media.url}" data-video-type="direct">
                                <video preload="none" poster="">
                                    <source src="${media.url}" type="video/mp4">
                                </video>
                                <div class="play-button">
                                    <i class="fas fa-play"></i>
                                </div>
                            </div>
                        `;
                    } else {
                        content = `<video controls muted preload="metadata"><source src="${media.url}" type="video/mp4"></video>`;
                    }
                }
                break;
            default:
                content = `<img src="${media.url}" alt="${media.alt || ''}" loading="lazy">`;
        }
        
        mediaItem.innerHTML = content;
        
        // Setup lazy video loading
        if (isLazy && media.type === 'video') {
            this.setupLazyVideoLoading(mediaItem);
        }
    }

    /**
     * Setup media preview cycling for multiple media items
     */
    setupMediaPreviewCycling(mediaPreview, mediaArray) {
        let currentIndex = 0;
        const mediaItem = mediaPreview.querySelector('.media-item');
        const currentMediaSpan = mediaPreview.querySelector('.current-media');

        // Auto-cycle through media every 5 seconds (increased from 3 for better performance)
        const cycleInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % mediaArray.length;
            // Always use lazy loading for preview cycling to prevent loading all videos
            this.setMediaContent(mediaItem, mediaArray[currentIndex], true);
            if (currentMediaSpan) {
                currentMediaSpan.textContent = currentIndex + 1;
            }
        }, 5000);

        // Store interval for cleanup
        mediaPreview.setAttribute('data-cycle-interval', cycleInterval);
    }

    /**
     * Set project-specific content (metrics, features)
     */
    setProjectSpecificContent(element, data) {
        // Set features
        const featuresList = element.querySelector('.features-list');
        if (featuresList && data.features) {
            featuresList.innerHTML = '';
            data.features.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                featuresList.appendChild(li);
            });
        }

        // Set metrics
        const metricsContainer = element.querySelector('.project-metrics');
        if (metricsContainer && data.metrics) {
            metricsContainer.innerHTML = '';
            Object.entries(data.metrics).forEach(([key, value]) => {
                const metricItem = document.createElement('div');
                metricItem.className = 'metric-item';
                metricItem.innerHTML = `
                    <span class="metric-value">${value}</span>
                    <span class="metric-label">${key}</span>
                `;
                metricsContainer.appendChild(metricItem);
            });
        }

        // Hide deliverables section for projects
        const deliverablesSection = element.querySelector('.project-deliverables');
        if (deliverablesSection) {
            deliverablesSection.style.display = 'none';
        }
    }

    /**
     * Set commission-specific content (deliverables, client info)
     */
    setCommissionSpecificContent(element, data) {
        // Set features (same as projects)
        const featuresList = element.querySelector('.features-list');
        if (featuresList && data.features) {
            featuresList.innerHTML = '';
            data.features.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                featuresList.appendChild(li);
            });
        }

        // Set deliverables
        const deliverablesContainer = element.querySelector('.project-deliverables');
        if (deliverablesContainer && data.deliverables) {
            const h4 = deliverablesContainer.querySelector('h4');
            if (h4) h4.textContent = 'Deliverables:';
            
            let deliverablesList = deliverablesContainer.querySelector('.deliverables-list');
            if (!deliverablesList) {
                deliverablesList = document.createElement('ul');
                deliverablesList.className = 'deliverables-list';
                deliverablesContainer.appendChild(deliverablesList);
            }
            
            deliverablesList.innerHTML = '';
            data.deliverables.forEach(deliverable => {
                const li = document.createElement('li');
                li.textContent = deliverable;
                deliverablesList.appendChild(li);
            });
        }

        // Add client and duration info to meta
        const projectMeta = element.querySelector('.project-meta');
        if (projectMeta && data.client) {
            const clientSpan = document.createElement('span');
            clientSpan.className = 'project-status';
            clientSpan.textContent = `Client: ${data.client}`;
            projectMeta.appendChild(clientSpan);
        }

        if (projectMeta && data.duration) {
            const durationSpan = document.createElement('span');
            durationSpan.className = 'project-status';
            durationSpan.textContent = data.duration;
            projectMeta.appendChild(durationSpan);
        }

        // Hide metrics section for commissions
        const metricsSection = element.querySelector('.project-metrics');
        if (metricsSection) {
            metricsSection.style.display = 'none';
        }
    }

    /**
     * Set tech stack
     */
    setTechStack(element, data) {
        const techStack = element.querySelector('.tech-stack');
        if (techStack && data.techStack) {
            techStack.innerHTML = '';
            data.techStack.forEach(tech => {
                const techTag = document.createElement('span');
                techTag.className = 'tech-tag';
                techTag.textContent = tech;
                techStack.appendChild(techTag);
            });
        }
    }

    /**
     * Set project links
     */
    setProjectLinks(element, data) {
        const linksContainer = element.querySelector('.project-links');
        if (!linksContainer) return;

        linksContainer.innerHTML = '';

        // Add game URL for projects
        if (data.gameUrl) {
            const gameLink = document.createElement('a');
            gameLink.href = data.gameUrl;
            gameLink.target = '_blank';
            gameLink.className = 'project-link primary';
            gameLink.innerHTML = `
                <i class="fas fa-gamepad"></i>
                <span>Play Game</span>
            `;
            linksContainer.appendChild(gameLink);
        }

        // Add additional links if available
        if (data.links) {
            data.links.forEach(link => {
                const linkElement = document.createElement('a');
                linkElement.href = link.url;
                linkElement.target = '_blank';
                linkElement.className = 'project-link';
                linkElement.innerHTML = `
                    <i class="${link.icon || 'fas fa-external-link-alt'}"></i>
                    <span>${link.text}</span>
                `;
                linksContainer.appendChild(linkElement);
            });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close slideshow on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentSlideshow) {
                this.closeSlideshow();
            }
        });

        // Close slideshow on background click
        const slideshowModal = document.getElementById('slideshow-modal');
        if (slideshowModal) {
            slideshowModal.addEventListener('click', (e) => {
                if (e.target === slideshowModal) {
                    this.closeSlideshow();
                }
            });
        }

        // Pause videos when clicking outside of video areas
        document.addEventListener('click', (e) => {
            const clickedVideo = e.target.closest('video, .video-thumbnail, .slideshow-slide');
            if (!clickedVideo && !e.target.closest('.media-item')) {
                // Only pause videos that are not in slideshow if slideshow is not open
                if (!this.currentSlideshow) {
                    this.pauseAllVideos();
                }
            }
        });

        // Pause videos when page loses focus
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAllVideos();
            }
        });

        // Pause videos when window loses focus
        window.addEventListener('blur', () => {
            this.pauseAllVideos();
        });
    }

    /**
     * Setup slideshow controls
     */
    setupSlideshowControls() {
        const closeBtn = document.getElementById('slideshow-close');
        const prevBtn = document.getElementById('slideshow-prev');
        const nextBtn = document.getElementById('slideshow-next');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeSlideshow());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.currentSlideshow) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
            }
        });
    }

    /**
     * Open slideshow with media array
     */
    openSlideshow(mediaArray, startIndex = 0) {
        this.slideshowMedia = mediaArray;
        this.currentSlideIndex = startIndex;
        
        const modal = document.getElementById('slideshow-modal');
        const content = document.getElementById('slideshow-content');
        
        if (!modal || !content) return;

        // Clear existing content
        content.innerHTML = '';

        // Create slides
        mediaArray.forEach((media, index) => {
            const slide = document.createElement('div');
            slide.className = `slideshow-slide ${index === startIndex ? 'active' : ''}`;
            // Only load the first slide immediately, others are lazy loaded
            this.setMediaContent(slide, media, index !== startIndex);
            content.appendChild(slide);
        });

        // Setup indicators
        this.setupSlideshowIndicators();

        // Update caption
        this.updateSlideshowCaption();

        // Show modal
        modal.classList.add('active');
        this.currentSlideshow = modal;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close slideshow
     */
    closeSlideshow() {
        // Pause all videos before closing
        this.pauseAllVideos();

        const modal = document.getElementById('slideshow-modal');
        if (modal) {
            modal.classList.remove('active');
        }

        this.currentSlideshow = null;
        this.slideshowMedia = [];
        this.currentSlideIndex = 0;

        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Go to next slide
     */
    nextSlide() {
        if (this.slideshowMedia.length === 0) return;

        this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slideshowMedia.length;
        this.updateSlideshow();
    }

    /**
     * Go to previous slide
     */
    previousSlide() {
        if (this.slideshowMedia.length === 0) return;

        this.currentSlideIndex = this.currentSlideIndex === 0 
            ? this.slideshowMedia.length - 1 
            : this.currentSlideIndex - 1;
        this.updateSlideshow();
    }

    /**
     * Go to specific slide
     */
    goToSlide(index) {
        if (index < 0 || index >= this.slideshowMedia.length) return;

        this.currentSlideIndex = index;
        this.updateSlideshow();
    }

    /**
     * Update slideshow display
     */
    updateSlideshow() {
        const slides = document.querySelectorAll('.slideshow-slide');
        const indicators = document.querySelectorAll('.slideshow-indicator');

        // Pause all videos before switching
        this.pauseAllVideos();

        // Update slides
        slides.forEach((slide, index) => {
            const isActive = index === this.currentSlideIndex;
            slide.classList.toggle('active', isActive);
            
            // Load video on demand when slide becomes active
            if (isActive) {
                const videoThumbnail = slide.querySelector('.video-thumbnail');
                if (videoThumbnail) {
                    this.loadVideoOnDemand(videoThumbnail);
                }
            } else {
                // Pause any videos in inactive slides
                const video = slide.querySelector('video');
                if (video && !video.paused) {
                    video.pause();
                }
            }
        });

        // Update indicators
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === this.currentSlideIndex);
        });

        // Update caption
        this.updateSlideshowCaption();
    }

    /**
     * Setup slideshow indicators
     */
    setupSlideshowIndicators() {
        const indicatorsContainer = document.getElementById('slideshow-indicators');
        if (!indicatorsContainer) return;

        indicatorsContainer.innerHTML = '';

        this.slideshowMedia.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = `slideshow-indicator ${index === this.currentSlideIndex ? 'active' : ''}`;
            indicator.addEventListener('click', () => this.goToSlide(index));
            indicatorsContainer.appendChild(indicator);
        });
    }

    /**
     * Update slideshow caption
     */
    updateSlideshowCaption() {
        const captionElement = document.getElementById('slideshow-caption');
        if (!captionElement) return;

        const currentMedia = this.slideshowMedia[this.currentSlideIndex];
        if (currentMedia && currentMedia.caption) {
            captionElement.textContent = currentMedia.caption;
            captionElement.style.display = 'block';
        } else {
            captionElement.style.display = 'none';
        }
    }

    /**
     * Setup lazy video loading with intersection observer
     */
    setupLazyVideoLoading(mediaItem) {
        const videoThumbnail = mediaItem.querySelector('.video-thumbnail');
        if (!videoThumbnail) return;

        // Create intersection observer for viewport detection
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadVideoOnDemand(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px' // Start loading when video is 50px away from viewport
        });

        observer.observe(videoThumbnail);

        // Also setup click to play functionality
        videoThumbnail.addEventListener('click', () => {
            this.loadVideoOnDemand(videoThumbnail);
        });
    }

    /**
     * Load video on demand when needed
     */
    loadVideoOnDemand(videoThumbnail) {
        const videoType = videoThumbnail.getAttribute('data-video-type');
        const videoUrl = videoThumbnail.getAttribute('data-video-url');
        const videoId = videoThumbnail.getAttribute('data-video-id');

        // Pause any currently playing video before loading new one
        this.pauseAllVideos();

        let videoContent = '';
        let videoElement = null;

        if (videoType === 'youtube') {
            videoContent = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1" allowfullscreen></iframe>`;
        } else if (videoType === 'direct') {
            videoContent = `<video controls autoplay muted preload="metadata" data-video-managed="true"><source src="${videoUrl}" type="video/mp4"></video>`;
        }

        if (videoContent) {
            videoThumbnail.outerHTML = videoContent;
            
            // Find the newly created video element and set up event listeners
            if (videoType === 'direct') {
                // Use a small delay to ensure the element is in the DOM
                setTimeout(() => {
                    videoElement = document.querySelector(`video[src*="${videoUrl.split('/').pop()}"], video source[src*="${videoUrl.split('/').pop()}"]`);
                    if (!videoElement && document.querySelector('video[data-video-managed="true"]')) {
                        videoElement = document.querySelector('video[data-video-managed="true"]');
                    }
                    if (videoElement) {
                        this.setupVideoEventListeners(videoElement);
                        this.currentPlayingVideo = videoElement;
                    }
                }, 100);
            }
        }
    }

    /**
     * Setup event listeners for video elements
     */
    setupVideoEventListeners(videoElement) {
        if (!videoElement) return;

        // When video starts playing, pause all others
        videoElement.addEventListener('play', () => {
            this.pauseAllVideosExcept(videoElement);
            this.currentPlayingVideo = videoElement;
        });

        // When video is paused, clear current playing reference
        videoElement.addEventListener('pause', () => {
            if (this.currentPlayingVideo === videoElement) {
                this.currentPlayingVideo = null;
            }
        });

        // When video ends, clear current playing reference
        videoElement.addEventListener('ended', () => {
            if (this.currentPlayingVideo === videoElement) {
                this.currentPlayingVideo = null;
            }
        });
    }

    /**
     * Pause all videos except the specified one
     */
    pauseAllVideosExcept(exceptVideo = null) {
        const allVideos = document.querySelectorAll('video');
        allVideos.forEach(video => {
            if (video !== exceptVideo && !video.paused) {
                video.pause();
            }
        });

        // Also pause YouTube videos by reloading them without autoplay
        const allIframes = document.querySelectorAll('iframe[src*="youtube.com"]');
        allIframes.forEach(iframe => {
            if (iframe.src.includes('autoplay=1')) {
                iframe.src = iframe.src.replace('autoplay=1', 'autoplay=0');
            }
        });
    }

    /**
     * Pause all videos
     */
    pauseAllVideos() {
        this.pauseAllVideosExcept(null);
        this.currentPlayingVideo = null;
    }

    /**
     * Setup viewport observer for videos
     */
    setupVideoViewportObserver() {
        if (this.videoObserver) {
            this.videoObserver.disconnect();
        }

        this.videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target.querySelector('video');
                if (video && !entry.isIntersecting && !video.paused) {
                    // Pause video when it goes out of viewport
                    video.pause();
                }
            });
        }, {
            threshold: 0.1 // Pause when less than 10% visible
        });

        // Observe all media items
        document.querySelectorAll('.media-item').forEach(mediaItem => {
            this.videoObserver.observe(mediaItem);
        });
    }

    /**
     * Extract YouTube video ID from URL
     */
    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    /**
     * Show error message
     */
    showErrorMessage() {
        const containers = [
            document.getElementById('projects-container'),
            document.getElementById('commissions-container')
        ];

        containers.forEach(container => {
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>Failed to load project data. Please try refreshing the page.</p>
                    </div>
                `;
            }
        });
    }

    /**
     * Cleanup method
     */
    cleanup() {
        // Clear any intervals
        document.querySelectorAll('[data-cycle-interval]').forEach(element => {
            const intervalId = element.getAttribute('data-cycle-interval');
            if (intervalId) {
                clearInterval(parseInt(intervalId));
            }
        });

        // Disconnect video observer
        if (this.videoObserver) {
            this.videoObserver.disconnect();
            this.videoObserver = null;
        }

        // Pause all videos
        this.pauseAllVideos();

        // Close slideshow
        this.closeSlideshow();
    }
}

// Initialize the Roblox projects manager
const robloxProjectsManager = new RobloxProjectsManager();

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RobloxProjectsManager;
}

// Make available globally for debugging
window.robloxProjectsManager = robloxProjectsManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.robloxProjectsManager) {
        window.robloxProjectsManager.cleanup();
    }
});
