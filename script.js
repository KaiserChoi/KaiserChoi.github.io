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
        
        this.initializeApp();
    }

    async initializeApp() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupAudio();
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
            this.playDrawingSound('draw', pos, speed);
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
