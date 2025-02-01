class FlashcardPlayer {
    constructor() {
        this.currentList = [];
        this.currentIndex = 0;
        this.interval = 2000; // 默认的间隔时间，最终会基于音频时长调整
        this.timer = null;
        this.isPlaying = false;
        this.audioElement = new Audio();
        this.currentRepeatCount = 0;
        this.maxRepeatCount = 1;

        // DOM Elements
        this.wordDisplay = document.getElementById('wordDisplay');
        this.textSelect = document.getElementById('textSelect');
        this.intervalInput = document.getElementById('interval');
        this.autoReadCheckbox = document.getElementById('autoRead');
        this.repeatCountSelect = document.getElementById('repeatCount');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // Initialize
        this.setupEventListeners();
        this.loadWordList();
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.textSelect.addEventListener('change', () => this.loadWordList());
        this.intervalInput.addEventListener('change', () => {
            this.interval = this.intervalInput.value * 1000;
            if (this.isPlaying) {
                this.pause();
                this.start();
            }
        });
        this.repeatCountSelect.addEventListener('change', () => {
            this.maxRepeatCount = parseInt(this.repeatCountSelect.value);
        });
    }

    async loadWordList() {
        try {
           // const response = await fetch(`./wordlist/${this.textSelect.value}.txt`);
           const response = await fetch(`./wordlist/${selectedFile}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            this.currentList = text.split('\n').filter(word => word.trim() !== '');
            this.currentIndex = 0;
            this.wordDisplay.textContent = this.currentList[0];
        } catch (error) {
            console.error('Error loading word list:', error);
            this.wordDisplay.textContent = 'Error loading words';
        }
    }

    playWord(word, repeatCount, callback) {
        if (this.autoReadCheckbox.checked) {
            let count = 0;
            const playAudio = () => {
                if (count < repeatCount) {
                    const encodedWord = encodeURIComponent(word);
                    this.audioElement.src = `https://dict.youdao.com/dictvoice?audio=${encodedWord}&type=1`;
                    this.audioElement.play();
                    count++;
                    this.audioElement.onended = playAudio;
                } else {
                    callback(); // 音频播放结束后调用回调，开始延迟
                }
            };
            playAudio();
        } else {
            callback(); // 如果没有勾选自动朗读，直接执行延迟
        }
    }

    start() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.currentRepeatCount = 0;
            this.showNextWord();
        }
    }

    pause() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            clearTimeout(this.timer);
            this.audioElement.pause();
        }
    }

    reset() {
        this.pause();
        this.currentIndex = 0;
        this.currentRepeatCount = 0;
        this.wordDisplay.textContent = this.currentList[0]; // 更新单词显示为第一个单词
        this.audioElement.pause();
    }

    showNextWord() {
        if (!this.isPlaying) return;

        const currentWord = this.currentList[this.currentIndex];
        const repeatCount = parseInt(this.repeatCountSelect.value);

        // 获取当前单词的朗读次数并播放音频
        this.playWord(currentWord, repeatCount, () => {
            // 在播放完当前单词后，延迟切换到下一个单词
            this.timer = setTimeout(() => {
                if (this.currentIndex >= this.currentList.length - 1) {
                    this.currentRepeatCount++;
                    if (this.currentRepeatCount >= this.maxRepeatCount) {
                        this.pause();
                        this.currentIndex = 0;
                        this.currentRepeatCount = 0;
                        return;
                    }
                    this.currentIndex = 0;
                } else {
                    this.currentIndex++;
                }

                this.wordDisplay.textContent = this.currentList[this.currentIndex]; // 更新显示当前单词
                this.showNextWord(); // 递归调用，继续播放下一个单词
            }, this.interval); // 使用间隔时间来控制延迟
        });
    }
}

// Initialize the flashcard player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlashcardPlayer();
});
