'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsPanelProps {
  user?: any;
  onClose?: () => void;
}

export function SettingsPanel({ user, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: '',
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
      agentUpdates: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      apiKey: 'sk-agenly_' + Math.random().toString(36).substr(2, 32),
    },
    appearance: {
      theme: 'dark',
      language: 'fr',
      fontSize: 'medium',
    },
    integrations: {
      openaiApiKey: '',
      googleCalendar: false,
      slack: false,
      teams: false,
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'integrations', label: 'Intégrations', icon: Globe },
  ];

  const handleSave = () => {
    // TODO: Save settings to backend
    console.log('Saving settings:', settings);
    alert('Paramètres sauvegardés !');
  };

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const renderProfileSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Nom d'affichage
        </label>
        <input
          type="text"
          value={settings.profile.displayName}
          onChange={(e) => handleSettingChange('profile', 'displayName', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Email
        </label>
        <input
          type="email"
          value={settings.profile.email}
          onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Bio
        </label>
        <textarea
          value={settings.profile.bio}
          onChange={(e) => handleSettingChange('profile', 'bio', e.target.value)}
          rows={3}
          placeholder="Parlez-nous de vous..."
          className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200 resize-none"
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {Object.entries(settings.notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">
              {key === 'emailNotifications' && 'Notifications par email'}
              {key === 'pushNotifications' && 'Notifications push'}
              {key === 'weeklyReports' && 'Rapports hebdomadaires'}
              {key === 'agentUpdates' && 'Mises à jour des agents'}
            </div>
            <div className="text-white/60 text-sm">
              {key === 'emailNotifications' && 'Recevez des notifications par email'}
              {key === 'pushNotifications' && 'Recevez des notifications push'}
              {key === 'weeklyReports' && 'Recevez un rapport hebdomadaire'}
              {key === 'agentUpdates' && 'Soyez notifié des mises à jour'}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Authentification à deux facteurs
        </label>
        <div className="flex items-center justify-between">
          <span className="text-white/70">Sécurisez votre compte avec 2FA</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.security.twoFactorAuth}
              onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Délai d'expiration de session (minutes)
        </label>
        <input
          type="number"
          value={settings.security.sessionTimeout}
          onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
          min="5"
          max="480"
          className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Clé API
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={settings.security.apiKey}
            readOnly
            className="w-full px-4 py-3 pr-12 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
          >
            {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-white/60 text-sm mt-1">
          Utilisez cette clé pour accéder à l'API AGENLY
        </p>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Thème
        </label>
        <select
          value={settings.appearance.theme}
          onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
        >
          <option value="dark">Sombre</option>
          <option value="light">Clair</option>
          <option value="auto">Automatique</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Langue
        </label>
        <select
          value={settings.appearance.language}
          onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/90 mb-2">
          Clé API OpenAI
        </label>
        <input
          type="password"
          value={settings.integrations.openaiApiKey}
          onChange={(e) => handleSettingChange('integrations', 'openaiApiKey', e.target.value)}
          placeholder="sk-..."
          className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-200"
        />
      </div>
      
      <div className="space-y-3">
        <h4 className="text-white font-medium">Intégrations disponibles</h4>
        {[
          { key: 'googleCalendar', label: 'Google Calendar' },
          { key: 'slack', label: 'Slack' },
          { key: 'teams', label: 'Microsoft Teams' },
        ].map((integration) => (
          <div key={integration.key} className="flex items-center justify-between">
            <span className="text-white/90">{integration.label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.integrations[integration.key as keyof typeof settings.integrations] as boolean}
                onChange={(e) => handleSettingChange('integrations', integration.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Paramètres</h2>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} className="mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Card className="glass">
            <CardHeader>
              <CardTitle>
                {tabs.find(tab => tab.id === activeTab)?.label}
              </CardTitle>
              <CardDescription>
                {activeTab === 'profile' && 'Gérez vos informations personnelles'}
                {activeTab === 'notifications' && 'Configurez vos préférences de notification'}
                {activeTab === 'security' && 'Sécurisez votre compte'}
                {activeTab === 'appearance' && 'Personnalisez l\'apparence'}
                {activeTab === 'integrations' && 'Connectez vos services externes'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeTab === 'profile' && renderProfileSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'security' && renderSecuritySettings()}
              {activeTab === 'appearance' && renderAppearanceSettings()}
              {activeTab === 'integrations' && renderIntegrationSettings()}
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <Button onClick={handleSave} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder les paramètres
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




