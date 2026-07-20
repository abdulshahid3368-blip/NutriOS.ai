import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutrios.app',
  appName: 'NutriOS AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
