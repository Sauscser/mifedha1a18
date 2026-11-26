import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EAF7FC'
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 22,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5EDF7',
    shadowColor: '#25677F',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4
  },
  accent: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#87CEEB',
    marginBottom: 18
  },
  title: {
    color: '#164458',
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    color: '#64808A',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 22
  },
  field: {
    marginBottom: 18
  },
  label: {
    color: '#315969',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8
  },
  input: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B7E2F2',
    backgroundColor: '#F7FCFE',
    color: '#173E4E',
    fontSize: 16
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center'
  },
  passwordInput: {
    paddingRight: 76
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 8
  },
  passwordToggleText: {
    color: '#126782',
    fontSize: 13,
    fontWeight: '700'
  },
  button: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: '#87CEEB',
    elevation: 2
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonIndicator: {
    marginRight: 10
  },
  buttonText: {
    color: '#143D4D',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center'
  }
});

export default styles;
