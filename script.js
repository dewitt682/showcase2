/**
 * 浪漫指纹时间轴 - 核心逻辑
 */

// --- 全局变量 ---
let pressTimer;
const LONG_PRESS_DURATION = 1500; // 1.5秒长按
let isPressed = false;

// DOM 元素
const fingerprintContainer = document.getElementById('fingerprint-container');
const fingerprintIcon = document.querySelector('.fingerprint-icon');
const timelineContainer = document.getElementById('timeline-container');
const timelineLine = document.querySelector('.timeline-line');
const nodes = document.querySelectorAll('.node');
const fireworksCanvas = document.getElementById('fireworks-canvas');
const roseContainer = document.getElementById('rose-container');
const finalText = document.getElementById('final-text');

// --- 1. 指纹按压逻辑 ---
function startPress(e) {
    e.preventDefault();
    if (isPressed) return;
    
    fingerprintIcon.classList.add('scanning');
    pressTimer = setTimeout(() => {
        triggerTimeline();
    }, LONG_PRESS_DURATION);
}

function cancelPress() {
    clearTimeout(pressTimer);
    if (!isPressed) {
        fingerprintIcon.classList.remove('scanning');
    }
}

fingerprintIcon.addEventListener('touchstart', startPress);
fingerprintIcon.addEventListener('touchend', cancelPress);
fingerprintIcon.addEventListener('mousedown', startPress);
fingerprintIcon.addEventListener('mouseup', cancelPress);
fingerprintIcon.addEventListener('mouseleave', cancelPress);

// --- 2. 时间轴逻辑 ---
function triggerTimeline() {
    isPressed = true;
    fingerprintIcon.classList.add('scanning');
    
    // 渐隐指纹
    setTimeout(() => {
        fingerprintContainer.classList.add('hidden');
        
        // 开启时间轴
        setTimeout(() => {
            timelineContainer.classList.add('active');
            startTimelineAnimation();
        }, 1000);
    }, 500);
}

function startTimelineAnimation() {
    // 时间轴线条向下延伸
    timelineLine.style.height = '100%';
    
    // 节点依次出现 - 调慢速度，给用户更多阅读时间
    const nodeDelays = [2000, 5000, 8000, 11000];
    nodes.forEach((node, index) => {
        setTimeout(() => {
            node.classList.add('visible');
            if (index === nodes.length - 1) {
                // 最后一个节点出现后，等待一会儿开启烟花和玫瑰
                setTimeout(triggerCelebration, 3000);
            }
        }, nodeDelays[index]);
    });
}

// --- 3. 庆祝环节 (烟花 + 玫瑰) ---
function triggerCelebration() {
    // 隐藏时间轴
    timelineContainer.style.opacity = '0';
    setTimeout(() => {
        timelineContainer.classList.add('hidden');
    }, 1000);

    // 开启烟花
    initFireworks();
    
    // 开启 3D 玫瑰与粒子
    initThreeJS();
}

// --- 4. 烟花系统 (Canvas) ---
function initFireworks() {
    const ctx = fireworksCanvas.getContext('2d');
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['255, 49, 49', '255, 77, 109', '255, 117, 143', '255, 182, 193', '255, 105, 0'];

    class FireworkParticle {
        constructor(x, y, color, isSpark = false) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.isSpark = isSpark;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = isSpark ? Math.random() * 1.2 + 0.4 : Math.random() * 4 + 1.2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            
            this.friction = isSpark ? 0.91 : 0.95;
            this.gravity = isSpark ? 0.02 : 0.05;
            this.alpha = 1;
            this.decay = isSpark ? Math.random() * 0.05 + 0.03 : Math.random() * 0.018 + 0.01; 
            this.history = [];
            this.historyLength = isSpark ? 2 : 6;
            this.lineWidth = isSpark ? 0.5 : (Math.random() * 1.0 + 0.3);
        }

        update() {
            this.history.push({x: this.x, y: this.y});
            if (this.history.length > this.historyLength) {
                this.history.shift();
            }
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;

            if (!this.isSpark && this.alpha > 0.5 && Math.random() < 0.04) {
                particles.push(new FireworkParticle(this.x, this.y, this.color, true));
            }
        }

        draw() {
            ctx.beginPath();
            if (this.history.length > 0) {
                ctx.moveTo(this.history[0].x, this.history[0].y);
            } else {
                ctx.moveTo(this.x, this.y);
            }
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = `rgba(${this.color}, ${this.alpha})`;
            ctx.lineWidth = this.lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            if (!this.isSpark) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.lineWidth * 0.6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.fill();
            }
        }
    }

    function createFirework(x, y) {
        const count = Math.floor(Math.random() * 30) + 30; 
        const color = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < count; i++) {
            particles.push(new FireworkParticle(x, y, color));
        }
    }

    function animate() {
        if (!isPressed) return;
        requestAnimationFrame(animate);
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; 
        ctx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            if (p.alpha > 0) {
                p.update();
                p.draw();
            } else {
                particles.splice(i, 1);
            }
        }

        if (Math.random() < 0.045) {
            createFirework(
                window.innerWidth * 0.2 + Math.random() * window.innerWidth * 0.6,
                window.innerHeight * 0.1 + Math.random() * window.innerHeight * 0.4
            );
        }
    }

    animate();
}

