# 🎨 CC0 Assets for NFT Platforms

A curated collection of CC0 (Creative Commons Zero) 3D models ready for NFT minting.
All assets are public domain - free to use for any purpose including commercial use.

![License](https://img.shields.io/badge/License-CC0%201.0-brightgreen)
![Models](https://img.shields.io/badge/Models-153%2B-blue)
![Format](https://img.shields.io/badge/Format-GLB-orange)

## 📦 What's Included

```
models/
├── kenney/
│   └── environment/     # 153 Space Kit models (GLB)
├── quaternius/
│   ├── characters/      # Pending download
│   ├── environment/     # Pending download
│   ├── props/           # Pending download
│   ├── vehicles/        # Pending download
│   └── weapons/         # Pending download
└── sketchfab/
    └── [CC0 models]     # Add your own
```

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/0xrise/cc0-assets-nft.git
cd cc0-assets-nft
```

### 2. Browse Models
Open individual GLB files in any 3D viewer:
- [Three.js Editor](https://threejs.org/editor/)
- [Babylon.js Sandbox](https://sandbox.babylonjs.com/)
- [Windows 3D Viewer](https://apps.microsoft.com/detail/9nblggh42ths)
- macOS Preview (Quick Look)

### 3. Use in Your Project
```javascript
// Three.js example
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
loader.load('models/kenney/environment/alien.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

### 4. NFT Integration
See [docs/NFT_INTEGRATION.md](docs/NFT_INTEGRATION.md) for:
- Batch minting scripts
- Metadata templates
- Platform integration guides

## 📊 Model Inventory

| Source | Pack | Count | Category | Status |
|--------|------|-------|----------|--------|
| Kenney | Space Kit | 153 | Environment | ✅ Ready |
| Quaternius | RPG Characters | ~20 | Characters | ⏳ Pending |
| Quaternius | Cute Monsters | ~15 | Characters | ⏳ Pending |
| Quaternius | Animated Mechs | ~10 | Characters | ⏳ Pending |
| Quaternius | Ultimate Spaceships | ~15 | Vehicles | ⏳ Pending |

**Total: 153 models ready, ~200+ pending**

## 🛠️ Tools Included

This repository includes browser-based tools:

### Model Browser & Tagger
```bash
npm install
npm run browser
# Opens http://localhost:3456
```

Features:
- 3D preview with Three.js
- Tag models (Approve/Reject/Skip)
- Export approved models list
- Keyboard shortcuts (A/X/S)

### Batch Minter Integration
```bash
# Export approved models
npm run export-approved

# Mint NFTs
npm run mint -- --collection "Space Collection"
```

## ⚖️ License

**All assets in this repository are CC0 (Creative Commons Zero).**

This means:
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No attribution required (but appreciated)

See [ATTRIBUTION.md](ATTRIBUTION.md) for:
- Full license text
- Individual author credits
- Source URLs
- NFT usage guidelines

## 🙏 Attribution

While not legally required by CC0, we acknowledge:

### Kenney (www.kenney.nl)
- 153 Space Kit models
- https://kenney.nl/assets/space-kit

### Quaternius (quaternius.com)
- Character and environment packs
- https://quaternius.com/

See [ATTRIBUTION.md](ATTRIBUTION.md) for complete details.

## 🤝 Contributing

### Adding New Models
1. Ensure models are CC0 licensed
2. Place in appropriate `models/[source]/[category]/` directory
3. Update ATTRIBUTION.md with source info
4. Submit pull request

### Adding Quaternius Models
Download from Google Drive links in [ATTRIBUTION.md](ATTRIBUTION.md) and place in:
```
models/quaternius/[category]/[pack-name]/
```

## 🏢 Used By

- [Ekza Space](https://ekza.space) - NFT minting platform

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/0xrise/cc0-assets-nft/issues)
- **Discussions:** [GitHub Discussions](https://github.com/0xrise/cc0-assets-nft/discussions)

## 📝 Legal

This repository is a collection of public domain assets. 
See [ATTRIBUTION.md](ATTRIBUTION.md) for complete legal information.

**Disclaimer:** We are not affiliated with the original asset creators beyond using their CC0-licensed work.

---

Made with ❤️ by [Ekza Space](https://ekza.space)
