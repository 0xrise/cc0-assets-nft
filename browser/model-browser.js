#!/usr/bin/env node
/**
 * Local 3D Model Browser & Tagger
 * Browse GLB models and tag for production minting
 * 
 * Usage: node model-browser.js
 * Open: http://localhost:3456
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3456;

// Use repository's models directory (relative to browser/ folder)
const ASSETS_DIR = path.join(__dirname, '..', 'models');
const DATA_DIR = path.join(__dirname, '..', 'data');
const TAGS_FILE = path.join(DATA_DIR, 'model-tags.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure tags file exists
if (!fs.existsSync(TAGS_FILE)) {
  fs.writeFileSync(TAGS_FILE, JSON.stringify({}, null, 2));
}

// Load tags
function loadTags() {
  try {
    return JSON.parse(fs.readFileSync(TAGS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

// Save tags
function saveTags(tags) {
  fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2));
}

// Scan directory for GLB files
function scanModels(dir, basePath = '') {
  const models = [];
  const fullPath = path.join(ASSETS_DIR, dir);
  
  if (!fs.existsSync(fullPath)) return models;
  
  const items = fs.readdirSync(fullPath);
  
  for (const item of items) {
    const itemPath = path.join(fullPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      models.push(...scanModels(path.join(dir, item), path.join(basePath, item)));
    } else if (item.endsWith('.glb') || item.endsWith('.gltf')) {
      models.push({
        id: path.join(basePath, item).replace(/\\/g, '/'),
        name: item.replace(/\.glb$|\.gltf$/, ''),
        path: path.join(dir, item).replace(/\\/g, '/'),
        size: stat.size,
        modified: stat.mtime
      });
    }
  }
  
  return models;
}

// API: Get all models
app.get('/api/models', (req, res) => {
  const tags = loadTags();
  const models = [];
  
  // Scan all model directories
  const sources = ['kenney', 'quaternius', 'sketchfab'];
  
  for (const source of sources) {
    const sourceModels = scanModels(source);
    models.push(...sourceModels.map(m => ({
      ...m,
      source: source,
      tag: tags[m.id] || 'pending'
    })));
  }
  
  res.json(models);
});

// API: Get single model file
app.get('/api/model', (req, res) => {
  const modelPath = req.query.path;
  if (!modelPath) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }
  
  const fullPath = path.join(ASSETS_DIR, modelPath);
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Model not found' });
  }
  
  res.sendFile(fullPath);
});

// API: Update model tag
app.post('/api/tag', (req, res) => {
  const { id, tag } = req.body;
  
  if (!id || !['approved', 'rejected', 'pending'].includes(tag)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const tags = loadTags();
  tags[id] = tag;
  saveTags(tags);
  
  res.json({ success: true, id, tag });
});

// API: Bulk update tags
app.post('/api/tags/bulk', (req, res) => {
  const { ids, tag } = req.body;
  
  if (!Array.isArray(ids) || !['approved', 'rejected', 'pending'].includes(tag)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  
  const tags = loadTags();
  ids.forEach(id => {
    tags[id] = tag;
  });
  saveTags(tags);
  
  res.json({ success: true, count: ids.length });
});

// API: Get approved models for export
app.get('/api/export/approved', (req, res) => {
  const tags = loadTags();
  const approvedIds = Object.entries(tags)
    .filter(([_, tag]) => tag === 'approved')
    .map(([id, _]) => id);
  
  res.json({
    approved: approvedIds,
    count: approvedIds.length,
    exportPath: path.join(DATA_DIR, 'approved-models.json')
  });
});

// API: Export approved models to file
app.post('/api/export/approved', (req, res) => {
  const tags = loadTags();
  const sources = ['kenney', 'quaternius', 'sketchfab'];
  let allModels = [];
  
  for (const source of sources) {
    allModels = allModels.concat(scanModels(source));
  }
  
  const approvedModels = allModels
    .filter(m => tags[m.id] === 'approved')
    .map(m => ({
      ...m,
      fullPath: path.join(ASSETS_DIR, m.path)
    }));
  
  const exportPath = path.join(DATA_DIR, 'approved-models.json');
  fs.writeFileSync(exportPath, JSON.stringify(approvedModels, null, 2));
  
  res.json({
    success: true,
    count: approvedModels.length,
    exportPath
  });
});

// Create public directory with HTML
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CC0 Asset Browser & Tagger</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      height: 100vh;
      display: flex;
      overflow: hidden;
    }
    .sidebar {
      width: 350px;
      background: #16213e;
      border-right: 1px solid #0f3460;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 20px;
      border-bottom: 1px solid #0f3460;
    }
    .header h1 {
      font-size: 18px;
      color: #e94560;
      margin-bottom: 10px;
    }
    .stats {
      display: flex;
      gap: 15px;
      font-size: 12px;
    }
    .stat { display: flex; align-items: center; gap: 5px; }
    .stat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .stat-dot.approved { background: #4ade80; }
    .stat-dot.rejected { background: #f87171; }
    .stat-dot.pending { background: #fbbf24; }
    .filters {
      padding: 15px 20px;
      display: flex;
      gap: 10px;
      border-bottom: 1px solid #0f3460;
    }
    .filter-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      background: #0f3460;
      color: #fff;
      font-size: 12px;
      cursor: pointer;
    }
    .filter-btn:hover { background: #1a4a7a; }
    .filter-btn.active { background: #e94560; }
    .model-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    .model-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      margin-bottom: 8px;
      background: #1a1a2e;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid transparent;
    }
    .model-item:hover { background: #252540; border-color: #0f3460; }
    .model-item.selected { border-color: #e94560; background: #2a1f3d; }
    .model-item.approved { border-left: 4px solid #4ade80; }
    .model-item.rejected { border-left: 4px solid #f87171; }
    .model-item.pending { border-left: 4px solid #fbbf24; }
    .model-thumb {
      width: 50px;
      height: 50px;
      background: #0f3460;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .model-info { flex: 1; min-width: 0; }
    .model-name {
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .model-meta {
      font-size: 11px;
      color: #888;
      margin-top: 4px;
    }
    .model-tag {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .model-tag.approved { background: #4ade8020; color: #4ade80; }
    .model-tag.rejected { background: #f8717120; color: #f87171; }
    .model-tag.pending { background: #fbbf2420; color: #fbbf24; }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .viewer-container {
      flex: 1;
      position: relative;
      background: #0a0a15;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
    }
    .viewer-overlay {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      pointer-events: none;
    }
    .model-title {
      background: rgba(0,0,0,0.7);
      padding: 10px 20px;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }
    .model-title h2 {
      font-size: 18px;
      margin-bottom: 4px;
    }
    .model-title p {
      font-size: 12px;
      color: #888;
    }
    .tag-actions {
      display: flex;
      gap: 10px;
      pointer-events: auto;
    }
    .tag-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tag-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .tag-btn.approve { background: #4ade80; color: #000; }
    .tag-btn.reject { background: #f87171; color: #000; }
    .tag-btn.skip { background: #fbbf24; color: #000; }
    .toolbar {
      padding: 15px 20px;
      background: #16213e;
      border-top: 1px solid #0f3460;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .toolbar-left { display: flex; gap: 10px; }
    .toolbar-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      background: #0f3460;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
    }
    .toolbar-btn:hover { background: #1a4a7a; }
    .toolbar-btn.primary { background: #e94560; }
    .toolbar-btn.primary:hover { background: #ff5a7a; }
    .progress { font-size: 13px; color: #888; }
    .empty-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #666;
    }
    .empty-state h3 { font-size: 24px; margin-bottom: 10px; }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 18px;
      color: #e94560;
    }
    .keyboard-shortcuts {
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(0,0,0,0.7);
      padding: 15px;
      border-radius: 8px;
      font-size: 11px;
      backdrop-filter: blur(10px);
    }
    .keyboard-shortcuts h4 {
      margin-bottom: 8px;
      color: #e94560;
    }
    .shortcut {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 4px;
    }
    kbd {
      background: #333;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="sidebar">
    <div class="header">
      <h1>🎨 CC0 Asset Browser</h1>
      <div class="stats">
        <div class="stat">
          <div class="stat-dot approved"></div>
          <span id="count-approved">0</span>
        </div>
        <div class="stat">
          <div class="stat-dot rejected"></div>
          <span id="count-rejected">0</span>
        </div>
        <div class="stat">
          <div class="stat-dot pending"></div>
          <span id="count-pending">0</span>
        </div>
      </div>
    </div>
    
    <div class="filters">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="pending">Pending</button>
      <button class="filter-btn" data-filter="approved">Approved</button>
      <button class="filter-btn" data-filter="rejected">Rejected</button>
    </div>
    
    <div class="model-list" id="model-list">
      <div class="loading">Loading models...</div>
    </div>
  </div>
  
  <div class="main">
    <div class="viewer-container">
      <div id="canvas-container"></div>
      
      <div class="viewer-overlay">
        <div class="model-title" id="model-title" style="display: none;">
          <h2>Select a model</h2>
          <p>Click any model from the list to preview</p>
        </div>
        
        <div class="tag-actions" id="tag-actions" style="display: none;">
          <button class="tag-btn reject" onclick="tagCurrent('rejected')">❌ Reject</button>
          <button class="tag-btn skip" onclick="tagCurrent('pending')">⏭️ Skip</button>
          <button class="tag-btn approve" onclick="tagCurrent('approved')">✅ Approve</button>
        </div>
      </div>
      
      <div class="empty-state" id="empty-state">
        <h3>👋 Welcome!</h3>
        <p>Select a model from the sidebar to start reviewing</p>
      </div>
      
      <div class="loading" id="loading" style="display: none;">Loading 3D model...</div>
      
      <div class="keyboard-shortcuts">
        <h4>Shortcuts</h4>
        <div class="shortcut"><span>Approve</span> <kbd>A</kbd></div>
        <div class="shortcut"><span>Reject</span> <kbd>X</kbd></div>
        <div class="shortcut"><span>Skip</span> <kbd>S</kbd></div>
        <div class="shortcut"><span>Next</span> <kbd>→</kbd></div>
        <div class="shortcut"><span>Prev</span> <kbd>←</kbd></div>
      </div>
    </div>
    
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" onclick="prevModel()">← Previous</button>
        <button class="toolbar-btn" onclick="nextModel()">Next →</button>
        <button class="toolbar-btn" onclick="resetView()">Reset View</button>
      </div>
      
      <div class="progress">
        <span id="current-index">0</span> / <span id="total-count">0</span>
      </div>
      
      <button class="toolbar-btn primary" onclick="exportApproved()">
        📦 Export Approved (<span id="export-count">0</span>)
      </button>
    </div>
  </div>

  <script>
    let models = [];
    let currentIndex = -1;
    let currentFilter = 'all';
    let scene, camera, renderer, controls, currentModel;
    
    function initViewer() {
      const container = document.getElementById('canvas-container');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a15);
      
      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(3, 2, 3);
      
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);
      
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(5, 10, 7);
      dirLight.castShadow = true;
      scene.add(dirLight);
      
      const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
      backLight.position.set(-5, 5, -5);
      scene.add(backLight);
      
      const grid = new THREE.GridHelper(10, 10, 0x333333, 0x222222);
      scene.add(grid);
      
      animate();
      window.addEventListener('resize', onWindowResize);
    }
    
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    
    function onWindowResize() {
      const container = document.getElementById('canvas-container');
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    function loadModel(model) {
      if (currentModel) scene.remove(currentModel);
      
      document.getElementById('loading').style.display = 'block';
      document.getElementById('empty-state').style.display = 'none';
      
      const loader = new THREE.GLTFLoader();
      loader.load('/api/model?path=' + encodeURIComponent(model.path), (gltf) => {
        currentModel = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        currentModel.scale.setScalar(scale);
        
        currentModel.position.sub(center.multiplyScalar(scale));
        currentModel.position.y += size.y * scale / 2;
        
        scene.add(currentModel);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('model-title').style.display = 'block';
        document.getElementById('tag-actions').style.display = 'flex';
        
        document.querySelector('#model-title h2').textContent = model.name;
        document.querySelector('#model-title p').textContent = 
          model.source + ' • ' + (model.size / 1024 / 1024).toFixed(2) + ' MB';
        
        resetView();
      }, undefined, (error) => {
        console.error('Error loading model:', error);
        document.getElementById('loading').textContent = 'Error loading model';
      });
    }
    
    function resetView() {
      camera.position.set(3, 2, 3);
      camera.lookAt(0, 0, 0);
      controls.reset();
    }
    
    async function tagCurrent(tag) {
      if (currentIndex < 0) return;
      const model = models[currentIndex];
      model.tag = tag;
      
      await fetch('/api/tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: model.id, tag })
      });
      
      updateModelList();
      updateStats();
      nextModel();
    }
    
    function selectModel(index) {
      currentIndex = index;
      const model = models[index];
      loadModel(model);
      updateModelList();
      document.getElementById('current-index').textContent = index + 1;
    }
    
    function nextModel() {
      const filtered = getFilteredModels();
      const currentFilteredIndex = filtered.findIndex(m => m.id === models[currentIndex]?.id);
      if (currentFilteredIndex < filtered.length - 1) {
        const nextModel = filtered[currentFilteredIndex + 1];
        const nextIndex = models.findIndex(m => m.id === nextModel.id);
        selectModel(nextIndex);
      }
    }
    
    function prevModel() {
      const filtered = getFilteredModels();
      const currentFilteredIndex = filtered.findIndex(m => m.id === models[currentIndex]?.id);
      if (currentFilteredIndex > 0) {
        const prevModel = filtered[currentFilteredIndex - 1];
        const prevIndex = models.findIndex(m => m.id === prevModel.id);
        selectModel(prevIndex);
      }
    }
    
    function getFilteredModels() {
      if (currentFilter === 'all') return models;
      return models.filter(m => m.tag === currentFilter);
    }
    
    function updateModelList() {
      const list = document.getElementById('model-list');
      const filtered = getFilteredModels();
      
      list.innerHTML = filtered.map((model, i) => \`
        <div class="model-item \${model.tag} \${models[currentIndex]?.id === model.id ? 'selected' : ''}"
             onclick="selectModel(\${models.findIndex(m => m.id === model.id)})">
          <div class="model-thumb">📦</div>
          <div class="model-info">
            <div class="model-name">\${model.name}</div>
            <div class="model-meta">\${model.source} • \${(model.size/1024/1024).toFixed(1)} MB</div>
          </div>
          <div class="model-tag \${model.tag}">\${model.tag}</div>
        </div>
      \`).join('');
    }
    
    function updateStats() {
      const approved = models.filter(m => m.tag === 'approved').length;
      const rejected = models.filter(m => m.tag === 'rejected').length;
      const pending = models.filter(m => m.tag === 'pending').length;
      
      document.getElementById('count-approved').textContent = approved;
      document.getElementById('count-rejected').textContent = rejected;
      document.getElementById('count-pending').textContent = pending;
      document.getElementById('total-count').textContent = models.length;
      document.getElementById('export-count').textContent = approved;
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        updateModelList();
      });
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch(e.key.toLowerCase()) {
        case 'a': tagCurrent('approved'); break;
        case 'x': tagCurrent('rejected'); break;
        case 's': tagCurrent('pending'); break;
        case 'arrowright': nextModel(); break;
        case 'arrowleft': prevModel(); break;
      }
    });
    
    async function exportApproved() {
      const res = await fetch('/api/export/approved', { method: 'POST' });
      const data = await res.json();
      alert(\`Exported \${data.count} approved models to:\n\${data.exportPath}\`);
    }
    
    async function loadModels() {
      const res = await fetch('/api/models');
      models = await res.json();
      updateModelList();
      updateStats();
      if (models.length > 0) selectModel(0);
    }
    
    initViewer();
    loadModels();
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtml);

app.listen(PORT, () => {
  console.log(\`
╔══════════════════════════════════════════════════════════╗
║  🎨 CC0 Asset Browser & Tagger                           ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Server running at: http://localhost:\${PORT}              ║
║                                                          ║
║  Features:                                               ║
║  • Browse all GLB models in the repository              ║
║  • 3D preview with Three.js                             ║
║  • Tag: ✅ Approve / ❌ Reject / ⏭️ Skip                  ║
║  • Keyboard shortcuts (A/X/S/Arrows)                    ║
║  • Export approved models for batch minting             ║
║                                                          ║
║  Shortcuts:                                              ║
║  A = Approve  X = Reject  S = Skip                      ║
║  ← = Previous  → = Next                                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  \`);
});
