// 魔法画笔 - 绘画创造音乐与艺术
class MagicBrush {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.isSoundEnabled = true;
        this.currentTool = 'brush';
        this.brushSize = 5;
        this.brushColor = '#ff6b6b';
        this.soundMode = 'piano';
        this.volume = 0.7;
        
        // 绘画统计
        this.drawingStartTime = null;
        this.strokeCount = 0;
        this.totalDistance = 0;
        this.speeds = [];
        this.lastPosition = null;
        
        // 形状识别
        this.currentPath = [];
        this.recognizedShape = null;
        
        // 中文词汇库
        this.chineseWords = {
            circle: ['圆', '月亮', '太阳', '球'],
            line: ['线', '一', '棍', '直'],
            triangle: ['三角', '山', '树', '尖'],
            rectangle: ['方', '门', '窗', '书'],
            zigzag: ['闪电', '波浪', '锯齿', '山峰'],
            heart: ['心', '爱', '情', '喜欢'],
            star: ['星', '花', '雪花', '亮'],
            spiral: ['螺旋', '蜗牛', '漩涡', '转']
        };
        
        // 音频上下文
        this.audioContext = null;
        this.masterGain = null;
        
        // 钢琴相关
        this.pianoVolume = 0.8;
        this.playbackSpeed = 1.0;
        this.isAutoPlaying = false;
        this.autoPlayTimeout = null;
        this.currentNoteIndex = 0;
        this.isPianoMode = false;
        
        // 萧邦小夜曲片段 (简化版) - 音符和节拍
        this.chopinMelody = [
            { note: 'E4', duration: 500 },
            { note: 'D#4', duration: 250 },
            { note: 'E4', duration: 250 },
            { note: 'D#4', duration: 250 },
            { note: 'E4', duration: 250 },
            { note: 'B4', duration: 500 },
            { note: 'D5', duration: 500 },
            { note: 'C5', duration: 500 },
            { note: 'A4', duration: 750 },
            { note: '', duration: 250 }, // 休止符
            { note: 'C4', duration: 250 },
            { note: 'E4', duration: 250 },
            { note: 'A4', duration: 250 },
            { note: 'B4', duration: 750 },
            { note: '', duration: 250 },
            { note: 'E4', duration: 250 },
            { note: 'G#4', duration: 250 },
            { note: 'B4', duration: 250 },
            { note: 'C5', duration: 750 },
            { note: '', duration: 250 },
            { note: 'E4', duration: 250 },
            { note: 'E4', duration: 250 },
            { note: 'D#4', duration: 250 },
            { note: 'E4', duration: 250 },
            { note: 'D#4', duration: 250 },
            { note: 'E4', duration: 250 },
            { note: 'B4', duration: 500 },
            { note: 'D5', duration: 500 },
            { note: 'C5', duration: 500 },
            { note: 'A4', duration: 1000 }
        ];
        
