import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f3f9fb',
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 36,
  },
  screenTitle: {
    color: '#183943',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#d8edf3',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#174d5b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },
  sectionTitle: {
    color: '#287f99',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#29e58d',
    borderColor: '#20c879',
  },
  primaryButtonText: {
    color: '#123d2b',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#eaf7fb',
    borderColor: '#86cfe2',
  },
  secondaryButtonText: {
    color: '#176a83',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  historyRow: {
    borderTopColor: '#e7f1f4',
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 12,
  },
  historyLabel: {
    color: '#183943',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  historyButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  historyButton: {
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pressedButton: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});

export default styles;
