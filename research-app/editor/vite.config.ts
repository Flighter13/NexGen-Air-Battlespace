import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({root:'editor',plugins:[react()],base:'./',build:{outDir:'../editor-dist',emptyOutDir:true}});
