class MP3Player {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;

        this.initializeDOM();
        this.setupEventListeners();
        this.loadPlaylistFromStorage();
    }

    initializeDOM() {
        this.elements = {
            audio: this.audio,
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            stopBtn: document.getElementById('stopBtn'),
            forwardBtn: document.getElementById('forwardBtn'),
            backwardBtn: document.getElementById('backwardBtn'),
            openBtn: document.getElementById('openBtn'),
            resetBtn: document.getElementById('resetBtn'),
            audioInput: document.getElementById('audioInput'),
            progressSlider: document.getElementById('progressSlider'),
            progressFill: document.getElementById('progressFill'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            currentTimeEl: document.getElementById('currentTime'),
            durationEl: document.getElementById('duration'),
            trackTitle: document.getElementById('trackTitle'),
            trackArtist: document.getElementById('trackArtist'),
            playlistEl: document.getElementById('playlist'),
            playlistCount: document.getElementById('playlistCount'),
            albumArt: document.querySelector('.album-art')
        };

        this.audio.volume = 0.7;
    }

    setupEventListeners() {
        this.elements.playBtn.addEventListener('click', () => this.play());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.forwardBtn.addEventListener('click', () => this.skipNext());
        this.elements.backwardBtn.addEventListener('click', () => this.skipPrevious());
        this.elements.openBtn.addEventListener('click', () => this.elements.audioInput.click());
        this.elements.resetBtn.addEventListener('click', () => this.reset());

        this.elements.audioInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.progressSlider.addEventListener('change', (e) => this.seek(e));
        this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e));

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());

        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.addFilesToPlaylist(files);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.body.style.opacity = '0.5';
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.body.style.opacity = '1';
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('audio/')
        );
        
        if (files.length > 0) {
            this.addFilesToPlaylist(files);
        }
    }

    addFilesToPlaylist(files) {
        files.forEach(file => {
            const url = URL.createObjectURL(file);
            this.playlist.push({
                name: file.name,
                url: url,
                size: file.size,
                type: file.type
            });
        });

        this.savePlaylistToStorage();
        this.renderPlaylist();

        if (this.playlist.length === 1) {
            this.loadTrack(0);
        }
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentTrackIndex = index;
        const track = this.playlist[index];

        this.audio.src = track.url;
        this.elements.trackTitle.textContent = this.getTrackName(track.name);
        this.elements.trackArtist.textContent = this.formatFileSize(track.size);
        
        this.updatePlaylistSelection();
        this.renderPlaylist();
    }

    getTrackName(filename) {
        return filename.replace(/\.[^/.]+$/, '');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    play() {
        if (this.playlist.length === 0) {
            alert('No audio files in the playlist. Please add some audio files first.');
            return;
        }

        this.audio.play().catch(error => {
            console.error('Error playing audio:', error);
        });
    }

    pause() {
        this.audio.pause();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.updateProgress();
    }

    seek(e) {
        const percent = e.target.value / 100;
        this.audio.currentTime = percent * this.audio.duration;
    }

    setVolume(e) {
        const value = e.target.value;
        this.audio.volume = value / 100;
        this.elements.volumeValue.textContent = value + '%';
    }

    skipNext() {
        if (this.playlist.length === 0) return;
        const nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadTrack(nextIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    skipPrevious() {
        if (this.playlist.length === 0) return;
        const prevIndex = this.currentTrackIndex === 0 
            ? this.playlist.length - 1 
            : this.currentTrackIndex - 1;
        this.loadTrack(prevIndex);
        if (this.isPlaying) {
            this.play();
        }
    }

    playNext() {
        if (this.playlist.length === 0) return;
        this.skipNext();
    }

    reset() {
        this.stop();
        this.playlist = [];
        this.currentTrackIndex = 0;
        this.elements.trackTitle.textContent = 'No song selected';
        this.elements.trackArtist.textContent = 'Add audio files to get started';
        this.elements.currentTimeEl.textContent = '0:00';
        this.elements.durationEl.textContent = '0:00';
        this.renderPlaylist();
        this.savePlaylistToStorage();
        this.elements.audioInput.value = '';
    }

    updateProgress() {
        if (!this.audio.duration) return;

        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.elements.progressFill.style.width = percent + '%';
        this.elements.progressSlider.value = percent;
        this.elements.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.elements.durationEl.textContent = this.formatTime(this.audio.duration);
        this.elements.progressSlider.max = 100;
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    onPlay() {
        this.isPlaying = true;
        this.elements.playBtn.style.display = 'none';
        this.elements.pauseBtn.style.display = 'flex';
        this.elements.albumArt.classList.remove('paused');
    }

    onPause() {
        this.isPlaying = false;
        this.elements.playBtn.style.display = 'flex';
        this.elements.pauseBtn.style.display = 'none';
        this.elements.albumArt.classList.add('paused');
    }

    updatePlaylistSelection() {
        document.querySelectorAll('.playlist li').forEach((li, index) => {
            if (index === this.currentTrackIndex) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
    }

    renderPlaylist() {
        const playlistEl = this.elements.playlistEl;

        if (this.playlist.length === 0) {
            playlistEl.innerHTML = '<li class="empty-state">No songs added yet. Click "Open Audio Files" to add songs.</li>';
            this.elements.playlistCount.textContent = '0 songs';
            return;
        }

        playlistEl.innerHTML = this.playlist.map((track, index) => `
            <li class="${index === this.currentTrackIndex ? 'active' : ''}">
                <span class="song-index">${index + 1}</span>
                <span class="song-name">${this.getTrackName(track.name)}</span>
                <span class="song-duration">—</span>
            </li>
        `).join('');

        document.querySelectorAll('.playlist li').forEach((li, index) => {
            li.addEventListener('click', () => {
                this.loadTrack(index);
                this.play();
            });
        });

        const count = this.playlist.length;
        this.elements.playlistCount.textContent = `${count} song${count !== 1 ? 's' : ''}`;
    }

    savePlaylistToStorage() {
        const playlistData = this.playlist.map(track => ({
            name: track.name,
            size: track.size,
            type: track.type
        }));
        localStorage.setItem('mp3PlayerPlaylist', JSON.stringify(playlistData));
    }

    loadPlaylistFromStorage() {
        const stored = localStorage.getItem('mp3PlayerPlaylist');
        if (stored) {
            try {
                const playlistData = JSON.parse(stored);
            } catch (error) {
                console.error('Error loading playlist from storage:', error);
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MP3Player();
});
