import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f9fb',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  screenTitle: {
    color: '#183943',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 22,
  },
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#d8edf3',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
    shadowColor: '#174d5b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    color: '#287f99',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#29e58d',
    borderColor: '#29e58d',
  },
  primaryButtonText: {
    color: '#123d2b',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#eaf7fb',
    borderColor: '#86cfe2',
  },
  secondaryButtonText: {
    color: '#176a83',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  destructiveButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#f0b5b5',
  },
  destructiveButtonText: {
    color: '#a83232',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressedButton: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});

export default styles;
