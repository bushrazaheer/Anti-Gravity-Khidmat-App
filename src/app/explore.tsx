import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initGemini, hasGeminiKey } from '../engine/gemini';
import { agent, clearTraces } from '../engine/AntigravityAgent';

export default function ExploreScreen() {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(hasGeminiKey());

  const handleSaveKey = () => {
    if (apiKey.trim().length > 10) {
      initGemini(apiKey.trim());
      setIsConfigured(true);
      Alert.alert('Success', 'Gemini API Key configured successfully!');
    } else {
      Alert.alert('Error', 'Please enter a valid API key.');
    }
  };

  const handleSimulateDispute = () => {
    agent.simulateDispute();
  };

  const handleClearLogs = () => {
    clearTraces();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Antigravity Dashboard</Text>
          <Text style={styles.subtitle}>Configure AI Orchestrator Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. API Integration</Text>
          <Text style={styles.description}>
            To enable real LLM intent parsing, provide your Google Gemini API key. Without it, the app uses a simulated heuristic engine.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="AIzaSy..."
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
            />
            <TouchableOpacity 
              style={[styles.saveButton, isConfigured && styles.saveButtonSuccess]} 
              onPress={handleSaveKey}
            >
              <Text style={styles.saveButtonText}>
                {isConfigured ? 'Update Key' : 'Save Key'}
              </Text>
            </TouchableOpacity>
          </View>
          {isConfigured && (
            <Text style={styles.statusText}>✅ Gemini API is active</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Edge Case Simulations</Text>
          <Text style={styles.description}>
            Trigger specific scenarios to test the orchestrator's fallback and dispute handling workflows.
          </Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleSimulateDispute}>
            <Text style={styles.actionButtonText}>Simulate Post-Service Dispute</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Debugging</Text>
          <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={handleClearLogs}>
            <Text style={styles.actionButtonText}>Clear Agent Traces</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 80, // Space for trace panel
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  saveButtonSuccess: {
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