// --- 5. Three.js (3D 玫瑰 & 粒子汇聚) ---
function initThreeJS() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    roseContainer.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xff4d6d, 1.8);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5.5;

    // 粒子系统
    const particleCount = 350; 
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const targetArray = new Float32Array(particleCount * 3);
    const sizeArray = new Float32Array(particleCount); 
    const alphaArray = new Float32Array(particleCount); 
    const colorArray = new Float32Array(particleCount * 3);
    const randomOffsets = new Float32Array(particleCount);

    const redTones = [
        new THREE.Color(0xff4d6d),
        new THREE.Color(0xff1a1a),
        new THREE.Color(0x8b0000),
        new THREE.Color(0xff69b4),
        new THREE.Color(0xcd5c5c),
    ];

    for (let i = 0; i < particleCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 30;
    }

    for (let i = 0; i < particleCount; i++) {
        randomOffsets[i] = Math.random() * Math.PI * 2;
        sizeArray[i] = Math.random() * 0.4 + 0.2; 
        alphaArray[i] = Math.random() * 0.5 + 0.5;      
        const color = redTones[Math.floor(Math.random() * redTones.length)];
        colorArray[i * 3] = color.r;
        colorArray[i * 3 + 1] = color.g;
        colorArray[i * 3 + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('pSize', new THREE.BufferAttribute(sizeArray, 1));
    particlesGeometry.setAttribute('pAlpha', new THREE.BufferAttribute(alphaArray, 1));
    particlesGeometry.setAttribute('pColor', new THREE.BufferAttribute(colorArray, 3));
    
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1.0)'); 
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.2)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particlesMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uTexture: { value: particleTexture },
            uBaseOpacity: { value: 1.0 }
        },
        vertexShader: `
            attribute float pSize;
            attribute float pAlpha;
            attribute vec3 pColor;
            varying float vAlpha;
            varying vec3 vColor;
            void main() {
                vAlpha = pAlpha;
                vColor = pColor;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = pSize * (160.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform float uBaseOpacity;
            varying float vAlpha;
            varying vec3 vColor;
            void main() {
                vec4 texColor = texture2D(uTexture, gl_PointCoord);
                gl_FragColor = texColor * vec4(vColor, vAlpha * uBaseOpacity);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleMesh);

    // ==========================================
    // 关键修复区：提取变量与控制逻辑，解决异步竞争
    // ==========================================

    // 将动画状态提升到模型加载前面，防止异步报错
    let progress = 0;
    let time = 0;
    const convergeSpeed = 0.004;
    let phase = 0; 
    let phase1StartTime = 0;
    let roseModel = null;

    // 根据设备自适应缩放（电脑端 0.5，手机端略微缩小为 0.35 防止越界）
    const finalScale = window.innerWidth < 768 ? 1 : 1;

    // 立刻计算爱心形状，不等模型下载
    function updateTargetArrayToHeartShape() {
        for (let i = 0; i < particleCount; i++) {
            const t = Math.random() * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            const scale = 0.08;
            const z = (Math.random() - 0.5) * 0.15;
            targetArray[i * 3] = x * scale;
            targetArray[i * 3 + 1] = y * scale - 0.2;
            targetArray[i * 3 + 2] = z;
        }
    }
    updateTargetArrayToHeartShape();

    // 独立的显示花朵逻辑
    function revealRose() {
        if (!roseModel) return;
        roseModel.visible = true;
        roseModel.scale.set(0, 0, 0); // 从0开始放大
        new TWEEN.Tween(roseModel.scale)
            .to({ x: finalScale, y: finalScale, z: finalScale }, 1500)
            .easing(TWEEN.Easing.Back.Out)
            .start();
    }

    // 模型加载逻辑
    const loader = new THREE.GLTFLoader();
    
    loader.load('flower.gltf', 
        (gltf) => {
            roseModel = gltf.scene;
            roseModel.position.y = -2.9;
            scene.add(roseModel);

            // 修复网络延迟问题：如果下载完时已经到了出场时间(phase=2)，直接出场！
            if (phase >= 2) {
                revealRose();
            } else {
                roseModel.visible = false;
            }
        },
        undefined,
        (error) => {
            // 备用花朵兜底方案
            roseModel = new THREE.Group();
            const petalGeometry = new THREE.SphereGeometry(0.5, 20, 20); 
            const petalMaterial = new THREE.MeshPhongMaterial({ color: 0xff4d6d, shininess: 80 });
            for (let i = 0; i < 6; i++) {
                const petal = new THREE.Mesh(petalGeometry, petalMaterial);
                petal.scale.set(1, 0.3, 1.5);
                petal.position.x = Math.cos(i * Math.PI / 3) * 0.6;
                petal.position.z = Math.sin(i * Math.PI / 3) * 0.6;
                petal.rotation.y = -i * Math.PI / 3;
                petal.rotation.x = 0.5;
                roseModel.add(petal);
            }
            const centerGeometry = new THREE.SphereGeometry(0.35, 20, 20);
            const centerMaterial = new THREE.MeshPhongMaterial({ color: 0x8b0000 });
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            roseModel.add(center);
            const stemGeometry = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 12);
            const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x228b22 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.y = -1.2;
            roseModel.add(stem);
            scene.add(roseModel);

            // 同样判断是否直接出场
            if (phase >= 2) {
                revealRose();
            } else {
                roseModel.visible = false;
            }
        }
    );

    // ==========================================
    // 动画循环
    // ==========================================
    function animate() {
        requestAnimationFrame(animate);
        time += 0.02;
        particlesMaterial.uniforms.uTime.value = time;

        if (phase === 0) {
            progress += convergeSpeed;
            const positions = particlesGeometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                let i3 = i * 3;
                let px = positions[i3];
                let py = positions[i3+1];
                let pz = positions[i3+2];
                
                let tx = targetArray[i3];
                let ty = targetArray[i3+1];
                let tz = targetArray[i3+2];
                
                let dx = tx - px;
                let dy = ty - py;
                let dz = tz - pz;
                
                let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                let force = Math.min(dist * 0.15, 1.5);
                let offset = randomOffsets[i];
                
                let noiseX = Math.sin(py * 0.5 + time + offset) * Math.cos(pz * 0.5 + time);
                let noiseY = Math.sin(pz * 0.5 + time + offset) * Math.cos(px * 0.5 + time);
                let noiseZ = Math.sin(px * 0.5 + time + offset) * Math.cos(py * 0.5 + time);
                
                positions[i3] += dx * 0.015 + noiseX * force * 0.04;
                positions[i3+1] += dy * 0.015 + noiseY * force * 0.04;
                positions[i3+2] += dz * 0.015 + noiseZ * force * 0.04;
            }
            particlesGeometry.attributes.position.needsUpdate = true;

            if (progress >= 1.5) {
                phase = 1;
                phase1StartTime = Date.now();
            }
        } else if (phase === 1) {
            const positions = particlesGeometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                let i3 = i * 3;
                let offset = randomOffsets[i];
                positions[i3] += Math.sin(time * 1.2 + offset) * 0.0012;
                positions[i3+1] += Math.cos(time * 1.2 + offset) * 0.0012;
                positions[i3+2] += Math.sin(time * 1.2 + offset * 0.5) * 0.0012;
            }
            particlesGeometry.attributes.position.needsUpdate = true;

            const currentTime = Date.now();
            const minWaitTime = 3000; 

            // 进入阶段 2 (粒子消失，花朵出现)
            if (currentTime - phase1StartTime > minWaitTime) {
                phase = 2; 
                new TWEEN.Tween(particlesMaterial.uniforms.uBaseOpacity).to({ value: 0 }, 1500).start();
                
                // 此时如果模型已经下好了，直接显示；如果还没下好，就等 loader.load 回调触发时显示
                if (roseModel) {
                    revealRose();
                }

                setTimeout(() => {
                    finalText.classList.remove('hidden');
                    setTimeout(() => finalText.classList.add('visible'), 100);
                }, 800);
            }
        }

        if (roseModel && roseModel.visible) {
            roseModel.rotation.y += 0.006;
        }
        
        const currentRotationSpeed = (phase === 0) ? 0.002 : 0.006;
        particleMesh.rotation.y += currentRotationSpeed;

        TWEEN.update();
        renderer.render(scene, camera);
    }

    // 引入简单的 Tween 逻辑 (修复了缺失 Easing 导致白屏的 Bug)
    window.TWEEN = window.TWEEN || {
        _tweens: [],
        Easing: {
            Back: {
                Out: function (k) {
                    var s = 1.70158;
                    return --k * k * ((s + 1) * k + s) + 1;
                }
            }
        },
        Tween: function(obj) {
            this.obj = obj;
            this.to = function(target, duration) {
                this.target = target;
                this.duration = duration;
                this.start = function() {
                    this.startTime = Date.now();
                    this.initial = {};
                    for(let key in target) this.initial[key] = obj[key];
                    TWEEN._tweens.push(this);
                    return this;
                };
                this.easing = function() { return this; }; // 保留链式调用
                return this;
            };
        },
        update: function() {
            const now = Date.now();
            TWEEN._tweens = TWEEN._tweens.filter(t => {
                const elapsed = Math.min((now - t.startTime) / t.duration, 1);
                if (elapsed >= 1) {
                    for(let key in t.target) t.obj[key] = t.target[key];
                    return false;
                }
                for(let key in t.target) {
                    t.obj[key] = t.initial[key] + (t.target[key] - t.initial[key]) * elapsed;
                }
                return true;
            });
        }
    };

    animate();
}

// 窗口大小调整
window.addEventListener('resize', () => {
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;

});







