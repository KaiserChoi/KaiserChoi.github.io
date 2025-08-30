// 点云可视化器主要逻辑
class WeldingPointCloudVisualizer {
    constructor() {
        this.pointCount = 0;
        this.temperatureRange = { min: 0, max: 0 };
        this.qualityScore = 0;
        this.isVisualizationActive = false;
        
        this.initEventListeners();
        this.generateInitialData();
    }

    initEventListeners() {
        // 点云大小控制
        const pointSizeSlider = document.getElementById('pointSize');
        const pointSizeValue = document.getElementById('pointSizeValue');
        
        pointSizeSlider.addEventListener('input', (e) => {
            pointSizeValue.textContent = e.target.value;
            this.updatePointSize(e.target.value);
        });

        // 颜色模式选择
        const colorModeSelect = document.getElementById('colorMode');
        colorModeSelect.addEventListener('change', (e) => {
            this.changeColorMode(e.target.value);
        });

        // 添加一些动态效果
        this.addInteractiveEffects();
    }

    addInteractiveEffects() {
        // 为特征卡片添加悬停效果
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // 为画廊项目添加点击效果
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.animateGallerySelection(item, index);
            });
        });

        // 添加滚动动画
        this.addScrollAnimations();
    }

    animateGallerySelection(item, index) {
        // 移除其他项目的选中状态
        document.querySelectorAll('.gallery-item').forEach(i => {
            i.style.transform = 'scale(1)';
            i.style.opacity = '1';
        });
        
        // 高亮选中项目
        item.style.transform = 'scale(1.05)';
        item.style.boxShadow = '0 15px 40px rgba(231, 76, 60, 0.3)';
        
        // 更新可视化区域
        this.updateVisualizationForDemo(index);
        
        setTimeout(() => {
            item.style.transform = 'scale(1)';
            item.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.1)';
        }, 300);
    }

    addScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // 观察需要动画的元素
        const animateElements = document.querySelectorAll('.feature-card, .gallery-item, .controls-panel, .info-panel');
        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    generateInitialData() {
        this.pointCount = Math.floor(Math.random() * 5000) + 1000;
        this.temperatureRange = {
            min: Math.floor(Math.random() * 200) + 800,
            max: Math.floor(Math.random() * 300) + 1200
        };
        this.qualityScore = (Math.random() * 30 + 70).toFixed(1);
        
        this.updateStats();
    }

    updateStats() {
        document.getElementById('pointCount').textContent = this.pointCount.toLocaleString();
        document.getElementById('tempRange').textContent = 
            `${this.temperatureRange.min}°C - ${this.temperatureRange.max}°C`;
        document.getElementById('qualityScore').textContent = `${this.qualityScore}%`;
    }

    updatePointSize(size) {
        // 模拟点云大小变化
        const pointCloud = document.getElementById('pointCloud');
        pointCloud.style.filter = `blur(${Math.max(0, 3 - size)}px)`;
        
        // 添加视觉反馈
        this.showNotification(`点云大小已调整至: ${size}`);
    }

    changeColorMode(mode) {
        const pointCloud = document.getElementById('pointCloud');
        const modeColors = {
            temperature: 'radial-gradient(circle, #ff6b6b 0%, #feca57 50%, #48cae4 100%)',
            depth: 'radial-gradient(circle, #4ecdc4 0%, #45b7d1 50%, #96ceb4 100%)',
            quality: 'radial-gradient(circle, #a8e6cf 0%, #ff8b94 50%, #ffd3a5 100%)'
        };
        
        pointCloud.style.background = modeColors[mode] + ', linear-gradient(135deg, #1e3c72, #2a5298)';
        
        this.showNotification(`颜色模式已切换至: ${this.getModeName(mode)}`);
    }

    getModeName(mode) {
        const names = {
            temperature: '温度模式',
            depth: '深度模式',
            quality: '质量模式'
        };
        return names[mode] || mode;
    }

    showNotification(message) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #e74c3c, #f39c12);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动消失
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    updateVisualizationForDemo(demoIndex) {
        const demos = [
            {
                name: '焊缝质量分析',
                points: Math.floor(Math.random() * 3000) + 2000,
                temp: { min: 850, max: 1150 },
                quality: (Math.random() * 15 + 80).toFixed(1)
            },
            {
                name: '温度分布图',
                points: Math.floor(Math.random() * 4000) + 3000,
                temp: { min: 900, max: 1300 },
                quality: (Math.random() * 20 + 75).toFixed(1)
            },
            {
                name: '深度轮廓图',
                points: Math.floor(Math.random() * 2500) + 1500,
                temp: { min: 800, max: 1100 },
                quality: (Math.random() * 25 + 70).toFixed(1)
            },
            {
                name: '缺陷检测图',
                points: Math.floor(Math.random() * 3500) + 2500,
                temp: { min: 950, max: 1250 },
                quality: (Math.random() * 10 + 85).toFixed(1)
            }
        ];
        
        const demo = demos[demoIndex];
        this.pointCount = demo.points;
        this.temperatureRange = demo.temp;
        this.qualityScore = demo.quality;
        
        this.updateStats();
        this.showNotification(`已加载: ${demo.name}`);
        
        // 添加加载动画
        this.simulateLoading();
    }

    simulateLoading() {
        const loadingSpinner = document.querySelector('.loading-spinner');
        const pointCloud = document.getElementById('pointCloud');
        
        loadingSpinner.style.display = 'block';
        pointCloud.classList.remove('point-cloud-active');
        
        setTimeout(() => {
            loadingSpinner.style.display = 'none';
            pointCloud.classList.add('point-cloud-active');
        }, 1500);
    }
}

