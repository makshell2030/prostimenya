class LoveBook {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 16;  // Updated to 16 pages after removing duplicate
        this.startDate = new Date('2023-10-09T00:00:00');
        this.isTransitioning = false; // Prevent rapid clicking
        this.init();
    }

    init() {
        this.updateTimer();
        this.setupEventListeners();
        this.updateNavigation();
        this.updatePageIndicator();
        this.setupMusic();
        
        // Update timer every second
        setInterval(() => this.updateTimer(), 1000);
    }    updateTimer() {
        const now = new Date();

        // Helper: Russian pluralization
        const plural = (n, forms) => {
            const abs = Math.abs(n);
            const last = abs % 10;
            const lastTwo = abs % 100;
            if (last === 1 && lastTwo !== 11) return forms[0];
            if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1];
            return forms[2];
        };

        // Compute years, months, days accurately relative to calendar
        let years = now.getFullYear() - this.startDate.getFullYear();
        let months = now.getMonth() - this.startDate.getMonth();
        let days = now.getDate() - this.startDate.getDate();

        if (days < 0) {
            // Borrow days from previous month
            months -= 1;
            const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
            days += prevMonthDays;
        }
        if (months < 0) {
            years -= 1;
            months += 12;
        }

        // Build an anchor date to get the remaining time (hours, minutes, seconds)
        const anchor = new Date(this.startDate);
        anchor.setFullYear(this.startDate.getFullYear() + years);
        anchor.setMonth(this.startDate.getMonth() + months);
        anchor.setDate(this.startDate.getDate() + days);

        let remainingMs = Math.max(0, now - anchor);
        const hours = Math.floor(remainingMs / (1000 * 60 * 60)); remainingMs %= (1000 * 60 * 60);
        const minutes = Math.floor(remainingMs / (1000 * 60)); remainingMs %= (1000 * 60);
        const seconds = Math.floor(remainingMs / 1000);

        const timerText = `${years} ${plural(years, ['год', 'года', 'лет'])}, ` +
                          `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])}, ` +
                          `${days} ${plural(days, ['день', 'дня', 'дней'])}, ` +
                          `${hours} ${plural(hours, ['час', 'часа', 'часов'])}, ` +
                          `${minutes} ${plural(minutes, ['минута', 'минуты', 'минут'])}, ` +
                          `${seconds} ${plural(seconds, ['секунда', 'секунды', 'секунд'])}`;

        const timerElement = document.getElementById('main-timer-text');
        if (timerElement) timerElement.textContent = timerText;
    }

    setupEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousPage());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextPage());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.nextPage();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.previousPage();
            }
        });
    }

    nextPage() {
        if (this.currentPage < this.totalPages && !this.isTransitioning) {
            this.isTransitioning = true;
            this.updateNavigation(); // Update immediately to disable buttons
            
            this.transitionPage(this.currentPage, this.currentPage + 1, () => {
                this.currentPage++;
                this.isTransitioning = false; // Reset flag first
                this.updateNavigation(); // Then update navigation
                this.updatePageIndicator();
            });
        }
    }

    previousPage() {
        if (this.currentPage > 1 && !this.isTransitioning) {
            this.isTransitioning = true;
            this.updateNavigation(); // Update immediately to disable buttons
            
            this.transitionPage(this.currentPage, this.currentPage - 1, () => {
                this.currentPage--;
                this.isTransitioning = false; // Reset flag first
                this.updateNavigation(); // Then update navigation
                this.updatePageIndicator();
            });
        }
    }

    transitionPage(fromPage, toPage, callback) {
        const currentPageEl = document.getElementById(`page-${fromPage}`);
        const nextPageEl = document.getElementById(`page-${toPage}`);
        
        if (!currentPageEl || !nextPageEl) {
            console.warn('Page elements not found:', fromPage, toPage);
            if (callback) callback();
            return;
        }
        
        // Direction for slide animation
        const isForward = toPage > fromPage;
        
        // Phase 1: Start exit animation for current page
        currentPageEl.style.transition = 'all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)';
        currentPageEl.style.transform = `translate(-50%, -50%) translateX(${isForward ? '-100%' : '100%'}) scale(0.95)`;
        currentPageEl.style.opacity = '0';
        
        // Phase 2: Prepare next page (positioned off-screen but centered vertically)
        nextPageEl.classList.remove('hidden');
        nextPageEl.style.transition = 'none'; // Remove transition temporarily
        nextPageEl.style.transform = `translate(-50%, -50%) translateX(${isForward ? '100%' : '-100%'}) scale(0.95)`;
        nextPageEl.style.opacity = '0';
        
        // Phase 3: Start entrance animation for next page (small delay for smoother effect)
        setTimeout(() => {
            nextPageEl.style.transition = 'all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)';
            nextPageEl.style.transform = 'translate(-50%, -50%) scale(1)';
            nextPageEl.style.opacity = '1';
        }, 50);
        
        // Phase 4: Cleanup after animation completes
        setTimeout(() => {
            // Hide and reset current page
            currentPageEl.classList.add('hidden');
            currentPageEl.style.transition = '';
            currentPageEl.style.transform = '';
            currentPageEl.style.opacity = '';
            
            // Reset next page styles
            nextPageEl.style.transition = '';
            nextPageEl.style.transform = '';
            nextPageEl.style.opacity = '';
            
            // Execute callback
            console.log('Transition completed, executing callback');
            if (callback) callback();
        }, 650); // Slightly longer than transition duration
    }

    updateNavigation() {
        const prevBtn = document.querySelector('#page-' + this.currentPage + ' .nav-btn--secondary');
        const nextBtn = document.querySelector('#page-' + this.currentPage + ' .nav-btn:not(.nav-btn--secondary)');
        const container = document.querySelector('.book-3d');
        
        console.log('Updating navigation - Page:', this.currentPage, 'Transitioning:', this.isTransitioning);
        
        // Add/remove transitioning class for visual feedback
        if (this.isTransitioning) {
            container?.classList.add('transitioning');
        } else {
            container?.classList.remove('transitioning');
        }
        
        if (prevBtn) {
            const shouldDisablePrev = this.currentPage === 1 || this.isTransitioning;
            prevBtn.disabled = shouldDisablePrev;
            
            if (shouldDisablePrev) {
                prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
        
        if (nextBtn) {
            const shouldDisableNext = this.currentPage === this.totalPages || this.isTransitioning;
            nextBtn.disabled = shouldDisableNext;
            
            if (shouldDisableNext) {
                nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            
            if (this.currentPage === this.totalPages) {
                nextBtn.innerHTML = 'Конец <span class="ml-1">❤️</span>';
            } else {
                nextBtn.innerHTML = 'Далее <span class="ml-1">→</span>';
            }
        }
    }

    updatePageIndicator() {
        const currentPageEl = document.getElementById('current-page');
        const totalPagesEl = document.getElementById('total-pages');
        
        if (currentPageEl) currentPageEl.textContent = this.currentPage;
        if (totalPagesEl) totalPagesEl.textContent = this.totalPages;
    }

    openLetter() {
        const env = document.getElementById('envelope');
        const card = document.getElementById('envelope-card');
        const book = document.getElementById('book');
        if (!env || !book || !card) return;
        
        console.log('Opening letter - starting smooth transition');
        
        // Phase 1: Start envelope opening animation
        card.classList.add('opening');
        env.classList.add('open');
        
        // Phase 2: After envelope opens, start smooth transition to book (1.5s)
        setTimeout(() => {
            console.log('Envelope opened, transitioning to book');
            
            // Position book to replace envelope smoothly
            book.style.display = 'block';
            book.style.opacity = '0';
            book.style.transform = 'scale(0.9) translateY(-50px)';
            book.style.transition = 'all 1.0s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            // Start book appearance immediately
            setTimeout(() => {
                book.style.opacity = '1';
                book.style.transform = 'scale(1) translateY(0)';
            }, 50);
            
            // Start envelope fade out simultaneously
            setTimeout(() => {
                card.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95) translateY(-30px)';
            }, 300);
            
        }, 1500);
        
        // Phase 3: Complete transition - remove envelope, finalize book (2.8s total)
        setTimeout(() => {
            console.log('Completing transition');
            card.style.display = 'none';
            
            // Ensure book is perfectly positioned
            book.style.transition = 'none';
            book.style.opacity = '1';
            book.style.transform = 'scale(1) translateY(0)';
            
            // Smooth scroll to center after a brief moment
            setTimeout(() => {
                book.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 200);
            
        }, 2800);
    }

    goToStart() {
        // Reset to first page and hide others
        const current = this.currentPage;
        if (current === 1) return;
        this.isTransitioning = true;
        this.transitionPage(current, 1, () => {
            this.currentPage = 1;
            this.isTransitioning = false;
            this.updateNavigation();
            this.updatePageIndicator();
        });
    }

    setupMusic() {
        const music = document.getElementById('background-music');
        const toggleBtn = document.getElementById('music-toggle');
        
        console.log('Music element found:', !!music);
        console.log('Toggle button found:', !!toggleBtn);
        
        if (!music || !toggleBtn) return;
        
        // Set higher volume for testing - we can lower it later
        music.volume = 0.6;
        
        console.log('Music volume set to:', music.volume);
        
        let isPlaying = false;
        
        const playIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
        </svg>`;
        
        const pauseIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>`;
        
        // Auto-play attempt (will work if user has interacted)
        const tryAutoPlay = () => {
            console.log('Attempting to play music...');
            music.play().then(() => {
                console.log('Music started playing successfully');
                isPlaying = true;
                toggleBtn.innerHTML = pauseIcon;
                toggleBtn.title = "Pause music";
                toggleBtn.style.background = "rgba(34, 197, 94, 0.8)"; // Green when playing
            }).catch((error) => {
                console.log('Auto-play blocked:', error);
                // Auto-play blocked, show play button
                isPlaying = false;
                toggleBtn.innerHTML = playIcon;
                toggleBtn.title = "Click to play music";
                toggleBtn.style.background = "rgba(239, 68, 68, 0.8)"; // Red when not playing
            });
        };
        
        // Toggle music on button click
        toggleBtn.addEventListener('click', () => {
            console.log('Music button clicked, currently playing:', isPlaying);
            if (isPlaying) {
                music.pause();
                isPlaying = false;
                toggleBtn.innerHTML = playIcon;
                toggleBtn.title = "Play music";
                toggleBtn.style.background = "rgba(239, 68, 68, 0.8)";
                console.log('Music paused');
            } else {
                music.play().then(() => {
                    isPlaying = true;
                    toggleBtn.innerHTML = pauseIcon;
                    toggleBtn.title = "Pause music";
                    toggleBtn.style.background = "rgba(34, 197, 94, 0.8)";
                    console.log('Music playing after manual click');
                }).catch((error) => {
                    console.error('Failed to play music:', error);
                    alert('Could not play music. Please check if the audio file exists and is accessible.');
                });
            }
        });
        
        // Check if music file loads
        music.addEventListener('loadstart', () => console.log('Music loading started'));
        music.addEventListener('canplay', () => console.log('Music can start playing'));
        music.addEventListener('error', (e) => console.error('Music error:', e));
        
        // Try to auto-play after a short delay
        setTimeout(tryAutoPlay, 1000);
        
        // Also try when user first interacts with the page
        const enableMusic = () => {
            console.log('User interacted, trying to enable music');
            if (!isPlaying) tryAutoPlay();
            document.removeEventListener('click', enableMusic);
            document.removeEventListener('keydown', enableMusic);
        };
        
        document.addEventListener('click', enableMusic);
        document.addEventListener('keydown', enableMusic);
    }


}

// Certificate modal functions
function openCertificate() {
    const modal = document.getElementById('certificateModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Add fade-in animation
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        }, 10);
    }
}

function closeCertificate() {
    const modal = document.getElementById('certificateModal');
    if (modal) {
        modal.style.transition = 'opacity 0.3s ease';
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

// Close modal when clicking outside the image
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('certificateModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCertificate();
            }
        });
    }
});

// Initialize the love book when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const lb = new LoveBook();
    window.loveBook = lb;
    const openBtn = document.getElementById('open-letter-btn');
    if (openBtn) openBtn.addEventListener('click', () => lb.openLetter());
});