        this.initializeApp();
    }

    async initializeApp() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupAudio();
        this.setupPiano();
        this.updateStats();
        
        // 初始化语音合成
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
            this.setupVoices();
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 设置画布样式
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = this.brushColor;
        this.ctx.lineWidth = this.brushSize;
    }

    setupEventListeners() {
        // 画布事件
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // 触屏支持
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        // 控制面板事件
        this.setupControlEvents();
    }

    setupControlEvents() {
        // 画笔大小
        const brushSize = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        brushSize.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeValue.textContent = this.brushSize + 'px';
            this.ctx.lineWidth = this.brushSize;
        });

        // 画笔颜色
        const brushColor = document.getElementById('brushColor');
        brushColor.addEventListener('change', (e) => {
            this.brushColor = e.target.value;
            this.ctx.strokeStyle = this.brushColor;
        });

        // 工具选择
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.dataset.tool) {
                    this.selectTool(btn.dataset.tool);
                    toolBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        // 音效设置
        const soundMode = document.getElementById('soundMode');
        soundMode.addEventListener('change', (e) => {
            this.soundMode = e.target.value;
            this.showNotification(`音效模式: ${this.getSoundModeName(e.target.value)}`);
        });

        const volume = document.getElementById('volume');
        const volumeValue = document.getElementById('volumeValue');
        volume.addEventListener('input', (e) => {
            this.volume = parseInt(e.target.value) / 100;
            volumeValue.textContent = e.target.value + '%';
            if (this.masterGain) {
                this.masterGain.gain.value = this.volume;
            }
        });

        // 钢琴控制事件
        const pianoVolume = document.getElementById('pianoVolume');
        const pianoVolumeValue = document.getElementById('pianoVolumeValue');
        pianoVolume.addEventListener('input', (e) => {
            this.pianoVolume = parseInt(e.target.value) / 100;
            pianoVolumeValue.textContent = e.target.value + '%';
        });

        const playbackSpeed = document.getElementById('playbackSpeed');
        const speedValue = document.getElementById('speedValue');
        playbackSpeed.addEventListener('input', (e) => {
            this.playbackSpeed = parseFloat(e.target.value);
            speedValue.textContent = e.target.value + 'x';
        });
    }

    async setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
        } catch (error) {
            console.warn('音频上下文初始化失败:', error);
        }
    }

    setupPiano() {
        // 设置钢琴键盘事件监听
        const pianoKeys = document.querySelectorAll('.white-key, .black-key');
        console.log(`找到 ${pianoKeys.length} 个钢琴键`);
        
        pianoKeys.forEach((key, index) => {
            // 鼠标事件
            key.addEventListener('mousedown', (e) => {
                console.log(`点击钢琴键: ${e.target.dataset.note}`);
                this.playPianoNote(e.target);
            });
            
            // 触屏事件
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log(`触摸钢琴键: ${e.target.dataset.note}`);
                this.playPianoNote(e.target);
            });
            
            // 点击事件作为备用
            key.addEventListener('click', (e) => {
                console.log(`点击事件钢琴键: ${e.target.dataset.note}`);
                this.playPianoNote(e.target);
            });
            
            // 释放事件
            key.addEventListener('mouseup', (e) => this.releasePianoKey(e.target));
            key.addEventListener('mouseleave', (e) => this.releasePianoKey(e.target));
            key.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.releasePianoKey(e.target);
            });
            
            // 确保键盘有数据属性
            if (!key.dataset.note) {
                console.warn(`钢琴键 ${index} 缺少 data-note 属性`);
            }
            if (!key.dataset.freq) {
                console.warn(`钢琴键 ${index} 缺少 data-freq 属性`);
            }
        });

        // 添加键盘快捷键支持
        document.addEventListener('keydown', (e) => this.handlePianoKeyboard(e, true));
        document.addEventListener('keyup', (e) => this.handlePianoKeyboard(e, false));
        
        console.log('钢琴设置完成');
    }

    handlePianoKeyboard(event, isPressed) {
        // 键盘映射到钢琴键
        const keyMap = {
            'KeyA': 'C4', 'KeyW': 'C#4', 'KeyS': 'D4', 'KeyE': 'D#4', 'KeyD': 'E4',
            'KeyF': 'F4', 'KeyT': 'F#4', 'KeyG': 'G4', 'KeyY': 'G#4', 'KeyH': 'A4',
            'KeyU': 'A#4', 'KeyJ': 'B4', 'KeyK': 'C5', 'KeyO': 'C#5', 'KeyL': 'D5',
            'KeyP': 'D#5', 'Semicolon': 'E5', 'Quote': 'F5', 'BracketRight': 'F#5'
        };

        const note = keyMap[event.code];
        if (!note) return;

        event.preventDefault();
        const key = document.querySelector(`[data-note="${note}"]`);
        if (!key) return;

        if (isPressed && !key.classList.contains('active')) {
            this.playPianoNote(key);
        } else if (!isPressed) {
            this.releasePianoKey(key);
        }
    }

    playPianoNote(keyElement) {
        if (!keyElement) return;

        const note = keyElement.dataset.note;
        const frequency = parseFloat(keyElement.dataset.freq);
        
        // 确保音频上下文已激活
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // 添加视觉反馈
        keyElement.classList.add('active');
        
        // 播放钢琴音符
        this.createPianoSound(frequency, note);
        
        // 更新正在演奏显示
        this.updateNowPlaying(note);
        
        // 添加可爱的视觉弹跳效果
        this.addKeyBounceEffect(keyElement);
        
        // 显示音符名称通知
        this.showNoteNotification(note);
    }
    
    addKeyBounceEffect(keyElement) {
        // 给按键添加可爱的弹跳动画
        keyElement.style.transform = 'translateY(4px) scale(0.98)';
        keyElement.style.transition = 'all 0.1s ease';
        
        setTimeout(() => {
            keyElement.style.transform = 'translateY(0) scale(1)';
        }, 100);
    }
    
    showNoteNotification(note) {
        // 显示可爱的音符提示
        const noteNames = {
            'C4': 'Do', 'C#4': 'Do#', 'D4': 'Re', 'D#4': 'Re#', 'E4': 'Mi',
            'F4': 'Fa', 'F#4': 'Fa#', 'G4': 'Sol', 'G#4': 'Sol#', 'A4': 'La',
            'A#4': 'La#', 'B4': 'Si', 'C5': 'Do', 'C#5': 'Do#', 'D5': 'Re',
            'D#5': 'Re#', 'E5': 'Mi', 'F5': 'Fa', 'F#5': 'Fa#', 'G5': 'Sol'
        };
        
        const noteName = noteNames[note] || note;
        
        // 创建可爱的音符气泡
        const bubble = document.createElement('div');
        bubble.textContent = `♪ ${noteName} ♪`;
        bubble.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 18px;
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: none;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
            animation: noteFloat 1s ease-out forwards;
        `;
        
        document.body.appendChild(bubble);
        
        setTimeout(() => {
            bubble.style.opacity = '1';
            bubble.style.transform = 'translate(-50%, -70px) scale(1.1)';
        }, 50);
        
        setTimeout(() => {
            bubble.style.opacity = '0';
            bubble.style.transform = 'translate(-50%, -100px) scale(0.8)';
            setTimeout(() => {
                if (document.body.contains(bubble)) {
                    document.body.removeChild(bubble);
                }
            }, 300);
        }, 800);
    }

    releasePianoKey(keyElement) {
        keyElement.classList.remove('active');
    }

    createPianoSound(frequency, noteName) {
        if (!this.audioContext) return;

        try {
            // 创建可爱的钢琴音色
            const oscillators = [];
            const gainNodes = [];
            
            // 主音（正弦波，柔和基础音）
            const mainOsc = this.audioContext.createOscillator();
            const mainGain = this.audioContext.createGain();
            const mainFilter = this.audioContext.createBiquadFilter();
            
            mainOsc.type = 'sine';
            mainOsc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            mainFilter.type = 'lowpass';
            mainFilter.frequency.setValueAtTime(3000, this.audioContext.currentTime);
            mainFilter.Q.setValueAtTime(1, this.audioContext.currentTime);
            
            // 可爱的音包效果
            mainGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            mainGain.gain.linearRampToValueAtTime(this.pianoVolume * 0.7, this.audioContext.currentTime + 0.02);
            mainGain.gain.exponentialRampToValueAtTime(this.pianoVolume * 0.3, this.audioContext.currentTime + 0.3);
            mainGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.2);
            
            mainOsc.connect(mainFilter);
            mainFilter.connect(mainGain);
            mainGain.connect(this.masterGain);
            
            // 添加可爱的谐波（三角波）
            const harmOsc = this.audioContext.createOscillator();
            const harmGain = this.audioContext.createGain();
            
            harmOsc.type = 'triangle';
            harmOsc.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
            
            harmGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            harmGain.gain.linearRampToValueAtTime(this.pianoVolume * 0.25, this.audioContext.currentTime + 0.01);
            harmGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
            
            harmOsc.connect(harmGain);
            harmGain.connect(this.masterGain);
            
            // 添加温暖的低频（让声音更饱满可爱）
            const subOsc = this.audioContext.createOscillator();
            const subGain = this.audioContext.createGain();
            
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime);
            
            subGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            subGain.gain.linearRampToValueAtTime(this.pianoVolume * 0.15, this.audioContext.currentTime + 0.05);
            subGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.0);
            
            subOsc.connect(subGain);
            subGain.connect(this.masterGain);
            
            // 添加可爱的"叮"声效果
            const bellOsc = this.audioContext.createOscillator();
            const bellGain = this.audioContext.createGain();
            const bellFilter = this.audioContext.createBiquadFilter();
            
            bellOsc.type = 'sine';
            bellOsc.frequency.setValueAtTime(frequency * 4, this.audioContext.currentTime);
            bellFilter.type = 'highpass';
            bellFilter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            
            bellGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            bellGain.gain.linearRampToValueAtTime(this.pianoVolume * 0.3, this.audioContext.currentTime + 0.005);
            bellGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            bellOsc.connect(bellFilter);
            bellFilter.connect(bellGain);
            bellGain.connect(this.masterGain);
            
            // 启动所有振荡器
            const startTime = this.audioContext.currentTime;
            const stopTime = startTime + 1.5;
            
            mainOsc.start(startTime);
            mainOsc.stop(stopTime);
            
            harmOsc.start(startTime);
            harmOsc.stop(stopTime);
            
            subOsc.start(startTime);
            subOsc.stop(stopTime);
            
            bellOsc.start(startTime);
            bellOsc.stop(startTime + 0.3);
            
            // 添加可爱的音符弹跳效果
            this.addCuteNoteEffect(frequency);
            
        } catch (error) {
            console.warn('钢琴音频播放失败:', error);
        }
    }
    
    addCuteNoteEffect(frequency) {
        // 创建一个短暂的"pop"声效果，让音符听起来更可爱
        try {
            const popOsc = this.audioContext.createOscillator();
            const popGain = this.audioContext.createGain();
            const popFilter = this.audioContext.createBiquadFilter();
            
            popOsc.type = 'square';
            popOsc.frequency.setValueAtTime(frequency * 8, this.audioContext.currentTime);
            popFilter.type = 'bandpass';
            popFilter.frequency.setValueAtTime(frequency * 6, this.audioContext.currentTime);
            popFilter.Q.setValueAtTime(10, this.audioContext.currentTime);
            
            popGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            popGain.gain.linearRampToValueAtTime(this.pianoVolume * 0.1, this.audioContext.currentTime + 0.001);
            popGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
            
            popOsc.connect(popFilter);
            popFilter.connect(popGain);
            popGain.connect(this.masterGain);
            
            popOsc.start(this.audioContext.currentTime);
            popOsc.stop(this.audioContext.currentTime + 0.08);
        } catch (error) {
            // 忽略pop效果的错误
        }
    }

    updateNowPlaying(note) {
        const currentNoteDisplay = document.getElementById('currentNote');
        const noteAnimation = document.getElementById('noteAnimation');
        
        currentNoteDisplay.textContent = note || '等待演奏...';
        noteAnimation.classList.add('active');
        
        setTimeout(() => {
            noteAnimation.classList.remove('active');
        }, 500);
    }

    setupVoices() {
        // 等待语音列表加载
        if (this.speechSynthesis.getVoices().length === 0) {
            this.speechSynthesis.onvoiceschanged = () => {
                this.voices = this.speechSynthesis.getVoices();
                // 优先选择中文语音
                this.chineseVoice = this.voices.find(voice => 
                    voice.lang.includes('zh') || voice.name.includes('Chinese')
                ) || this.voices[0];
            };
        } else {
            this.voices = this.speechSynthesis.getVoices();
            this.chineseVoice = this.voices.find(voice => 
                voice.lang.includes('zh') || voice.name.includes('Chinese')
            ) || this.voices[0];
        }
    }

    selectTool(tool) {
        this.currentTool = tool;
        
        switch(tool) {
            case 'brush':
                this.canvas.style.cursor = 'crosshair';
                break;
            case 'eraser':
                this.canvas.style.cursor = 'grab';
                break;
        }
    }

    getCanvasPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    startDrawing(event) {
        this.isDrawing = true;
        this.drawingStartTime = this.drawingStartTime || Date.now();
        
        const pos = this.getCanvasPosition(event);
        this.lastPosition = pos;
        this.currentPath = [pos];
        
        // 激活绘画状态
        document.body.classList.add('drawing-active');
        document.querySelector('.canvas-container').classList.add('active');
        
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        
        // 播放开始音效
        this.playDrawingSound('start', pos);
    }

    draw(event) {
        if (!this.isDrawing) return;
        
        const pos = this.getCanvasPosition(event);
        this.currentPath.push(pos);
        
        // 计算绘画速度
        if (this.lastPosition) {
            const distance = this.calculateDistance(this.lastPosition, pos);
            this.totalDistance += distance;
            
            const timeDiff = Date.now() - (this.lastDrawTime || Date.now());
            const speed = distance / Math.max(timeDiff, 1);
            this.speeds.push(speed);
            
            // 更新速度指示器
            this.updateSpeedIndicator(speed);
            
            // 根据速度播放不同音效
            if (this.isPianoMode) {
                this.playPianoFromDrawing(pos, speed);
            } else {
                this.playDrawingSound('draw', pos, speed);
            }
        }
        
        // 绘制
        if (this.currentTool === 'brush') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.brushColor;
            this.ctx.lineWidth = this.brushSize;
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.brushSize * 2;
        }
        
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        
        this.lastPosition = pos;
        this.lastDrawTime = Date.now();
    }

    playPianoFromDrawing(pos, speed) {
        // 根据绘画位置和速度映射到钢琴音符
        const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];
        const noteIndex = Math.floor((pos.x / this.canvas.width) * notes.length);
        const note = notes[Math.max(0, Math.min(noteIndex, notes.length - 1))];
        
        // 根据Y位置调整音高
        const yFactor = 1 - (pos.y / this.canvas.height);
        const baseFreqs = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
            'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99
        };
        
        const frequency = baseFreqs[note] * (0.8 + yFactor * 0.4);
        
        // 高亮对应的钢琴键
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            setTimeout(() => keyElement.classList.remove('active'), 200);
        }
        
        // 播放音符
        this.createPianoSound(frequency, note);
        this.updateNowPlaying(note);
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.strokeCount++;
        
        // 移除激活状态
        document.body.classList.remove('drawing-active');
        
        // 形状识别
        this.recognizeShape();
        
        // 播放结束音效
        this.playDrawingSound('end', this.lastPosition);
        
        // 更新统计
        this.updateStats();
        
        // 重置路径
        this.currentPath = [];
    }

    calculateDistance(pos1, pos2) {
        return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
    }

    updateSpeedIndicator(speed) {
        const speedBar = document.getElementById('speedBar');
        const speedText = document.getElementById('speedText');
        
        const normalizedSpeed = Math.min(speed * 10, 100);
        speedBar.style.width = normalizedSpeed + '%';
        
        if (speed > 5) {
            speedText.textContent = '快速绘画';
        } else if (speed > 2) {
            speedText.textContent = '中速绘画';
        } else {
            speedText.textContent = '慢速绘画';
        }
    }

    recognizeShape() {
        if (this.currentPath.length < 3) return;
        
        const shape = this.analyzeShape(this.currentPath);
        this.recognizedShape = shape;
        
        // 更新形状显示
        this.updateShapeDisplay(shape);
        
        // 播放对应中文词汇
        if (this.soundMode === 'chinese') {
            this.speakChineseWord(shape.name);
        }
    }

    analyzeShape(path) {
        // 简单的形状识别算法
        const startPoint = path[0];
        const endPoint = path[path.length - 1];
        const boundingBox = this.getBoundingBox(path);
        
        const width = boundingBox.maxX - boundingBox.minX;
        const height = boundingBox.maxY - boundingBox.minY;
        const aspectRatio = width / height;
        
        // 计算路径的复杂度
        let totalAngleChange = 0;
        for (let i = 1; i < path.length - 1; i++) {
            const angle1 = Math.atan2(path[i].y - path[i-1].y, path[i].x - path[i-1].x);
            const angle2 = Math.atan2(path[i+1].y - path[i].y, path[i+1].x - path[i].x);
            totalAngleChange += Math.abs(angle2 - angle1);
        }
        
        // 检查是否闭合
        const isClosedShape = this.calculateDistance(startPoint, endPoint) < 30;
        
        let shapeName = 'unknown';
        let confidence = 0.5;
        
        if (isClosedShape && totalAngleChange < Math.PI) {
            // 可能是圆形
            shapeName = 'circle';
            confidence = 0.8;
        } else if (isClosedShape && aspectRatio > 0.8 && aspectRatio < 1.2) {
            // 可能是方形
            shapeName = 'rectangle';
            confidence = 0.7;
        } else if (totalAngleChange > Math.PI * 2) {
            // 复杂形状，可能是螺旋
            shapeName = 'spiral';
            confidence = 0.6;
        } else if (path.length < 10) {
            // 简单直线
            shapeName = 'line';
            confidence = 0.9;
        } else {
            // 锯齿或波浪
            shapeName = 'zigzag';
            confidence = 0.6;
        }
        
        return { name: shapeName, confidence, boundingBox };
    }

    getBoundingBox(path) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        path.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
        return { minX, minY, maxX, maxY };
    }

    updateShapeDisplay(shape) {
        const shapeIcon = document.getElementById('shapeIcon');
        const shapeName = document.getElementById('shapeName');
        const shapeConfidence = document.getElementById('shapeConfidence');
        
        const icons = {
            circle: '⭕',
            rectangle: '⬜',
            triangle: '🔺',
            line: '➖',
            zigzag: '⚡',
            heart: '❤️',
            star: '⭐',
            spiral: '🌀',
            unknown: '❓'
        };
        
        const names = {
            circle: '圆形',
            rectangle: '矩形',
            triangle: '三角形',
            line: '直线',
            zigzag: '锯齿',
            heart: '心形',
            star: '星形',
            spiral: '螺旋',
            unknown: '未知形状'
        };
        
        shapeIcon.textContent = icons[shape.name] || icons.unknown;
        shapeName.textContent = names[shape.name] || names.unknown;
        shapeConfidence.textContent = `置信度: ${Math.round(shape.confidence * 100)}%`;
    }

    speakChineseWord(shapeName) {
        if (!this.speechSynthesis || !this.chineseVoice) return;
        
        const words = this.chineseWords[shapeName];
        if (!words) return;
        
        // 随机选择一个词汇
        const word = words[Math.floor(Math.random() * words.length)];
        
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.voice = this.chineseVoice;
        utterance.rate = 0.8;
        utterance.pitch = 1.2;
        utterance.volume = this.volume;
        
        this.speechSynthesis.speak(utterance);
        
        // 更新语音反馈显示
        this.updateVoiceFeedback(word);
    }

    updateVoiceFeedback(word) {
        const voiceText = document.getElementById('voiceText');
        const voiceWave = document.getElementById('voiceWave');
        
        voiceText.textContent = `正在说: "${word}"`;
        voiceWave.style.animation = 'wave 1s ease-in-out 3';
        
        setTimeout(() => {
            voiceText.textContent = '等待绘画输入...';
            voiceWave.style.animation = 'wave 2s ease-in-out infinite';
        }, 2000);
    }

    playDrawingSound(type, position, speed = 1) {
        if (!this.audioContext || !this.isSoundEnabled) return;
        
        try {
            switch (this.soundMode) {
                case 'piano':
                    this.playPianoNote(position, speed);
                    break;
                case 'nature':
                    this.playNatureSound(type, speed);
                    break;
                case 'instrument':
                    this.playInstrumentSound(position, speed);
                    break;
            }
        } catch (error) {
            console.warn('音频播放失败:', error);
        }
    }

    playPianoNote(position, speed) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 根据位置计算音高
        const frequency = 200 + (position.y / this.canvas.height) * 600;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // 根据速度调整音量和类型
        oscillator.type = speed > 3 ? 'square' : 'sine';
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    playNatureSound(type, speed) {
        // 模拟自然声音
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100 + Math.random() * 200, this.audioContext.currentTime);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + speed * 200, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playInstrumentSound(position, speed) {
        // 创建复合音色
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            const baseFreq = 150 + (position.x / this.canvas.width) * 400;
            oscillator.frequency.setValueAtTime(baseFreq * (i + 1), this.audioContext.currentTime);
            oscillator.type = ['sine', 'triangle', 'square'][i];
            
            const volume = this.volume * (0.4 - i * 0.1) * Math.min(speed / 3, 1);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
        }
    }

    getSoundModeName(mode) {
        const names = {
            piano: '钢琴模式',
            nature: '自然模式',
            chinese: '中文词汇',
            instrument: '乐器模式'
        };
        return names[mode] || mode;
    }

    updateStats() {
        const drawingTime = this.drawingStartTime 
            ? Math.round((Date.now() - this.drawingStartTime) / 1000) 
            : 0;
        
        const avgSpeed = this.speeds.length > 0 
            ? (this.speeds.reduce((a, b) => a + b, 0) / this.speeds.length).toFixed(1)
            : 0;
        
        const creativeScore = Math.min(
            Math.round((this.strokeCount * 2 + avgSpeed * 5 + drawingTime) / 3),
            100
        );
        
        document.getElementById('drawingTime').textContent = drawingTime + 's';
        document.getElementById('strokeCount').textContent = this.strokeCount;
        document.getElementById('avgSpeed').textContent = avgSpeed;
        document.getElementById('creativeScore').textContent = creativeScore;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 萧邦旋律自动演奏系统
    playChopinMelodySystem() {
        if (this.isAutoPlaying) return;
        
        this.isAutoPlaying = true;
        this.currentNoteIndex = 0;
        
        this.showNotification('🎼 开始演奏萧邦小夜曲...');
        this.playNextNote();
    }
    
    playNextNote() {
        if (!this.isAutoPlaying || this.currentNoteIndex >= this.chopinMelody.length) {
            this.stopAutoPlaySystem();
            return;
        }
        
        const currentNote = this.chopinMelody[this.currentNoteIndex];
        const duration = currentNote.duration / this.playbackSpeed;
        
        if (currentNote.note) {
            // 播放音符
            const keyElement = document.querySelector(`[data-note="${currentNote.note}"]`);
            if (keyElement) {
                this.playPianoNote(keyElement);
                setTimeout(() => this.releasePianoKey(keyElement), duration * 0.8);
            }
        }
        
        // 安排下一个音符
        this.autoPlayTimeout = setTimeout(() => {
            this.currentNoteIndex++;
            this.playNextNote();
        }, duration);
    }
    
    stopAutoPlaySystem() {
        this.isAutoPlaying = false;
        if (this.autoPlayTimeout) {
            clearTimeout(this.autoPlayTimeout);
            this.autoPlayTimeout = null;
        }
        this.currentNoteIndex = 0;
        this.updateNowPlaying('');
        this.showNotification('⏹️ 演奏停止');
    }
    
    togglePianoModeSystem() {
        this.isPianoMode = !this.isPianoMode;
        const message = this.isPianoMode 
            ? '🎹 钢琴绘画模式已开启！绘画时会触发钢琴音符' 
            : '🎨 普通绘画模式已开启';
        this.showNotification(message);
        
        // 更新画布样式
        if (this.isPianoMode) {
            document.body.classList.add('piano-mode');
        } else {
            document.body.classList.remove('piano-mode');
        }
    }
}

// 全局函数
function startDrawing() {
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    button.textContent = '正在激活...';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
        button.textContent = '创作中...';
        window.magicBrush.showNotification('🎨 魔法画笔已激活！开始你的创作之旅！');
        
        // 启用音频上下文（需要用户交互）
        if (window.magicBrush.audioContext && window.magicBrush.audioContext.state === 'suspended') {
            window.magicBrush.audioContext.resume();
        }
        
        setTimeout(() => {
            button.textContent = '继续创作';
        }, 2000);
    }, 500);
}

// 钢琴相关全局函数
function playChopinMelody() {
    if (window.magicBrush) {
        window.magicBrush.playChopinMelodySystem();
    }
}

function stopAutoPlay() {
    if (window.magicBrush) {
        window.magicBrush.stopAutoPlaySystem();
    }
}

function togglePianoMode() {
    if (window.magicBrush) {
        window.magicBrush.togglePianoModeSystem();
    }
}

function clearCanvas() {
    if (window.magicBrush && window.magicBrush.ctx) {
        window.magicBrush.ctx.clearRect(0, 0, window.magicBrush.canvas.width, window.magicBrush.canvas.height);
        window.magicBrush.strokeCount = 0;
        window.magicBrush.totalDistance = 0;
        window.magicBrush.speeds = [];
        window.magicBrush.drawingStartTime = null;
        window.magicBrush.updateStats();
        window.magicBrush.showNotification('🧹 画布已清空！');
        
        // 重置形状显示
        document.getElementById('shapeIcon').textContent = '❓';
        document.getElementById('shapeName').textContent = '开始绘画...';
        document.getElementById('shapeConfidence').textContent = '--';
    }
}

function toggleMute() {
    if (window.magicBrush) {
        window.magicBrush.isSoundEnabled = !window.magicBrush.isSoundEnabled;
        const btn = document.getElementById('muteBtn');
        btn.textContent = window.magicBrush.isSoundEnabled ? '🔊 静音' : '🔇 取消静音';
        
        const message = window.magicBrush.isSoundEnabled ? '🔊 声音已开启' : '🔇 声音已关闭';
        window.magicBrush.showNotification(message);
    }
}

function testSound() {
    if (window.magicBrush && window.magicBrush.isSoundEnabled) {
        const pos = { x: window.magicBrush.canvas.width / 2, y: window.magicBrush.canvas.height / 2 };
        window.magicBrush.playDrawingSound('test', pos, 2);
        window.magicBrush.showNotification('🎵 音效测试');
    }
}

function saveArtwork() {
    const gallery = document.getElementById('artworkGallery');
    const placeholder = gallery.querySelector('.artwork-placeholder');
    
    if (placeholder) {
        placeholder.remove();
    }
    
    // 创建作品缩略图
    const canvas = window.magicBrush.canvas;
    const thumbnail = document.createElement('canvas');
    thumbnail.width = 200;
    thumbnail.height = 150;
    thumbnail.style.cssText = 'border-radius: 10px; margin: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); cursor: pointer;';
    
    const thumbCtx = thumbnail.getContext('2d');
    thumbCtx.fillStyle = 'white';
    thumbCtx.fillRect(0, 0, 200, 150);
    thumbCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 200, 150);
    
    gallery.appendChild(thumbnail);
    window.magicBrush.showNotification('💾 作品已保存到画廊！');
}

function shareArtwork() {
    if (navigator.share) {
        const canvas = window.magicBrush.canvas;
        canvas.toBlob(blob => {
            const file = new File([blob], 'artwork.png', { type: 'image/png' });
            navigator.share({
                title: '我的魔法画笔作品',
                text: '看看我用魔法画笔创作的艺术作品！',
                files: [file]
            });
        });
    } else {
        window.magicBrush.showNotification('📤 您的浏览器不支持原生分享功能');
    }
}

function downloadArtwork() {
    const canvas = window.magicBrush.canvas;
    const link = document.createElement('a');
    link.download = `魔法画笔作品_${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    window.magicBrush.showNotification('⬇️ 作品下载完成！');
}

function startChallenge(type) {
    const challenges = {
        speed: '⚡ 速度挑战：在30秒内绘制一个完整的图形！',
        sound: '🎵 音乐挑战：跟随节拍进行创作！',
        shape: '🔺 形状挑战：尝试绘制一个完美的几何图形！',
        story: '📚 故事挑战：用画笔讲述一个有趣的故事！'
    };
    
    window.magicBrush.showNotification(challenges[type] || '🎮 挑战开始！');
    
    // 清空画布准备挑战
    clearCanvas();
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    // 创建全局魔法画笔实例
    window.magicBrush = new MagicBrush();
    
    // 页面加载动画
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
    
    // 添加粒子效果
    createFloatingParticles();
});

function createFloatingParticles() {
    const particleContainer = document.querySelector('.floating-particles');
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 6 + 2}px;
            height: ${Math.random() * 6 + 2}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: float ${Math.random() * 4 + 5}s ease-in-out infinite;
            animation-delay: ${Math.random() * 3}s;
        `;
        particleContainer.appendChild(particle);
    }
}

// 初始化页面样式
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        body {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.8s ease;
        }
        
        .notification {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        @media (max-width: 768px) {
            .canvas-container {
                padding: 10px;
            }
            
            #drawingCanvas {
                width: 100%;
                height: auto;
            }
        }
    `;
    document.head.appendChild(style);
});
