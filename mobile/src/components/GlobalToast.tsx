import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { hideToast } from '../store/uiSlice';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function GlobalToast() {
  const { toast, downloadProgress } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (toast) {
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
      }).start();
      
      // Auto-close if there is no active download
      if (!downloadProgress) {
        const timer = setTimeout(() => {
          closeToast();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [toast, downloadProgress]);

  const closeToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      dispatch(hideToast());
    });
  };

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      default: return 'information-circle';
    }
  };

  const getColor = () => {
    switch (toast.type) {
      case 'success': return '#1DB954';
      case 'error': return '#e22134';
      default: return '#3b82f6';
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View style={styles.contentRow}>
        <View style={[styles.iconContainer, { backgroundColor: getColor() }]}>
          <Ionicons name={getIcon()} size={24} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{toast.title}</Text>
          <Text style={styles.message}>{toast.message}</Text>
        </View>
        
        {toast.actionLabel && toast.actionRoute && (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => {
              router.push(toast.actionRoute);
              closeToast();
            }}
          >
            <Text style={styles.actionBtnText}>{toast.actionLabel}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={closeToast} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color="#b3b3b3" />
        </TouchableOpacity>
      </View>

      {downloadProgress && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${downloadProgress.progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{downloadProgress.text}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: '#282828',
    borderRadius: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  actionBtn: {
    backgroundColor: '#3e3e3e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 10,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
    marginLeft: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  progressSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  progressText: {
    color: '#1DB954',
    fontSize: 12,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  }
});
