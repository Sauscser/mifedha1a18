import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

const CustomAlert = ({ visible, message, onClose, actions }) => {
  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalText}>{message}</Text>
          {actions?.length ? (
            <View style={styles.actions}>
              {actions.map((action) => (
                <Pressable key={action.label} onPress={action.onPress} style={[styles.modalButton, action.secondary && styles.secondaryButton]}>
                  <Text style={[styles.modalButtonText, action.secondary && styles.secondaryButtonText]}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable onPress={onClose} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#374151',
  },
});

export default CustomAlert;
