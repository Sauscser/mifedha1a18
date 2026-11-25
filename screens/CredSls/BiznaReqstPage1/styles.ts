import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f9fb',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 22,
  },
  accountText: {
    color: '#183943',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: '#65818a',
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },
  options: {
    gap: 12,
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d8edf3',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#174d5b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },
  numberBadge: {
    alignItems: 'center',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    marginRight: 14,
    width: 44,
  },
  greenBadge: {
    backgroundColor: '#29e58d',
  },
  blueBadge: {
    backgroundColor: '#dff4fa',
  },
  numberText: {
    color: '#176a83',
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    color: '#183943',
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  chevron: {
    color: '#278aa5',
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 10,
  },
  pressedButton: {
    backgroundColor: '#eaf7fb',
    borderColor: '#8acfe1',
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

export default styles;
