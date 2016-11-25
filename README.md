# ghost-storage-selectel
Selectel Storage Module for Ghost

## Install

    cd path-to-ghost
    mkdir -p content/storage/ghost-storage-selectel
    cd content/storage/ghost-storage-selectel
    git clone https://github.com/Bu11Terrier/ghost-storage-selectel.git
    
## Configuration

    storage: {
        active: 'ghost-storage-selectel',
        'ghost-storage-selectel': {
            XAuthUser: 'X_AUTH_USER',       // (required)
            XAuthKey: 'X_AUTH_KEY',         // (required)
            XContainer: 'CONTAINER',        // (required)
            
            protocol: 'http',               // (optional) Default: network-path reference
            domain: 'img.example.com',      // (optional)
            folder: ['path', 'to', 'image'] // (optional)
        }
    }
    
## Support

This module works with Ghost 0.10 and 0.11.