// 全局函数定义
function startVisualization() {
    const visualizer = window.visualizer;
    const pointCloud = document.getElementById('pointCloud');
    const button = event.target;
    
    // 按钮动画效果
    button.style.transform = 'scale(0.95)';
    button.textContent = '正在启动...';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
        button.textContent = '体验中...';
        
        // 激活点云可视化
        pointCloud.classList.add('point-cloud-active');
        document.querySelector('.loading-spinner').style.display = 'none';
        
        visualizer.showNotification('可视化体验已启动！');
        visualizer.isVisualizationActive = true;
        
        setTimeout(() => {
            button.textContent = '重新开始';
        }, 2000);
    }, 1000);
}

function generateRandomData() {
    const visualizer = window.visualizer;
    visualizer.generateInitialData();
    visualizer.simulateLoading();
    visualizer.showNotification('已生成新的随机数据！');
}

function resetVisualization() {
    const visualizer = window.visualizer;
    const pointCloud = document.getElementById('pointCloud');
    
    pointCloud.classList.remove('point-cloud-active');
    document.querySelector('.loading-spinner').style.display = 'block';
    
    // 重置所有控制
    document.getElementById('pointSize').value = 3;
    document.getElementById('pointSizeValue').textContent = '3';
    document.getElementById('colorMode').value = 'temperature';
    
    visualizer.generateInitialData();
    visualizer.showNotification('可视化已重置！');
    
    setTimeout(() => {
        document.querySelector('.loading-spinner').style.display = 'none';
    }, 1000);
}

function exportData() {
    const visualizer = window.visualizer;
    
    // 模拟数据导出
    const exportData = {
        timestamp: new Date().toISOString(),
        pointCount: visualizer.pointCount,
        temperatureRange: visualizer.temperatureRange,
        qualityScore: visualizer.qualityScore,
        settings: {
            pointSize: document.getElementById('pointSize').value,
            colorMode: document.getElementById('colorMode').value
        }
    };
    
    // 创建下载链接
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `welding_data_${Date.now()}.json`;
    downloadLink.click();
    
    URL.revokeObjectURL(url);
    visualizer.showNotification('数据导出完成！');
}

function loadDemo(demoType) {
    const demoMap = {
        'weld1': 0,
        'weld2': 1,
        'weld3': 2,
        'weld4': 3
    };
    
    const visualizer = window.visualizer;
    visualizer.updateVisualizationForDemo(demoMap[demoType] || 0);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 创建全局可视化器实例
    window.visualizer = new WeldingPointCloudVisualizer();
    
    // 添加页面加载动画
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }, 100);
    
    // 添加背景粒子效果
    createBackgroundParticles();
});

function createBackgroundParticles() {
    const particleContainer = document.querySelector('.floating-particles');
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.6 + 0.2});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: float ${Math.random() * 3 + 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        particleContainer.appendChild(particle);
    }
}

// 添加全局样式增强
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        body {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s ease;
        }
        
        .notification {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .cta-button:active {
            animation: pulse 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});
