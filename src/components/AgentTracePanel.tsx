import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { AgentTrace, subscribeToTraces } from '@/engine/AntigravityAgent';

export const AgentTracePanel = () => {
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [expanded, setExpanded] = useState(false);
  const heightAnim = useState(new Animated.Value(60))[0];

  useEffect(() => {
    const unsubscribe = subscribeToTraces((newTraces) => {
      setTraces([...newTraces]);
    });
    return unsubscribe;
  }, []);

  const toggleExpand = () => {
    const toValue = expanded ? 60 : 350;
    Animated.timing(heightAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const getStepColor = (step: AgentTrace['step']) => {
    switch (step) {
      case 'Understanding': return '#3B82F6'; // blue
      case 'Matching': return '#8B5CF6'; // purple
      case 'Decision': return '#10B981'; // green
      case 'Pricing': return '#F59E0B'; // amber
      case 'Simulation': return '#6366F1'; // indigo
      case 'Fallback': return '#EF4444'; // red
      default: return '#6B7280';
    }
  };

  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      <TouchableOpacity onPress={toggleExpand} style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerIcon}>🤖</Text>
          <Text style={styles.headerTitle}>Antigravity Logs ({traces.length})</Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▲'}</Text>
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.scrollArea}>
          {traces.length === 0 && (
            <Text style={styles.emptyText}>Waiting for agent activity...</Text>
          )}
          {traces.map((trace) => (
            <View key={trace.id} style={styles.traceItem}>
              <View style={styles.traceHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={[styles.badge, { backgroundColor: getStepColor(trace.step) }]}>
                    <Text style={styles.badgeText}>{trace.step}</Text>
                  </View>
                  <Text style={styles.agentNameText}>[{trace.agentName}]</Text>
                </View>
                <Text style={styles.timeText}>
                  {trace.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.messageText}>{trace.message}</Text>
              {trace.details && (
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsText}>
                    {JSON.stringify(trace.details, null, 2)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, // Above bottom tabs usually, but let's just make it float
    left: 0,
    right: 0,
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
  },
  expandIcon: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  traceItem: {
    marginBottom: 16,
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#374151',
  },
  traceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  agentNameText: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  messageText: {
    color: '#F3F4F6',
    fontSize: 14,
    lineHeight: 20,
  },
  detailsBox: {
    marginTop: 8,
    backgroundColor: '#111827',
    padding: 8,
    borderRadius: 4,
  },
  detailsText: {
    color: '#10B981',
    fontFamily: 'monospace',
    fontSize: 10,
  },
});
